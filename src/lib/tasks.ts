import { getDb } from "@/lib/db";
import type { DayTask } from "@/lib/types";
import { currentUserId } from "@/lib/user-context";

const TEXT_MAX = 80;
const PER_DAY = 40;

type TaskRow = {
  id: string;
  task_date: string;
  text: string;
  done: number;
  created_at: string;
};

function toTask(row: TaskRow): DayTask {
  return {
    id: String(row.id),
    date: String(row.task_date),
    text: String(row.text),
    done: Number(row.done) === 1,
    createdAt: String(row.created_at),
  };
}

export function cleanTaskText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > TEXT_MAX) return null;
  return text;
}

export function listTasks(from: string, to: string) {
  const rows = getDb()
    .prepare(
      `SELECT id, task_date, text, done, created_at
       FROM tasks
       WHERE user_id = ? AND task_date >= ? AND task_date <= ?
       ORDER BY task_date, created_at`,
    )
    .all(currentUserId(), from, to) as TaskRow[];
  return rows.map(toTask);
}

export function createTask(date: string, text: string) {
  const userId = currentUserId();
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND task_date = ?").get(userId, date) as { count: number };
  if (Number(count.count) >= PER_DAY) return { ok: false as const, message: "하루에 적을 수 있는 할 일은 40개까지예요." };
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tasks (id, user_id, task_date, text, done, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
  ).run(id, userId, date, text, now, now);
  const row = db.prepare("SELECT id, task_date, text, done, created_at FROM tasks WHERE id = ? AND user_id = ?").get(id, userId) as TaskRow;
  return { ok: true as const, task: toTask(row) };
}

export function updateTask(id: string, patch: { text?: string; done?: boolean }) {
  const userId = currentUserId();
  const db = getDb();
  const existing = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(id, userId);
  if (!existing) return null;
  const now = new Date().toISOString();
  if (patch.text !== undefined) {
    db.prepare("UPDATE tasks SET text = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(patch.text, now, id, userId);
  }
  if (patch.done !== undefined) {
    db.prepare("UPDATE tasks SET done = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(patch.done ? 1 : 0, now, id, userId);
  }
  const row = db.prepare("SELECT id, task_date, text, done, created_at FROM tasks WHERE id = ? AND user_id = ?").get(id, userId) as TaskRow;
  return toTask(row);
}

export function deleteTask(id: string) {
  const result = getDb().prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, currentUserId());
  return Number(result.changes) > 0;
}
