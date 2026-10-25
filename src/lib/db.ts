import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { dataDirectory } from "@/lib/data-path";
import { ensureRemote, usesRemoteDb, watchWrites } from "@/lib/remote-db";

const globalForDb = globalThis as unknown as { diaryDb?: DatabaseSync };

function addColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  if (rows.some((row) => String(row.name) === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      mood TEXT,
      theme TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      mime TEXT NOT NULL,
      filename TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ai_results (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      source TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS question_answers (
      result_id TEXT NOT NULL,
      question_index INTEGER NOT NULL,
      answer TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (result_id, question_index)
    );
    CREATE TABLE IF NOT EXISTS reminders (
      user_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      hour INTEGER NOT NULL DEFAULT 21,
      minute INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_date TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_date, updated_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, task_date, created_at);
    CREATE TABLE IF NOT EXISTS day_stickers (
      user_id TEXT NOT NULL,
      task_date TEXT NOT NULL,
      sticker TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, task_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS day_stamps (
      user_id TEXT NOT NULL,
      task_date TEXT NOT NULL,
      stamp TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, task_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS day_moods (
      user_id TEXT NOT NULL,
      mood_date TEXT NOT NULL,
      mood TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, mood_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS app_secrets (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_photos_entry ON photos(entry_id);
    CREATE INDEX IF NOT EXISTS idx_ai_lookup ON ai_results(scope, scope_id, kind, created_at);
  `);
  addColumn(db, "users", "appearance", "TEXT NOT NULL DEFAULT 'ink'");
  addColumn(db, "entries", "user_id", "TEXT");
  addColumn(db, "photos", "storage", "TEXT NOT NULL DEFAULT 'local'");
  addColumn(db, "ai_results", "user_id", "TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id, entry_date, updated_at)");
}

export { dataDirectory } from "@/lib/data-path";

export function getDb() {
  if (!globalForDb.diaryDb) {
    const dir = dataDirectory();
    fs.mkdirSync(path.join(dir, "photos"), { recursive: true });
    const db = new DatabaseSync(path.join(dir, "diary.sqlite"));
    migrate(db);
    if (usesRemoteDb()) db.exec("PRAGMA journal_mode = DELETE");
    globalForDb.diaryDb = watchWrites(db);
  }
  return globalForDb.diaryDb;
}

export function photoDirectory() {
  return path.join(dataDirectory(), "photos");
}

export function withTransaction<T>(fn: () => T) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already closed */
    }
    throw error;
  }
}
