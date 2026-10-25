import { withSession } from "@/lib/auth";
import { isISODate } from "@/lib/dates";
import { jsonError, readJson } from "@/lib/http";
import { isStickerId } from "@/lib/sticker-catalog";
import { placeSticker, removeSticker } from "@/lib/stickers";
import type { NextRequest } from "next/server";

export async function PUT(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const value = body.value;
    if (!value || typeof value !== "object") return jsonError(400, "invalid", "스티커를 확인해 주세요.");
    const date = "date" in value ? value.date : "";
    const sticker = "sticker" in value ? value.sticker : "";
    if (typeof date !== "string" || !isISODate(date)) return jsonError(400, "invalid", "날짜를 확인해 주세요.");
    if (!isStickerId(sticker)) return jsonError(400, "invalid", "스티커를 다시 골라 주세요.");
    const placed = placeSticker(date, sticker);
    if (!placed.ok) return jsonError(400, "invalid", placed.message);
    return Response.json({ sticker: placed.sticker });
  });
}

export async function DELETE(request: NextRequest) {
  return withSession(async () => {
    const date = request.nextUrl.searchParams.get("date") ?? "";
    if (!isISODate(date)) return jsonError(400, "invalid", "날짜를 확인해 주세요.");
    removeSticker(date);
    return Response.json({ ok: true });
  });
}
