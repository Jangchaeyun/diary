import { withSession } from "@/lib/auth";
import { isISODate } from "@/lib/dates";
import { jsonError, readJson } from "@/lib/http";
import { isStampId } from "@/lib/stamp-catalog";
import { placeStamp, removeStamp } from "@/lib/stamps";
import type { NextRequest } from "next/server";

export async function PUT(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const value = body.value;
    if (!value || typeof value !== "object") return jsonError(400, "invalid", "도장을 확인해 주세요.");
    const date = "date" in value ? value.date : "";
    const stamp = "stamp" in value ? value.stamp : "";
    if (typeof date !== "string" || !isISODate(date)) return jsonError(400, "invalid", "날짜를 확인해 주세요.");
    if (!isStampId(stamp)) return jsonError(400, "invalid", "도장을 다시 골라 주세요.");
    return Response.json({ stamp: placeStamp(date, stamp) });
  });
}

export async function DELETE(request: NextRequest) {
  return withSession(async () => {
    const date = request.nextUrl.searchParams.get("date") ?? "";
    if (!isISODate(date)) return jsonError(400, "invalid", "날짜를 확인해 주세요.");
    removeStamp(date);
    return Response.json({ ok: true });
  });
}
