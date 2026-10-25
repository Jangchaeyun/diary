import { getDb } from "@/lib/db";
import { isStampId, type DayStamp, type StampId } from "@/lib/stamp-catalog";
import { currentUserId } from "@/lib/user-context";

export type { DayStamp, StampId };

export function listStamps(from: string, to: string) {
  const rows = getDb()
    .prepare(
      `SELECT task_date, stamp FROM day_stamps
       WHERE user_id = ? AND task_date >= ? AND task_date <= ?
       ORDER BY task_date`,
    )
    .all(currentUserId(), from, to) as { task_date: string; stamp: string }[];
  return rows.flatMap((row) => {
    if (!isStampId(row.stamp)) return [];
    return [{ date: String(row.task_date), stamp: row.stamp }];
  });
}

export function placeStamp(date: string, stamp: StampId) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO day_stamps (user_id, task_date, stamp, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, task_date) DO UPDATE SET stamp = excluded.stamp, updated_at = excluded.updated_at`,
    )
    .run(currentUserId(), date, stamp, now);
  return { date, stamp };
}

export function removeStamp(date: string) {
  const result = getDb().prepare("DELETE FROM day_stamps WHERE user_id = ? AND task_date = ?").run(currentUserId(), date);
  return Number(result.changes) > 0;
}
