import { withSession } from "@/lib/auth";
import { runEntryAi } from "@/lib/ai/service";
import { jsonError, readJson } from "@/lib/http";
import { isId } from "@/lib/validate";
import type { AiKind } from "@/lib/types";

function isEntryKind(value: unknown): value is Exclude<AiKind, "monthly"> {
  return value === "summary" || value === "emotion" || value === "empathy" || value === "questions";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "기록을 찾지 못했어요.");
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const data = body.value as Record<string, unknown> | null;
    const kind = data && typeof data === "object" ? data.kind : null;
    if (!isEntryKind(kind)) {
      return jsonError(400, "invalid", "요청한 AI 기능을 확인하지 못했어요.");
    }
    const mode = data?.mode === "test" ? "test" : "live";
    const force = data?.force === true;
    const includePhotos = data?.includePhotos === true;
    const result = await runEntryAi(id, kind, mode, force, includePhotos);
    if (!result.ok) {
      const status = result.code === "not_found" ? 404 : result.code === "busy" ? 429 : result.code === "not_configured" ? 503 : result.code === "invalid" ? 422 : 502;
      return jsonError(status, result.code, result.message);
    }
    return Response.json({ cached: result.cached, entry: result.entry });
  });
}
