import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { dataDirectory, getDb, withTransaction } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { withUser } from "@/lib/user-context";
import type { SessionUser } from "@/lib/session";

const COOKIE = "diary_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret() {
  const fromEnv = process.env.SESSION_SECRET?.trim() ?? "";
  if (fromEnv.length >= 16) return fromEnv;
  const file = path.join(dataDirectory(), "session.secret");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const generated = randomBytes(32).toString("hex");
  fs.writeFileSync(file, generated, { mode: 0o600 });
  return generated;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 32).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split(":");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "base64url");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function tokenFor(userId: string) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function userIdFromToken(token: string) {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: string; exp?: number };
    if (!data.uid || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

async function writeSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const userId = userIdFromToken(token);
  if (!userId) return null;
  const row = getDb().prepare("SELECT id, email, name FROM users WHERE id = ?").get(userId);
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), name: String(row.name) };
}

export async function withSession(fn: () => Promise<Response> | Response) {
  const user = await currentUser();
  if (!user) return jsonError(401, "unauthorized", "로그인이 필요해요.");
  return withUser(user.id, fn);
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return null;
  return email;
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (name.length < 1 || name.length > 40) return null;
  return name;
}

function normalizePassword(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.length < 8 || value.length > 100) return null;
  return value;
}

function claimOrphans(userId: string) {
  const db = getDb();
  const entries = db.prepare("SELECT COUNT(*) AS count FROM entries WHERE user_id IS NULL").get();
  const claimed = Number(entries?.count ?? 0);
  db.prepare("UPDATE entries SET user_id = ? WHERE user_id IS NULL").run(userId);
  db.prepare(
    `UPDATE ai_results SET user_id = ?
     WHERE user_id IS NULL AND (
       scope = 'month' OR scope_id IN (SELECT id FROM entries WHERE user_id = ?)
     )`,
  ).run(userId, userId);
  return claimed;
}

export async function signup(input: unknown) {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const email = normalizeEmail(data.email);
  const name = normalizeName(data.name);
  const password = normalizePassword(data.password);
  if (!email || !name || !password) {
    return { ok: false as const, message: "이름, 이메일, 8자 이상의 비밀번호를 확인해 주세요." };
  }
  const id = crypto.randomUUID();
  try {
    const claimed = withTransaction(() => {
      const countRow = getDb().prepare("SELECT COUNT(*) AS count FROM users").get();
      const first = Number(countRow?.count ?? 0) === 0;
      getDb()
        .prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(id, email, name, hashPassword(password), new Date().toISOString());
      return first ? claimOrphans(id) : 0;
    });
    await writeSession(id);
    return { ok: true as const, user: { id, email, name }, claimed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) return { ok: false as const, message: "이미 사용 중인 이메일이에요." };
    throw error;
  }
}

export async function login(input: unknown) {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const email = normalizeEmail(data.email);
  const password = typeof data.password === "string" ? data.password : "";
  if (!email || !password) return { ok: false as const, message: "이메일 또는 비밀번호가 맞지 않아요." };
  const row = getDb().prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?").get(email);
  if (!row || !verifyPassword(password, String(row.password_hash))) {
    return { ok: false as const, message: "이메일 또는 비밀번호가 맞지 않아요." };
  }
  const user = { id: String(row.id), email: String(row.email), name: String(row.name) };
  await writeSession(user.id);
  return { ok: true as const, user };
}
