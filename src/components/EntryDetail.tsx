"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiSection } from "@/components/AiSection";
import { Modal } from "@/components/Modal";
import { Meter, PageSkeleton } from "@/components/States";
import { ApiError, api } from "@/lib/api";
import { getMood, getTheme } from "@/lib/catalog";
import { AI_DISCLAIMER } from "@/lib/copy";
import { formatClock, formatKoreanDate } from "@/lib/dates";
import type { AiKind, AiSource, EntryDetail as EntryDetailData } from "@/lib/types";

type Kind = Exclude<AiKind, "monthly">;

export function EntryDetail({ id }: { id: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetailData | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Kind | null>(null);
  const [problems, setProblems] = useState<Partial<Record<Kind, string>>>({});
  const [notes, setNotes] = useState<Partial<Record<Kind, string>>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendPhotos, setSendPhotos] = useState(false);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerError, setAnswerError] = useState("");

  async function load() {
    setError("");
    try {
      const [detail, status] = await Promise.all([
        api<{ entry: EntryDetailData }>(`/api/entries/${id}`),
        api<{ configured: boolean }>("/api/ai/status"),
      ]);
      setEntry(detail.entry);
      setConfigured(status.configured);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "기록을 불러오지 못했어요.");
    }
  }

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        const [detail, status] = await Promise.all([
          api<{ entry: EntryDetailData }>(`/api/entries/${id}`),
          api<{ configured: boolean }>("/api/ai/status"),
        ]);
        if (ignore) return;
        setEntry(detail.entry);
        setConfigured(status.configured);
      } catch (reason) {
        if (!ignore) setError(reason instanceof ApiError ? reason.message : "기록을 불러오지 못했어요.");
      }
    }
    void run();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function runAi(kind: Kind, mode: "live" | "test", force = false) {
    setBusy(kind);
    setProblems((current) => ({ ...current, [kind]: "" }));
    try {
      const data = await api<{ cached: boolean; entry: EntryDetailData }>(`/api/entries/${id}/ai`, {
        method: "POST",
        body: JSON.stringify({ kind, mode, force, includePhotos: mode === "live" && sendPhotos }),
      });
      setEntry(data.entry);
      setNotes((current) => ({
        ...current,
        [kind]: data.cached ? "같은 내용이라 저장된 결과를 다시 보여 드려요." : "",
      }));
    } catch (reason) {
      setProblems((current) => ({
        ...current,
        [kind]: reason instanceof ApiError ? reason.message : "AI 요청을 마치지 못했어요.",
      }));
    } finally {
      setBusy(null);
    }
  }

  async function saveAnswer(index: number) {
    setAnswerError("");
    try {
      const data = await api<{ entry: EntryDetailData }>(`/api/entries/${id}/answers`, {
        method: "POST",
        body: JSON.stringify({ index, answer: answerText }),
      });
      setEntry(data.entry);
      setAnswerIndex(null);
      setAnswerText("");
    } catch (reason) {
      setAnswerError(reason instanceof ApiError ? reason.message : "답을 저장하지 못했어요.");
    }
  }

  async function remove() {
    try {
      await api(`/api/entries/${id}`, { method: "DELETE" });
      router.push("/memories");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "삭제하지 못했어요.");
      setDeleteOpen(false);
    }
  }

  if (error && !entry) {
    return (
      <div className="page">
        <div className="error-box" role="alert">
          <p>{error}</p>
          <button className="btn btn-soft" type="button" onClick={() => void load()}>다시 시도</button>
        </div>
      </div>
    );
  }
  if (!entry) return <PageSkeleton />;

  const mood = getMood(entry.mood);
  const theme = getTheme(entry.theme);
  const date = formatKoreanDate(entry.entryDate);
  const questions = entry.ai.questions;

  function resultMeta(source: AiSource, createdAt: string, stale: boolean) {
    return { source, createdAt, stale };
  }

  return (
    <article className="page reading" style={{ background: theme.paper }}>
      <div className="spread">
        <Link href="/memories" className="faint">추억으로</Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/write/${entry.id}`} className="btn btn-soft" style={{ minHeight: 40 }}>수정</Link>
          <button className="btn btn-ghost" type="button" style={{ minHeight: 40 }} onClick={() => setDeleteOpen(true)}>삭제</button>
        </div>
      </div>
      <p className="eyebrow" style={{ marginTop: 18 }}>{date.full}</p>
      <h1>{entry.title.trim() || "제목 없는 기록"}</h1>
      <div className="meta">
        {mood ? <span className="seal" style={{ background: mood.soft }}>{mood.emoji}</span> : null}
        <span>{mood ? `내가 고른 기분 · ${mood.label}` : "고른 기분 없음"}</span>
        <span>{formatClock(entry.createdAt)}</span>
        {entry.status === "draft" ? <span className="badge">임시</span> : null}
      </div>
      {entry.photos.length ? (
        <div className="reading-photos">
          {entry.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={`/api/photos/${photo.id}`} alt="일기에 첨부한 사진" />
          ))}
        </div>
      ) : null}
      <p className="prose">{entry.body}</p>
      <p className="faint">AI 기능은 아래 버튼을 눌렀을 때만 실행돼요. 사진을 함께 보내려면 그 선택을 켠 뒤에 부탁해 주세요. API 키는 화면에 나오지 않아요. <Link href="/privacy">개인정보 안내</Link></p>
      {entry.photos.length ? (
        <label className="card spread" style={{ marginTop: 14, alignItems: "flex-start" }}>
          <span>
            <strong>사진을 AI에 함께 보내기</strong>
            <span className="faint" style={{ display: "block", marginTop: 4 }}>켜 두면 아래 버튼을 눌렀을 때 첨부 사진이 LLM 제공자에게 전달돼요. 테스트 예시는 사진을 보지 않아요. 2MB 이하 사진만, 최대 두 장이에요.</span>
          </span>
          <input type="checkbox" checked={sendPhotos} onChange={(event) => setSendPhotos(event.target.checked)} />
        </label>
      ) : null}

      <AiSection
        title="하루 요약"
        description="오늘 하루의 핵심, 좋았던 순간, 가볍게 돌아볼 점을 정리해요."
        configured={configured}
        loading={busy === "summary"}
        error={problems.summary ?? null}
        notice={notes.summary}
        result={entry.ai.summary ? resultMeta(entry.ai.summary.source, entry.ai.summary.createdAt, entry.ai.summary.stale) : null}
        onRun={(mode, force) => void runAi("summary", mode, force)}
      >
        {entry.ai.summary ? (
          <div className="stack">
            <p className="prose" style={{ margin: 0 }}>{entry.ai.summary.payload.summary}</p>
            {entry.ai.summary.payload.mainEmotions.length ? (
              <p className="meta">주요 감정 {entry.ai.summary.payload.mainEmotions.join(" · ")}</p>
            ) : null}
            <p><strong>좋았던 순간</strong><br />{entry.ai.summary.payload.goodMoment}</p>
            <p><strong>돌아볼 점</strong><br />{entry.ai.summary.payload.reflection}</p>
            <p className="serif" style={{ fontSize: "1.15rem" }}>{entry.ai.summary.payload.closing}</p>
          </div>
        ) : null}
      </AiSection>

      <AiSection
        title="감정 분석"
        description="글에서 읽히는 감정이에요. 내가 고른 기분과는 따로 보여 드려요."
        configured={configured}
        loading={busy === "emotion"}
        error={problems.emotion ?? null}
        notice={notes.emotion}
        result={entry.ai.emotion ? resultMeta(entry.ai.emotion.source, entry.ai.emotion.createdAt, entry.ai.emotion.stale) : null}
        onRun={(mode, force) => void runAi("emotion", mode, force)}
      >
        {entry.ai.emotion ? (
          <div>
            <p className="banner">내가 고른 기분: {mood ? `${mood.emoji} ${mood.label}` : "선택하지 않음"}</p>
            <p className="faint" style={{ marginTop: 8 }}>AI가 읽은 감정</p>
            {entry.ai.emotion.payload.emotions.length ? (
              entry.ai.emotion.payload.emotions.map((emotion) => (
                <Meter
                  key={emotion.label}
                  label={emotion.label}
                  value={emotion.intensity}
                  color="#E7B7B2"
                  caption={`${Math.round(emotion.intensity * 100)}`}
                />
              ))
            ) : (
              <p className="muted">표시할 감정 항목이 없어요.</p>
            )}
            {entry.ai.emotion.payload.mixed ? <p className="faint">여러 감정이 함께 있어요.</p> : null}
            <p>{entry.ai.emotion.payload.note}</p>
          </div>
        ) : null}
      </AiSection>

      <AiSection
        title="공감 메시지"
        description="일기 속 장면에 기대어, 감정을 인정하는 짧은 말을 건네요."
        configured={configured}
        loading={busy === "empathy"}
        error={problems.empathy ?? null}
        notice={notes.empathy}
        result={entry.ai.empathy ? resultMeta(entry.ai.empathy.source, entry.ai.empathy.createdAt, entry.ai.empathy.stale) : null}
        onRun={(mode, force) => void runAi("empathy", mode, force)}
      >
        {entry.ai.empathy ? <p className="serif" style={{ fontSize: "1.2rem", lineHeight: 1.7 }}>{entry.ai.empathy.payload.message}</p> : null}
      </AiSection>

      <AiSection
        title="회고 질문"
        description="답하지 않아도 돼요. 마음에 남는 질문만 골라 적어도 좋아요."
        configured={configured}
        loading={busy === "questions"}
        error={problems.questions || answerError || null}
        notice={notes.questions}
        result={questions ? resultMeta(questions.source, questions.createdAt, questions.stale) : null}
        onRun={(mode, force) => void runAi("questions", mode, force)}
      >
        {questions ? (
          <div className="stack">
            {questions.payload.questions.map((question) => (
              <div key={question.index} className="card" style={{ boxShadow: "none" }}>
                <p className="serif" style={{ marginTop: 0, fontSize: "1.12rem" }}>{question.text}</p>
                {question.answer ? <p className="answer">{question.answer}</p> : null}
                {answerIndex === question.index ? (
                  <div>
                    <label className="sr-only" htmlFor={`answer-${question.index}`}>답변</label>
                    <textarea
                      id={`answer-${question.index}`}
                      className="textarea"
                      style={{ minHeight: 120, background: "white", borderRadius: 16, padding: 12 }}
                      value={answerText}
                      onChange={(event) => setAnswerText(event.target.value)}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary" type="button" onClick={() => void saveAnswer(question.index)}>답 저장</button>
                      <button className="btn btn-ghost" type="button" onClick={() => setAnswerIndex(null)}>나중에</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-soft"
                    type="button"
                    onClick={() => {
                      setAnswerIndex(question.index);
                      setAnswerText(question.answer ?? "");
                    }}
                  >
                    {question.answer ? "답 수정" : "이 질문에 답하기"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </AiSection>
      <p className="faint">{AI_DISCLAIMER}</p>
      <Modal open={deleteOpen} title="이 기록을 일기장에서 뺄까요?" onClose={() => setDeleteOpen(false)}>
        <p className="muted">사진과 저장해 둔 AI 결과도 함께 삭제돼요.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" type="button" onClick={() => setDeleteOpen(false)}>남겨 두기</button>
          <button className="btn btn-danger" type="button" onClick={() => void remove()}>삭제</button>
        </div>
      </Modal>
    </article>
  );
}
