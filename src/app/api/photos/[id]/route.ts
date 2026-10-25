import { withSession } from "@/lib/auth";
import { readPhoto } from "@/lib/entries";
import { jsonError } from "@/lib/http";
import { isId } from "@/lib/validate";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withSession(async () => {
    if (!isId(id)) return jsonError(404, "not_found", "사진을 찾지 못했어요.");
    const photo = await readPhoto(id);
    if (!photo) return jsonError(404, "not_found", "사진을 찾지 못했어요.");
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mime,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
