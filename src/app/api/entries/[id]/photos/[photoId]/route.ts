import { withSession } from "@/lib/auth";
import { deletePhoto } from "@/lib/entries";
import { jsonError } from "@/lib/http";
import { isId } from "@/lib/validate";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await context.params;
  return withSession(async () => {
    if (!isId(id) || !isId(photoId)) return jsonError(400, "invalid", "사진을 찾지 못했어요.");
    const removed = await deletePhoto(id, photoId);
    if (!removed) return jsonError(404, "not_found", "사진을 찾지 못했어요.");
    return Response.json({ ok: true });
  });
}
