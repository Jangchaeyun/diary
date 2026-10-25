import { isMoodId, isThemeId } from "@/lib/catalog";
import { isISODate, isYearMonth } from "@/lib/dates";
import { LIMITS } from "@/lib/limits";
import type { EntryInput } from "@/lib/types";

export function validateEntry(input: unknown): { ok: true; value: EntryInput } | { ok: false; message: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "기록 형식이 올바르지 않아요." };
  }
  const data = input as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const body = typeof data.body === "string" ? data.body.replace(/\r\n/g, "\n").trim() : "";
  if (title.length > LIMITS.title) {
    return { ok: false, message: `제목은 ${LIMITS.title}자까지 적을 수 있어요.` };
  }
  if (body.length > LIMITS.body) {
    return { ok: false, message: `본문은 ${LIMITS.body.toLocaleString("ko-KR")}자까지 적을 수 있어요.` };
  }
  if (data.mood !== null && data.mood !== undefined && data.mood !== "" && !isMoodId(data.mood)) {
    return { ok: false, message: "기분을 다시 골라 주세요." };
  }
  if (!isThemeId(data.theme)) {
    return { ok: false, message: "일기 테마를 다시 골라 주세요." };
  }
  if (typeof data.entryDate !== "string" || !isISODate(data.entryDate)) {
    return { ok: false, message: "날짜를 다시 확인해 주세요." };
  }
  if (data.status !== "draft" && data.status !== "saved") {
    return { ok: false, message: "저장 상태를 확인하지 못했어요." };
  }
  if (data.status === "saved" && body.length === 0) {
    return { ok: false, message: "오늘 이야기를 조금만 적어 주실래요?" };
  }
  if (data.status === "draft" && title.length === 0 && body.length === 0) {
    return { ok: false, message: "임시로 남길 문장이 아직 없어요." };
  }
  return {
    ok: true,
    value: {
      title,
      body,
      mood: isMoodId(data.mood) ? data.mood : null,
      theme: data.theme,
      entryDate: data.entryDate,
      status: data.status,
    },
  };
}

export function isId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateMonth(value: unknown) {
  if (typeof value !== "string" || !isYearMonth(value)) return null;
  return value;
}
