import { withSession } from "@/lib/auth";
import { saveAnswer } from "@/lib/entries";
import { jsonError, readJson } from "@/lib/http";
import { isId } from "@/lib/validate";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "기록을 찾지 못했어요.");
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const data = body.value as Record<string, unknown> | null;
    const index = data && typeof data === "object" ? data.index : null;
    const answer = data && typeof data === "object" && typeof data.answer === "string" ? data.answer : null;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > 2 || answer === null) {
      return jsonError(400, "invalid", "답변을 저장할 질문을 확인하지 못했어요.");
    }
    const saved = saveAnswer(id, index, answer);
    if (!saved.ok) return jsonError(400, "invalid", saved.message);
    return Response.json({ entry: saved.entry });
  });
}
