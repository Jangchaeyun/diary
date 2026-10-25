import { withSession } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/http";
import { cleanTaskText, deleteTask, updateTask } from "@/lib/tasks";
import { isId } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "할 일을 찾지 못했어요.");
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const value = body.value;
    if (!value || typeof value !== "object") return jsonError(400, "invalid", "할 일을 확인해 주세요.");
    const patch: { text?: string; done?: boolean } = {};
    if ("text" in value) {
      const text = cleanTaskText(value.text);
      if (!text) return jsonError(400, "invalid", "할 일은 80자 안으로 적어 주세요.");
      patch.text = text;
    }
    if ("done" in value) {
      if (typeof value.done !== "boolean") return jsonError(400, "invalid", "완료 표시를 확인해 주세요.");
      patch.done = value.done;
    }
    if (patch.text === undefined && patch.done === undefined) {
      return jsonError(400, "invalid", "바꿀 내용이 없어요.");
    }
    const task = updateTask(id, patch);
    if (!task) return jsonError(404, "not_found", "할 일을 찾지 못했어요.");
    return Response.json({ task });
  });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(400, "invalid", "할 일을 찾지 못했어요.");
    if (!deleteTask(id)) return jsonError(404, "not_found", "할 일을 찾지 못했어요.");
    return Response.json({ ok: true });
  });
}
