import { isMoodId } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import type { MoodId } from "@/lib/types";
import { currentUserId } from "@/lib/user-context";

export type DayMood = {
  date: string;
  mood: MoodId;
};

export function listMoods(from: string, to: string) {
  const rows = getDb()
    .prepare(
      `SELECT mood_date, mood FROM day_moods
       WHERE user_id = ? AND mood_date >= ? AND mood_date <= ?
       ORDER BY mood_date`,
    )
    .all(currentUserId(), from, to) as { mood_date: string; mood: string }[];
  return rows.flatMap((row) => {
    if (!isMoodId(row.mood)) return [];
    return [{ date: String(row.mood_date), mood: row.mood }];
  });
}

export function rememberMood(date: string, mood: MoodId) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO day_moods (user_id, mood_date, mood, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, mood_date) DO UPDATE SET mood = excluded.mood, updated_at = excluded.updated_at`,
    )
    .run(currentUserId(), date, mood, now);
  return { date, mood };
}

export function saveMood(date: string, mood: MoodId) {
  const saved = rememberMood(date, mood);
  const now = new Date().toISOString();
  const userId = currentUserId();
  getDb()
    .prepare(
      `UPDATE entries SET mood = ?, updated_at = ?
       WHERE user_id = ? AND entry_date = ? AND status = 'saved'
         AND id = (
           SELECT id FROM entries
           WHERE user_id = ? AND entry_date = ? AND status = 'saved'
           ORDER BY updated_at DESC
           LIMIT 1
         )`,
    )
    .run(mood, now, userId, date, userId, date);
  return saved;
}
