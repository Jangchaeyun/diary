"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EntryCard } from "@/components/EntryCard";
import { MoodPicker } from "@/components/MoodPicker";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/States";
import { marksFromEntries, WeekMood } from "@/components/WeekMood";
import { useAuth } from "@/components/AuthGate";
import { ApiError, api } from "@/lib/api";
import { isMoodId } from "@/lib/catalog";
import { dailyQuestion } from "@/lib/daily-questions";
import { formatKoreanDate, greeting, todayISO, weekRange } from "@/lib/dates";
import type { DiaryEntry, MoodId } from "@/lib/types";

type DayMood = { date: string; mood: MoodId };

function pickMood(day: string, weekList: DiaryEntry[], moods: DayMood[]) {
  const entry = weekList.find((item) => item.entryDate === day);
  if (entry?.mood) return entry.mood;
  return moods.find((item) => item.date === day)?.mood ?? null;
}

function withDayMood(marks: Map<string, { mood: MoodId | null; count: number }>, moods: DayMood[]) {
  for (const item of moods) {
    const current = marks.get(item.date);
    if (!current) marks.set(item.date, { mood: item.mood, count: 0 });
    else if (!current.mood) current.mood = item.mood;
  }
  return marks;
}

export default function HomePage() {
  const user = useAuth();
  const [now, setNow] = useState<Date | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [drafts, setDrafts] = useState<DiaryEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<DiaryEntry[]>([]);
  const [mood, setMood] = useState<MoodId | null>(null);
  const [dayMoods, setDayMoods] = useState<DayMood[]>([]);
  const [moodNote, setMoodNote] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  function applyHome(day: string, recent: DiaryEntry[], draftList: DiaryEntry[], weekList: DiaryEntry[], moods: DayMood[]) {
    setEntries(recent);
    setDrafts(draftList);
    setWeekEntries(weekList);
    setDayMoods(moods);
    setMood(pickMood(day, weekList, moods));
  }

  async function fetchHome(day = todayISO()) {
    const range = weekRange();
    const [recent, draftList, weekList, moodList] = await Promise.all([
      api<{ entries: DiaryEntry[] }>("/api/entries?status=saved&limit=4"),
      api<{ entries: DiaryEntry[] }>("/api/entries?status=draft&limit=3"),
      api<{ entries: DiaryEntry[] }>(`/api/entries?status=saved&from=${range.start}&to=${range.end}&limit=50`),
      api<{ moods: DayMood[] }>(`/api/moods?from=${range.start}&to=${range.end}`),
    ]);
    let moods = moodList.moods;
    if (!pickMood(day, weekList.entries, moods)) {
      const stored = localStorage.getItem(`diary-mood:${user?.id ?? "local"}:${day}`);
      if (isMoodId(stored)) {
        const saved = await api<{ mood: DayMood }>("/api/moods", {
          method: "PUT",
          body: JSON.stringify({ date: day, mood: stored }),
        });
        moods = [...moods.filter((item) => item.date !== day), saved.mood];
      }
    }
    return { recent: recent.entries, drafts: draftList.entries, week: weekList.entries, moods };
  }

  useEffect(() => {
    let ignore = false;
    const current = new Date();
    const currentDay = todayISO(current);
    const range = weekRange(current);
    Promise.all([
      api<{ entries: DiaryEntry[] }>("/api/entries?status=saved&limit=4"),
      api<{ entries: DiaryEntry[] }>("/api/entries?status=draft&limit=3"),
      api<{ entries: DiaryEntry[] }>(`/api/entries?status=saved&from=${range.start}&to=${range.end}&limit=50`),
      api<{ moods: DayMood[] }>(`/api/moods?from=${range.start}&to=${range.end}`),
    ])
      .then(async ([recent, draftList, weekList, moodList]) => {
        if (ignore) return;
        let moods = moodList.moods;
        if (!pickMood(currentDay, weekList.entries, moods)) {
          const stored = localStorage.getItem(`diary-mood:${user?.id ?? "local"}:${currentDay}`);
          if (isMoodId(stored)) {
            const saved = await api<{ mood: DayMood }>("/api/moods", {
              method: "PUT",
              body: JSON.stringify({ date: currentDay, mood: stored }),
            });
            if (ignore) return;
            moods = [...moods.filter((item) => item.date !== currentDay), saved.mood];
          }
        }
        setNow(current);
        setEntries(recent.entries);
        setDrafts(draftList.entries);
        setWeekEntries(weekList.entries);
        setDayMoods(moods);
        setMood(pickMood(currentDay, weekList.entries, moods));
        setState("ready");
      })
      .catch((reason: unknown) => {
        if (ignore) return;
        setNow(current);
        setMessage(reason instanceof ApiError ? reason.message : "홈을 불러오지 못했어요.");
        setState("error");
      });
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  async function load() {
    setState("loading");
    try {
      const data = await fetchHome();
      applyHome(todayISO(), data.recent, data.drafts, data.week, data.moods);
      setState("ready");
    } catch (reason) {
      setMessage(reason instanceof ApiError ? reason.message : "홈을 불러오지 못했어요.");
      setState("error");
    }
  }

  if (!now || state === "loading") return <PageSkeleton />;
  const today = todayISO(now);
  const hello = greeting(now);
  const date = formatKoreanDate(today);
  const question = dailyQuestion(now);
  const week = weekRange(now);
  async function chooseMood(next: MoodId) {
    const previous = mood;
    setMood(next);
    setMoodNote("");
    try {
      const saved = await api<{ mood: DayMood }>("/api/moods", {
        method: "PUT",
        body: JSON.stringify({ date: today, mood: next }),
      });
      setDayMoods((current) => [...current.filter((item) => item.date !== today), saved.mood]);
      const applyMood = (current: DiaryEntry[]) => {
        const index = current.findIndex((entry) => entry.entryDate === today);
        if (index < 0) return current;
        const nextList = [...current];
        nextList[index] = { ...nextList[index], mood: next };
        return nextList;
      };
      setWeekEntries(applyMood);
      setEntries(applyMood);
      localStorage.setItem(`diary-mood:${user?.id ?? "local"}:${today}`, next);
      setMoodNote("일기장에 저장했어요.");
    } catch (reason) {
      setMood(previous);
      setMoodNote(reason instanceof ApiError ? reason.message : "기분을 저장하지 못했어요.");
    }
  }
  if (state === "error") {
    return (
      <div className="page">
        <ErrorState message={message} onRetry={() => void load()} />
      </div>
    );
  }

  const writeHref = `/write?date=${today}${mood ? `&mood=${mood}` : ""}`;
  const promptHref = `/write?date=${today}&prompt=${encodeURIComponent(question)}${mood ? `&mood=${mood}` : ""}`;

  return (
    <div className="page home">
      <p className="eyebrow">{hello.text}</p>
      <div className="spread">
        <h1 className="display">{date.month}월 {date.day}일</h1>
        {user ? <Link href="/account" className="faint">{user.name}</Link> : null}
      </div>
      <p className="lead">{date.weekday}요일 · 오늘의 페이지를 천천히 펼쳐도 좋아요.</p>
      <section className="hero">
        <p className="eyebrow">오늘의 페이지</p>
        <h2>오늘은 어떤 하루였나요?</h2>
        <p className="lead">괜찮았던 일도, 그냥 지나간 일도 여기에 두면 돼요.</p>
      </section>
      <section className="section">
        <h3>지금의 마음</h3>
        <p className="faint">고른 기분은 일기장에 바로 저장되고, 새 기록에도 함께 실려요.</p>
        <MoodPicker value={mood} onChange={(next) => void chooseMood(next)} />
        {moodNote ? <p className="faint">{moodNote}</p> : null}
      </section>
      <Link href={writeHref} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>오늘의 기록 남기기</Link>
      <div className="home-side">
      {drafts.length ? (
        <section className="section stack">
          <h3>이어서 쓰기</h3>
          {drafts.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
        </section>
      ) : null}
      <section className="section">
        <div className="section-head">
          <h3>이번 주의 마음</h3>
          <Link href="/insights" className="faint">자세히</Link>
        </div>
        <WeekMood days={week.days} marks={withDayMood(marksFromEntries(weekEntries), dayMoods)} />
      </section>
      <section className="section stack">
        <div className="section-head">
          <h3>최근 기록</h3>
          <Link href="/memories" className="faint">모두 보기</Link>
        </div>
        {entries.length ? entries.map((entry) => <EntryCard key={entry.id} entry={entry} />) : (
          <EmptyState title="아직 펼친 페이지가 없어요" body="오늘의 한 줄이면 충분해요." />
        )}
      </section>
      </div>
      <section className="prompt section">
        <p className="eyebrow">오늘의 질문</p>
        <p className="question">{question}</p>
        <p className="faint" style={{ marginTop: 8 }}>앱이 골라 둔 질문이에요. AI 회고는 일기를 저장한 뒤, 원할 때 따로 부탁할 수 있어요.</p>
        <Link href={promptHref} className="btn btn-soft" style={{ marginTop: 12 }}>이 질문으로 시작</Link>
      </section>
    </div>
  );
}
