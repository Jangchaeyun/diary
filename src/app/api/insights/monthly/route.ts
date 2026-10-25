import { withSession } from "@/lib/auth";
import { runMonthlyAi } from "@/lib/ai/service";
import { jsonError, readJson } from "@/lib/http";
import { validateMonth } from "@/lib/validate";

export async function POST(request: Request) {
  return withSession(async () => {
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const data = body.value as Record<string, unknown> | null;
    const month = validateMonth(data && typeof data === "object" ? data.month : null);
    if (!month) return jsonError(400, "invalid", "달을 다시 확인해 주세요.");
    const mode = data?.mode === "test" ? "test" : "live";
    const force = data?.force === true;
    const result = await runMonthlyAi(month, mode, force);
    if (!result.ok) {
      const status = result.code === "busy" ? 429 : result.code === "not_configured" ? 503 : result.code === "invalid" ? 422 : 502;
      return jsonError(status, result.code, result.message);
    }
    return Response.json(result);
  });
}
