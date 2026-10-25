import { withSession } from "@/lib/auth";
import { buildDiaryZip } from "@/lib/export";
import { todayISO } from "@/lib/dates";

export async function GET() {
  return withSession(async () => {
    const zip = await buildDiaryZip();
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="diary-${todayISO()}.zip"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
