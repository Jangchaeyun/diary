import { getDb } from "@/lib/db";
import { currentUserId } from "@/lib/user-context";

export type Reminder = { enabled: boolean; hour: number; minute: number };

export function getReminder(): Reminder {
  const row = getDb().prepare("SELECT enabled, hour, minute FROM reminders WHERE user_id = ?").get(currentUserId());
  if (!row) return { enabled: false, hour: 21, minute: 0 };
  return {
    enabled: Number(row.enabled) === 1,
    hour: Number(row.hour),
    minute: Number(row.minute),
  };
}

export function saveReminder(enabled: boolean, hour: number, minute: number): Reminder {
  const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
  const safeMinute = Math.min(59, Math.max(0, Math.floor(minute)));
  getDb()
    .prepare(
      `INSERT INTO reminders (user_id, enabled, hour, minute)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, hour = excluded.hour, minute = excluded.minute`,
    )
    .run(currentUserId(), enabled ? 1 : 0, safeHour, safeMinute);
  return getReminder();
}
