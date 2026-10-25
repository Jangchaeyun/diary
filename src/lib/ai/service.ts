import { completeJson } from "@/lib/ai/client";
import { emotionPrompt, empathyPrompt, monthlyPrompt, questionsPrompt, summaryPrompt } from "@/lib/ai/prompts";
import { testEmotion, testEmpathy, testMonthly, testQuestions, testSummary } from "@/lib/ai/test-responses";
import { entryContentHash, hashContent } from "@/lib/hash";
import { LIMITS } from "@/lib/limits";
import { findCachedAi, getEntryDetail, getInsights, photosForAi, saveAiResult } from "@/lib/entries";
import { currentUserId } from "@/lib/user-context";
import type { AiKind, AiSource, EmotionPayload, EntryDetail, SummaryPayload } from "@/lib/types";

const locks = new Set<string>();

type Mode = "live" | "test";

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function asSummary(value: unknown): SummaryPayload | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const summary = clip(data.summary, 800);
  if (!summary) return null;
  const emotions = Array.isArray(data.mainEmotions)
    ? data.mainEmotions.map((item) => clip(item, 20)).filter(Boolean).slice(0, 4)
    : [];
  return {
    summary,
    mainEmotions: emotions,
    goodMoment: clip(data.goodMoment, 400),
    reflection: clip(data.reflection, 400),
    closing: clip(data.closing, 240),
  };
}

function intensity(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  const scaled = number > 1 ? number / 100 : number;
  return Math.min(1, Math.max(0, scaled));
}

function asEmotion(value: unknown): EmotionPayload | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const emotions = Array.isArray(data.emotions)
    ? data.emotions
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const label = clip(row.label, 20);
          if (!label) return null;
          return { label, intensity: intensity(row.intensity) };
        })
        .filter((item): item is { label: string; intensity: number } => Boolean(item))
        .slice(0, 4)
    : [];
  return {
    emotions,
    mixed: Boolean(data.mixed) || emotions.length > 1,
    note: clip(data.note, 300) || "일기 문장에서 읽힌 분위기를 참고용으로 정리한 것입니다.",
  };
}

function asEmpathy(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const message = clip((value as Record<string, unknown>).message, 600);
  if (!message) return null;
  return { message };
}

function asQuestions(value: unknown): { questions: string[] } | null {
  if (!value || typeof value !== "object") return null;
  const list = (value as Record<string, unknown>).questions;
  if (!Array.isArray(list)) return null;
  const questions = list.map((item) => clip(item, 140)).filter(Boolean).slice(0, 3);
  if (questions.length === 0) return null;
  return { questions };
}

function asMonthly(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const events = clip(data.events, 800);
  if (!events) return null;
  const nextQuestions = Array.isArray(data.nextQuestions)
    ? data.nextQuestions.map((item) => clip(item, 140)).filter(Boolean).slice(0, 3)
    : [];
  return {
    events,
    emotionFlow: clip(data.emotionFlow, 600),
    happyMoments: clip(data.happyMoments, 600),
    interests: clip(data.interests, 400),
    nextQuestions,
  };
}

function failure(message: string, code: "not_configured" | "upstream" | "invalid" | "busy" | "not_found") {
  return { ok: false as const, message, code };
}

async function remember(
  scope: "entry" | "month",
  scopeId: string,
  kind: AiKind,
  hash: string,
  source: AiSource,
  payload: unknown,
  force: boolean,
) {
  if (!force) {
    const cached = findCachedAi(scope, scopeId, kind, hash, source);
    if (cached) return { cached: true as const };
  }
  saveAiResult({ scope, scopeId, kind, hash, source, payload });
  return { cached: false as const };
}

export async function runEntryAi(
  id: string,
  kind: Exclude<AiKind, "monthly">,
  mode: Mode,
  force: boolean,
  includePhotos = false,
) {
  const lockKey = `entry:${currentUserId()}:${id}:${kind}:${includePhotos ? "photo" : "text"}`;
  if (locks.has(lockKey)) return failure("이미 같은 기록을 읽고 있어요.", "busy");
  locks.add(lockKey);
  try {
    const entry = getEntryDetail(id);
    if (!entry) return failure("기록을 찾지 못했어요.", "not_found");
    if (!entry.body.trim()) return failure("분석할 본문이 아직 없어요.", "invalid");
    let images: { mime: string; base64: string }[] | undefined;
    let photoNote: string | undefined;
    let photoKey = "";
    if (includePhotos && mode === "live") {
      const packed = await photosForAi(id);
      if (!packed.images.length) return failure(packed.message, "invalid");
      images = packed.images;
      photoNote = packed.note;
      photoKey = packed.ids.join(",");
    }
    const hash = photoKey ? hashContent(`${entryContentHash(entry)}\nphotos:${photoKey}`) : entryContentHash(entry);
    const prompt = {
      summary: summaryPrompt(entry, photoNote),
      emotion: emotionPrompt(entry, photoNote),
      empathy: empathyPrompt(entry, photoNote),
      questions: questionsPrompt(entry, photoNote),
    }[kind];

    let payload: unknown;
    if (mode === "test") {
      payload =
        kind === "summary"
          ? testSummary(entry)
          : kind === "emotion"
            ? testEmotion()
            : kind === "empathy"
              ? testEmpathy(entry)
              : testQuestions();
    } else {
      const live = await completeJson(prompt.system, prompt.user, images ? 45000 : 30000, images);
      if (!live.ok) return failure(live.message, live.code);
      payload =
        kind === "summary"
          ? asSummary(live.value)
          : kind === "emotion"
            ? asEmotion(live.value)
            : kind === "empathy"
              ? asEmpathy(live.value)
              : asQuestions(live.value);
      if (!payload) return failure("AI 응답에서 필요한 내용을 찾지 못했어요. 다시 시도해 주세요.", "invalid");
    }

    const stored =
      kind === "questions"
        ? {
            questions: (payload as { questions: string[] }).questions.map((text, index) => ({
              index,
              text,
              answer: null,
            })),
          }
        : payload;
    const saved = await remember("entry", id, kind, hash, mode === "test" ? "test" : "llm", stored, force);
    const fresh = getEntryDetail(id) as EntryDetail;
    return { ok: true as const, cached: saved.cached, entry: fresh };
  } finally {
    locks.delete(lockKey);
  }
}

export async function runMonthlyAi(month: string, mode: Mode, force: boolean) {
  const lockKey = `month:${currentUserId()}:${month}`;
  if (locks.has(lockKey)) return failure("이미 이번 달 기록을 읽고 있어요.", "busy");
  locks.add(lockKey);
  try {
    const insights = getInsights(month);
    if (!insights.sufficient) {
      return {
        ok: true as const,
        status: "insufficient" as const,
        entryCount: insights.entryCount,
        message: `이번 달에는 본문이 있는 기록이 ${insights.entryCount}편이에요. ${LIMITS.monthlyMinEntries}편이 모이기 전에는 추측해서 회고를 만들지 않아요.`,
      };
    }
    const hash = hashContent(
      insights.entries
        .map((entry) => [entry.id, entry.updatedAt, entry.entryDate, entry.mood ?? "", entry.title, entry.body].join("\n"))
        .sort()
        .join("\n---\n"),
    );
    let payload: unknown;
    if (mode === "test") {
      payload = testMonthly(insights.entries);
    } else {
      const prompt = monthlyPrompt(month, insights.entries);
      const live = await completeJson(prompt.system, prompt.user, 45000);
      if (!live.ok) return failure(live.message, live.code);
      payload = asMonthly(live.value);
      if (!payload) return failure("AI 응답에서 월간 회고를 읽지 못했어요. 다시 시도해 주세요.", "invalid");
    }
    const saved = await remember("month", month, "monthly", hash, mode === "test" ? "test" : "llm", payload, force);
    const fresh = getInsights(month);
    return {
      ok: true as const,
      status: "ready" as const,
      cached: saved.cached,
      monthly: fresh.monthly,
      entryCount: fresh.entryCount,
    };
  } finally {
    locks.delete(lockKey);
  }
}
