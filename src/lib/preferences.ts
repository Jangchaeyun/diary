import { isAppearanceId, type AppearanceId } from "@/lib/appearances";
import { getDb } from "@/lib/db";
import { currentUserId } from "@/lib/user-context";

export function getAppearance(): AppearanceId {
  const row = getDb().prepare("SELECT appearance FROM users WHERE id = ?").get(currentUserId()) as { appearance?: string } | undefined;
  return isAppearanceId(row?.appearance) ? row.appearance : "ink";
}

export function saveAppearance(value: AppearanceId): AppearanceId {
  getDb().prepare("UPDATE users SET appearance = ? WHERE id = ?").run(value, currentUserId());
  return value;
}
