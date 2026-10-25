export function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

export async function readJson(request: Request) {
  try {
    return { ok: true as const, value: (await request.json()) as unknown };
  } catch {
    return { ok: false as const, response: jsonError(400, "invalid", "내용을 읽지 못했어요.") };
  }
}
