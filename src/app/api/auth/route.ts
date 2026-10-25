import { clearSession, currentUser, login, signup } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/http";

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError(401, "unauthorized", "로그인이 필요해요.");
  return Response.json({ user });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const data = body.value as Record<string, unknown> | null;
  const mode = data && typeof data === "object" && data.mode === "signup" ? "signup" : "login";
  const result = mode === "signup" ? await signup(data) : await login(data);
  if (!result.ok) return jsonError(400, "invalid", result.message);
  return Response.json(result);
}

export async function DELETE() {
  await clearSession();
  return Response.json({ ok: true });
}
