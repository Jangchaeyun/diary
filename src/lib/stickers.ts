import { getDb } from "@/lib/db";
import { isStickerId, type DaySticker, type StickerId } from "@/lib/sticker-catalog";
import { currentUserId } from "@/lib/user-context";

export type { DaySticker, StickerId };

export function listStickers(from: string, to: string) {
  const rows = getDb()
    .prepare(
      `SELECT task_date, sticker FROM day_stickers
       WHERE user_id = ? AND task_date >= ? AND task_date <= ?
       ORDER BY task_date`,
    )
    .all(currentUserId(), from, to) as { task_date: string; sticker: string }[];
  return rows.flatMap((row) => {
    if (!isStickerId(row.sticker)) return [];
    return [{ date: String(row.task_date), sticker: row.sticker }];
  });
}

export function placeSticker(date: string, sticker: StickerId) {
  const userId = currentUserId();
  const rows = getDb()
    .prepare("SELECT done FROM tasks WHERE user_id = ? AND task_date = ?")
    .all(userId, date) as { done: number }[];
  if (rows.length === 0 || rows.some((row) => Number(row.done) !== 1)) {
    return { ok: false as const, message: "할 일을 모두 완료하면 스티커를 붙일 수 있어요." };
  }
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO day_stickers (user_id, task_date, sticker, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, task_date) DO UPDATE SET sticker = excluded.sticker, updated_at = excluded.updated_at`,
    )
    .run(userId, date, sticker, now);
  return { ok: true as const, sticker: { date, sticker } };
}

export function removeSticker(date: string) {
  const result = getDb().prepare("DELETE FROM day_stickers WHERE user_id = ? AND task_date = ?").run(currentUserId(), date);
  return Number(result.changes) > 0;
}
