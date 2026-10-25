export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError("네트워크에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.", "network", 0);
  }
  const data = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
  if (!response.ok) {
    throw new ApiError(data?.message || "요청을 처리하지 못했어요.", data?.code || "error", response.status);
  }
  return data as T;
}
