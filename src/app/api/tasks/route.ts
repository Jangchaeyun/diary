import { withSession } from "@/lib/auth";
import { isISODate } from "@/lib/dates";
import { jsonError, readJson } from "@/lib/http";
import { listStamps } from "@/lib/stamps";
import { listStickers } from "@/lib/stickers";
import { cleanTaskText, createTask, listTasks } from "@/lib/tasks";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withSession(async () => {
    const from = request.nextUrl.searchParams.get("from") ?? "";
    const to = request.nextUrl.searchParams.get("to") ?? "";
    if (!isISODate(from) || !isISODate(to) || from > to) {
      return jsonError(400, "invalid", "날짜 범위를 확인해 주세요.");
    }
    return Response.json({ tasks: listTasks(from, to), stickers: listStickers(from, to), stamps: listStamps(from, to) });
  });
}

export async function POST(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const value = body.value;
    if (!value || typeof value !== "object") return jsonError(400, "invalid", "할 일을 확인해 주세요.");
    const date = "date" in value ? value.date : "";
    const text = cleanTaskText("text" in value ? value.text : "");
    if (typeof date !== "string" || !isISODate(date)) return jsonError(400, "invalid", "날짜를 확인해 주세요.");
    if (!text) return jsonError(400, "invalid", "할 일은 80자 안으로 적어 주세요.");
    const created = createTask(date, text);
    if (!created.ok) return jsonError(400, "invalid", created.message);
    return Response.json({ task: created.task }, { status: 201 });
  });
}
