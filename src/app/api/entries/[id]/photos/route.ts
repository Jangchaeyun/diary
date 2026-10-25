import { withSession } from "@/lib/auth";
import { addPhoto, getEntry } from "@/lib/entries";
import { jsonError } from "@/lib/http";
import { isId } from "@/lib/validate";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id) || !getEntry(id)) return jsonError(404, "not_found", "기록을 찾지 못했어요.");
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError(400, "invalid", "사진 파일을 읽지 못했어요.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(400, "invalid", "사진 파일을 찾지 못했어요.");
    const saved = await addPhoto(id, file);
    if (!saved.ok) return jsonError(saved.status, saved.status === 404 ? "not_found" : "invalid", saved.message);
    return Response.json({ photo: saved.photo }, { status: 201 });
  });
}
