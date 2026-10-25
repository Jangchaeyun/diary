import { isAppearanceId } from "@/lib/appearances";
import { withSession } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/http";
import { getAppearance, saveAppearance } from "@/lib/preferences";
import { getReminder, saveReminder } from "@/lib/reminders";
import { storageStatus } from "@/lib/storage";

export async function GET() {
  return withSession(async () => {
    return Response.json({ appearance: getAppearance(), reminder: getReminder(), storage: storageStatus() });
  });
}

export async function PATCH(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const data = body.value as Record<string, unknown> | null;
    if (data && typeof data.appearance === "string") {
      if (!isAppearanceId(data.appearance)) return jsonError(400, "invalid", "테마를 다시 골라 주세요.");
      return Response.json({ appearance: saveAppearance(data.appearance) });
    }
    if (!data || typeof data.enabled !== "boolean" || typeof data.hour !== "number" || typeof data.minute !== "number") {
      return jsonError(400, "invalid", "알림 시각을 다시 확인해 주세요.");
    }
    return Response.json({ reminder: saveReminder(data.enabled, data.hour, data.minute) });
  });
}
