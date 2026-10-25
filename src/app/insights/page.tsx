"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AiSection } from "@/components/AiSection";
import { ChevronIcon } from "@/components/Icons";
import { ErrorState, Meter, PageSkeleton } from "@/components/States";
import { WeekMood } from "@/components/WeekMood";
import { ApiError, api } from "@/lib/api";
import { getMood, MOODS } from "@/lib/catalog";
import { currentYearMonth, monthBounds, monthMatrix, parseISODate, shiftMonth, toISODate } from "@/lib/dates";
import { LIMITS } from "@/lib/limits";
import type { AiEmotionBar, AiRecord, DayMark, MonthlyPayload, MoodCount } from "@/lib/types";

type Insights = {
  month: string;
  entryCount: number;
  savedCount: number;
  sufficient: boolean;
  userMoods: MoodCount[];
  days: DayMark[];
  aiEmotions: AiEmotionBar[];
  analyzedCount: number;
  week: { start: string; end: string; days: DayMark[] };
  monthly: AiRecord<MonthlyPayload> | null;
};

function weekDays(start: string) {
  const date = parseISODate(start);
  if (!date) return [];
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + index);
    return toISODate(next);
  });
}

export default function InsightsPage() {
  const [month, setMonth] = useState<string | null>(null);
  const [data, setData] = useState<Insights | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [info, setInfo] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => setMonth(currentYearMonth()), 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!month) return;
    let ignore = false;
    async function load() {
      setState("loading");
      setProblem("");
      setInfo("");
      setNotice("");
      try {
        const [insights, status] = await Promise.all([
          api<Insights>(`/api/insights?month=${month}`),
          api<{ configured: boolean }>("/api/ai/status"),
        ]);
        if (ignore) return;
        setData(insights);
        setConfigured(status.configured);
        if (!insights.sufficient) {
          setInfo(`본문이 있는 기록이 ${insights.entryCount}편이에요. ${LIMITS.monthlyMinEntries}편이 모이기 전에는 월간 회고를 추측해서 만들지 않아요.`);
        }
        setState("ready");
      } catch (reason) {
        if (!ignore) {
          setMessage(reason instanceof ApiError ? reason.message : "마음 흐름을 불러오지 못했어요.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [month, reloadKey]);

  async function runMonthly(mode: "live" | "test", force = false) {
    setBusy(true);
    setProblem("");
    try {
      const result = await api<{
        status: "insufficient" | "ready";
        message?: string;
        cached?: boolean;
        monthly?: Insights["monthly"];
      }>("/api/insights/monthly", {
        method: "POST",
        body: JSON.stringify({ month, mode, force }),
      });
      if (result.status === "insufficient") {
        setInfo(result.message ?? "기록이 충분하지 않아요.");
        return;
      }
      setData((current) => current ? { ...current, monthly: result.monthly ?? null } : current);
      setNotice(result.cached ? "같은 기록이라 저장된 회고를 다시 보여 드려요." : "");
    } catch (reason) {
      setProblem(reason instanceof ApiError ? reason.message : "월간 회고를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "error") {
    return (
      <div className="page">
        <ErrorState message={message} onRetry={() => setReloadKey((value) => value + 1)} />
      </div>
    );
  }
  if (state === "loading" || !data || !month || data.month !== month) return <PageSkeleton />;

  const bounds = monthBounds(month);
  const cells = monthMatrix(bounds.year, bounds.month);
  const dayMap = new Map(data.days.map((day) => [day.date, day]));
  const maxMood = Math.max(1, ...data.userMoods.map((item) => item.count));
  const weekMap = new Map(data.week.days.map((day) => [day.date, { mood: day.mood, count: day.count }]));

  return (
    <div className="page insights">
      <p className="eyebrow">마음의 흐름</p>
      <h1 className="display">한 달을 돌아보면</h1>
      <p className="lead">내가 고른 기분과, 부탁했을 때만 남긴 AI 감정을 따로 보여 드려요.</p>
      <div className="banner" style={{ marginTop: 14 }}>감정 분석은 참고용이에요. 의학적 진단이나 심리 상태가 아니에요.</div>
      <div className="insights-grid">
      <div className="insights-cal">
      <section className="section">
        <h3>이번 주</h3>
        <WeekMood days={weekDays(data.week.start)} marks={weekMap} />
      </section>
      <section className="section">
        <div className="cal-head">
          <button className="icon-btn" type="button" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronIcon />
          </button>
          <h2>{bounds.year}년 {bounds.month}월</h2>
          <button className="icon-btn" type="button" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronIcon direction="right" />
          </button>
        </div>
        <div className="cal-grid" aria-label="이번 달 기분">
          {cells.map((cell, index) => {
            if (!cell.date) return <span key={`empty-${index}`} className="cal-cell is-out" />;
            const mark = dayMap.get(cell.date);
            const mood = getMood(mark?.mood ?? null);
            return (
              <div key={cell.date} className="cal-cell" style={{ background: mood?.soft ?? "transparent" }} title={mood?.label ?? "기록 없음"}>
                <span>{Number(cell.date.slice(-2))}</span>
                {mood ? <small>{mood.emoji}</small> : null}
              </div>
            );
          })}
        </div>
        <p className="faint">색이 있는 날은 그때 직접 고른 기분이에요. 기록 {data.savedCount}편.</p>
      </section>
      </div>
      <div className="insights-stats">
      <section className="section card">
        <h3>내가 고른 기분</h3>
        {data.userMoods.length ? data.userMoods.map((item) => {
          const mood = getMood(item.mood);
          return (
            <Meter
              key={item.mood ?? "none"}
              label={mood ? `${mood.emoji} ${mood.label}` : "기분 미선택"}
              value={item.count / maxMood}
              color={mood?.color ?? "#E7D3B4"}
              caption={`${item.count}편`}
            />
          );
        }) : <p className="muted">이 달에는 아직 저장된 기록이 없어요.</p>}
      </section>
      <section className="section card">
        <h3>AI가 읽은 감정</h3>
        <p className="faint">실제 모델이 저장한 분석만 모았어요. 테스트 예시는 빠집니다. {data.analyzedCount}편.</p>
        {data.aiEmotions.length ? data.aiEmotions.map((item) => (
          <Meter key={item.label} label={item.label} value={item.intensity} color="#D9C6EA" caption={`${item.count}번`} />
        )) : <p className="muted">아직 감정 분석을 부탁한 기록이 없어요.</p>}
        <div className="chip-row" style={{ marginTop: 12 }}>
          {MOODS.map((item) => <span key={item.id} className="faint">{item.emoji} {item.label}</span>)}
        </div>
      </section>
      <AiSection
        title="월간 회고"
        description="한 달의 기록에서 사건, 감정, 고마웠던 일, 관심사를 정리해요."
        configured={configured}
        loading={busy}
        error={problem}
        info={info}
        notice={notice}
        result={data.monthly}
        onRun={(mode, force) => void runMonthly(mode, force)}
      >
        {data.monthly ? (
          <div className="stack">
            <p><strong>주요 기억</strong><br />{data.monthly.payload.events}</p>
            <p><strong>감정의 흐름</strong><br />{data.monthly.payload.emotionFlow}</p>
            <p><strong>행복하고 고마웠던 일</strong><br />{data.monthly.payload.happyMoments}</p>
            <p><strong>관심과 목표</strong><br />{data.monthly.payload.interests}</p>
            {data.monthly.payload.nextQuestions.length ? (
              <div>
                <strong>다음 달을 위한 질문</strong>
                <ul>
                  {data.monthly.payload.nextQuestions.map((question) => <li key={question}>{question}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </AiSection>
      <p className="faint"><Link href="/privacy">일기와 AI에 대한 안내</Link></p>
      </div>
      </div>
    </div>
  );
}
