export type AiConfig = {
  configured: boolean;
  model: string | null;
  providerHost: string | null;
};

export function aiConfig(): AiConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  let providerHost: string | null = null;
  try {
    providerHost = new URL(baseUrl).host;
  } catch {
    providerHost = null;
  }
  return {
    configured: Boolean(apiKey),
    model: apiKey ? model : null,
    providerHost: apiKey ? providerHost : null,
  };
}

type CompleteResult =
  | { ok: true; value: unknown }
  | { ok: false; code: "not_configured" | "upstream" | "invalid"; message: string };

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed) as unknown;
}

function upstreamMessage(status: number) {
  if (status === 401 || status === 403) return "API 키를 확인하지 못했어요. 서버 환경 변수를 다시 살펴봐 주세요.";
  if (status === 429) return "AI 요청이 잠시 많아 거절되었어요. 조금 뒤 다시 시도해 주세요.";
  if (status >= 500) return "AI 서버에 문제가 있어요. 잠시 뒤 다시 시도해 주세요.";
  return "AI 요청을 처리하지 못했어요. 모델 이름과 주소를 확인해 주세요.";
}

async function postChat(
  withFormat: boolean,
  system: string,
  user: string,
  signal: AbortSignal,
  images?: { mime: string; base64: string }[],
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const content = images?.length
    ? [
        { type: "text", text: user },
        ...images.map((image) => ({
          type: "image_url",
          image_url: { url: `data:${image.mime};base64,${image.base64}` },
        })),
      ]
    : user;
  const body: Record<string, unknown> = {
    model,
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
  };
  if (withFormat) body.response_format = { type: "json_object" };
  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
}

export async function completeJson(
  system: string,
  user: string,
  timeoutMs = 30000,
  images?: { mime: string; base64: string }[],
): Promise<CompleteResult> {
  if (!aiConfig().configured) {
    return {
      ok: false,
      code: "not_configured",
      message: "AI API가 아직 연결되지 않았어요. 서버의 환경 변수에 키를 넣은 뒤 다시 요청해 주세요.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await postChat(true, system, user, controller.signal, images);
    if (response.status === 400) {
      response = await postChat(false, system, user, controller.signal, images);
    }
    if (!response.ok) {
      return { ok: false, code: "upstream", message: upstreamMessage(response.status) };
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return { ok: false, code: "invalid", message: "AI 응답에서 내용을 찾지 못했어요." };
    try {
      return { ok: true, value: extractJson(text) };
    } catch {
      return { ok: false, code: "invalid", message: "AI 응답 형식을 읽지 못했어요. 다시 시도해 주세요." };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, code: "upstream", message: "응답이 오래 걸려 멈췄어요. 다시 시도해 주세요." };
    }
    return { ok: false, code: "upstream", message: "네트워크 문제로 AI에 연결하지 못했어요." };
  } finally {
    clearTimeout(timer);
  }
}
