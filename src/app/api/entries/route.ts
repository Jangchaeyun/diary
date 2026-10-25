import { withSession } from "@/lib/auth";
import { isMoodId } from "@/lib/catalog";
import { isISODate } from "@/lib/dates";
import { createEntry, listEntries } from "@/lib/entries";
import { jsonError, readJson } from "@/lib/http";
import { validateEntry } from "@/lib/validate";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withSession(async () => {
    const params = request.nextUrl.searchParams;
    const mood = params.get("mood");
    const status = params.get("status");
    const from = params.get("from");
    const to = params.get("to");
    if (mood && !isMoodId(mood)) return jsonError(400, "invalid", "기분 필터를 다시 골라 주세요.");
    if (status && status !== "draft" && status !== "saved") {
      return jsonError(400, "invalid", "저장 상태를 확인해 주세요.");
    }
    if (from && !isISODate(from)) return jsonError(400, "invalid", "시작 날짜를 확인해 주세요.");
    if (to && !isISODate(to)) return jsonError(400, "invalid", "끝 날짜를 확인해 주세요.");
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? 30) || 30));
    const offset = Math.max(0, Number(params.get("offset") ?? 0) || 0);
    const q = params.get("q")?.trim() ?? "";
    return Response.json(
      listEntries({
        q: q || undefined,
        mood: mood && isMoodId(mood) ? mood : undefined,
        status: status === "draft" || status === "saved" ? status : undefined,
        from: from ?? undefined,
        to: to ?? undefined,
        hasPhoto: params.get("hasPhoto") === "1",
        limit,
        offset,
      }),
    );
  });
}

export async function POST(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = validateEntry(body.value);
    if (!parsed.ok) return jsonError(400, "invalid", parsed.message);
    return Response.json({ entry: createEntry(parsed.value) }, { status: 201 });
  });
}
