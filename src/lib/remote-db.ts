import fs from "node:fs";
import path from "node:path";
import { after } from "next/server";
import type { DatabaseSync } from "node:sqlite";
import { dataDirectory } from "@/lib/data-path";

const KEY = "diary/diary.sqlite";

let uploadQueued = false;
let hydrated: Promise<void> | null = null;

export function sqliteFile() {
  return path.join(dataDirectory(), "diary.sqlite");
}

export function usesRemoteDb() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

export function ensureRemote() {
  if (!usesRemoteDb()) return Promise.resolve();
  if (!hydrated) {
    hydrated = downloadSqlite().catch((error: unknown) => {
      hydrated = null;
      throw error;
    });
  }
  return hydrated;
}

async function downloadSqlite() {
  const dest = sqliteFile();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return;
  const { BlobNotFoundError, get } = await import("@vercel/blob");
  try {
    const result = await get(KEY, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return;
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const step = await reader.read();
      if (step.done) break;
      if (step.value) chunks.push(step.value);
    }
    fs.writeFileSync(dest, Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
  } catch (error) {
    if (error instanceof BlobNotFoundError || (error instanceof Error && error.name === "BlobNotFoundError")) return;
    throw error;
  }
}

export function watchWrites(db: DatabaseSync) {
  if (!usesRemoteDb()) return db;
  const prepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => {
    const statement = prepare(sql);
    if (!/^\s*(insert|update|delete|replace)\b/i.test(sql)) return statement;
    const run = statement.run.bind(statement);
    statement.run = ((...args: unknown[]) => {
      const result = run(...args);
      queueUpload(db);
      return result;
    }) as typeof statement.run;
    return statement;
  }) as typeof db.prepare;
  return db;
}

function queueUpload(db: DatabaseSync) {
  if (uploadQueued) return;
  uploadQueued = true;
  const flush = () => uploadSqlite(db).finally(() => {
    uploadQueued = false;
  });
  try {
    after(() => flush());
  } catch {
    void flush();
  }
}

async function uploadSqlite(db: DatabaseSync) {
  try {
    db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    /* checkpoint is best-effort */
  }
  const bytes = fs.readFileSync(sqliteFile());
  const { put } = await import("@vercel/blob");
  await put(KEY, bytes, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/octet-stream",
    ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
  });
}
