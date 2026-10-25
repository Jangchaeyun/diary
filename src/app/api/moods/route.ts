import { withSession } from "@/lib/auth";
import { isMoodId } from "@/lib/catalog";
import { isISODate } from "@/lib/dates";
import { jsonError, readJson } from "@/lib/http";
import { listMoods, saveMood } from "@/lib/moods";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withSession(async () => {
    const from = request.nextUrl.searchParams.get("from") ?? "";
    const to = request.nextUrl.searchParams.get("to") ?? "";
    if (!isISODate(from) || !isISODate(to) || from > to) {
      return jsonError(400, "invalid", "날짜 범위를 확인해 주세요.");
    }
    return Response.json({ moods: listMoods(from, to) });
  });
}

export async function PUT(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const value = body.value;
    if (!value || typeof value !== "object") return jsonError(400, "invalid", "기분을 확인해 주세요.");
    const date = "date" in value ? value.date : "";
    const mood = "mood" in value ? value.mood : "";
    if (typeof date !== "string" || !isISODate(date)) return jsonError(400, "invalid", "날짜를 확인해 주세요.");
    if (!isMoodId(mood)) return jsonError(400, "invalid", "기분을 다시 골라 주세요.");
    return Response.json({ mood: saveMood(date, mood) });
  });
}
