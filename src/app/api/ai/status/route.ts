import { aiConfig } from "@/lib/ai/client";

export async function GET() {
  return Response.json(aiConfig());
}
