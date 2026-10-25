import { withSession } from "@/lib/auth";
import { deleteEntry, getEntryDetail, updateEntry } from "@/lib/entries";
import { jsonError, readJson } from "@/lib/http";
import { isId, validateEntry } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "기록을 찾지 못했어요.");
    const entry = getEntryDetail(id);
    if (!entry) return jsonError(404, "not_found", "기록을 찾지 못했어요.");
    return Response.json({ entry });
  });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "기록을 찾지 못했어요.");
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = validateEntry(body.value);
    if (!parsed.ok) return jsonError(400, "invalid", parsed.message);
    const entry = updateEntry(id, parsed.value);
    if (!entry) return jsonError(404, "not_found", "기록을 찾지 못했어요.");
    return Response.json({ entry });
  });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "기록을 찾지 못했어요.");
    const removed = await deleteEntry(id);
    if (!removed) return jsonError(404, "not_found", "기록을 찾지 못했어요.");
    return Response.json({ ok: true });
  });
}
