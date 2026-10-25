"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { entryTitle } from "@/components/EntryCard";
import { ChevronIcon } from "@/components/Icons";
import { StampIcon } from "@/components/StampIcon";
import { StickerIcon } from "@/components/StickerIcon";
import { ErrorState, PageSkeleton } from "@/components/States";
import { ApiError, api } from "@/lib/api";
import { getMood } from "@/lib/catalog";
import { currentYearMonth, formatKoreanDate, monthBounds, monthMatrix, parseISODate, shiftMonth, todayISO, weekRange, weekdayLabel } from "@/lib/dates";
import { isStampId, STAMPS, stampLabel, type DayStamp, type StampId } from "@/lib/stamp-catalog";
import { STICKERS, stickerLabel, type DaySticker, type StickerId } from "@/lib/sticker-catalog";
import type { DayTask, DiaryEntry, MoodId } from "@/lib/types";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function DayFace({
  sticker,
  stamp,
  mood,
  tasks,
  compact,
}: {
  sticker: StickerId | null;
  stamp: StampId | null;
  mood: MoodId | null;
  tasks: boolean;
  compact: boolean;
}) {
  if (sticker) return <StickerIcon id={sticker} className={compact ? "board-sticker" : undefined} />;
  const face = stamp ?? (mood && isStampId(mood) ? mood : null);
  if (face) return <StampIcon id={face} />;
  if (compact && tasks) return <span className="board-dot" />;
  return compact ? null : <span />;
}

function MiniMonth({
  yearMonth,
  marked,
  tasks,
  stickers,
  stamps,
  today,
  onPick,
}: {
  yearMonth: string;
  marked: Set<string>;
  tasks: Set<string>;
  stickers: Set<string>;
  stamps: Set<string>;
  today: string;
  onPick: (date: string) => void;
}) {
  const bounds = monthBounds(yearMonth);
  const cells = monthMatrix(bounds.year, bounds.month);
  return (
    <div className="mini-month">
      <p>{bounds.month}월</p>
      <div className="mini-grid">
        {WEEK.map((day, index) => (
          <span key={day} className={index === 0 ? "is-sun" : ""}>{day}</span>
        ))}
        {cells.map((cell, index) => {
          const date = cell.date;
          if (!date) return <span key={`e-${index}`} />;
          const day = Number(date.slice(-2));
          const sunday = new Date(bounds.year, bounds.month - 1, day).getDay() === 0;
          return (
            <button
              key={date}
              type="button"
              className={`mini-day${sunday ? " is-sun" : ""}${marked.has(date) ? " is-marked" : ""}${tasks.has(date) ? " is-task" : ""}${stickers.has(date) ? " is-sticker" : ""}${stamps.has(date) ? " is-stamp" : ""}${date === today ? " is-today" : ""}`}
              onClick={() => onPick(date)}
              aria-label={formatKoreanDate(date).medium}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TaskComposer({
  date,
  disabled,
  onCreated,
}: {
  date: string;
  disabled: boolean;
  onCreated: (task: DayTask) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim().replace(/\s+/g, " ");
    if (!value || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ task: DayTask }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ date, text: value }),
      });
      setText("");
      onCreated(data.task);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "할 일을 저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="check-line" onSubmit={(event) => void submit(event)}>
        <span className="check-mark" aria-hidden>+</span>
        <input
          className="check-input"
          value={text}
          maxLength={80}
          placeholder="할 일을 적어 주세요"
          aria-label="할 일"
          disabled={disabled || busy}
          onChange={(event) => setText(event.target.value)}
        />
      </form>
      {error ? <p className="faint" style={{ margin: "8px 2px 0" }}>{error}</p> : null}
    </>
  );
}

function TaskLine({
  task,
  onChange,
  onRemove,
}: {
  task: DayTask;
  onChange: (task: DayTask) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState(task.text);
  const [error, setError] = useState("");

  async function commit() {
    const next = text.trim().replace(/\s+/g, " ");
    if (!next || next === task.text) {
      setText(task.text);
      return;
    }
    try {
      const data = await api<{ task: DayTask }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ text: next }),
      });
      setError("");
      onChange(data.task);
    } catch (reason) {
      setText(task.text);
      setError(reason instanceof ApiError ? reason.message : "할 일을 고치지 못했어요.");
    }
  }

  async function toggle() {
    const done = !task.done;
    onChange({ ...task, done });
    try {
      const data = await api<{ task: DayTask }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      });
      setError("");
      onChange(data.task);
    } catch (reason) {
      onChange(task);
      setError(reason instanceof ApiError ? reason.message : "완료 표시를 저장하지 못했어요.");
    }
  }

  async function remove() {
    onRemove(task.id);
    try {
      await api(`/api/tasks/${task.id}`, { method: "DELETE" });
      setError("");
    } catch (reason) {
      onChange(task);
      setError(reason instanceof ApiError ? reason.message : "할 일을 지우지 못했어요.");
    }
  }

  return (
    <>
      <div className={`check-line${task.done ? " is-done" : ""}`}>
        <button className={`check-box${task.done ? " is-done" : ""}`} type="button" aria-pressed={task.done} aria-label={task.done ? "완료 해제" : "완료"} onClick={() => void toggle()}>
          {task.done ? (
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M3.2 8.2 L6.4 11.3 L12.8 4.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
        <input
          className="check-input"
          value={text}
          maxLength={80}
          aria-label="할 일 내용"
          onChange={(event) => setText(event.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        <button className="check-remove" type="button" aria-label="할 일 지우기" onClick={() => void remove()}>×</button>
      </div>
      {error ? <p className="faint" style={{ margin: "0 2px 4px" }}>{error}</p> : null}
    </>
  );
}

export default function CalendarPage() {
  const [today, setToday] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [tasks, setTasks] = useState<DayTask[]>([]);
  const [stickers, setStickers] = useState<DaySticker[]>([]);
  const [stamps, setStamps] = useState<DayStamp[]>([]);
  const [markError, setMarkError] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const now = new Date();
    const handle = window.setTimeout(() => {
      const day = todayISO(now);
      setToday(day);
      setCursor(currentYearMonth(now));
      setSelected(day);
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!cursor) return;
    const monthKey = cursor;
    let ignore = false;
    async function load() {
      setState("loading");
      try {
        const from = monthBounds(shiftMonth(monthKey, -1)).from;
        const to = monthBounds(shiftMonth(monthKey, 1)).to;
        const [data, taskData] = await Promise.all([
          api<{ entries: DiaryEntry[] }>(`/api/entries?from=${from}&to=${to}&limit=100`),
          api<{ tasks: DayTask[]; stickers: DaySticker[]; stamps?: DayStamp[] }>(`/api/tasks?from=${from}&to=${to}`),
        ]);
        if (ignore) return;
        setEntries(data.entries);
        setTasks(taskData.tasks);
        setStickers(taskData.stickers);
        setStamps(taskData.stamps ?? []);
        setState("ready");
      } catch (reason) {
        if (!ignore) {
          setMessage(reason instanceof ApiError ? reason.message : "달력을 불러오지 못했어요.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [cursor, reloadKey]);

  const activeMonth = cursor;
  const marks = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.entryDate) ?? [];
      list.push(entry);
      map.set(entry.entryDate, list);
    }
    return map;
  }, [entries]);

  if (!activeMonth || !selected) return <PageSkeleton />;
  const monthKey = activeMonth;
  const selectedDay = selected;
  const bounds = monthBounds(monthKey);
  const cells = monthMatrix(bounds.year, bounds.month);
  const selectedEntries = marks.get(selected) ?? [];
  const selectedDate = parseISODate(selected);
  const weekDays = selectedDate ? weekRange(selectedDate).days : [];
  const markedDays = new Set(marks.keys());
  const tasksByDate = new Map<string, DayTask[]>();
  for (const task of tasks) {
    const list = tasksByDate.get(task.date) ?? [];
    list.push(task);
    tasksByDate.set(task.date, list);
  }
  const taskDays = new Set(tasksByDate.keys());
  const stickerByDate = new Map(stickers.map((item) => [item.date, item.sticker]));
  const stickerDays = new Set(stickerByDate.keys());
  const stampByDate = new Map(stamps.map((item) => [item.date, item.stamp]));
  const stampDays = new Set(stampByDate.keys());
  const selectedTasks = tasksByDate.get(selectedDay) ?? [];
  const selectedSticker = stickerByDate.get(selectedDay) ?? null;
  const selectedStamp = stampByDate.get(selectedDay) ?? null;
  const allDone = selectedTasks.length > 0 && selectedTasks.every((task) => task.done);
  const blankLines = Math.max(0, 3 - selectedTasks.length - 1);
  const headline = formatKoreanDate(selected);

  function openDate(date: string) {
    setSelected(date);
    setCursor(date.slice(0, 7));
  }

  function rememberStickers(next: DaySticker[]) {
    setStickers(next);
  }

  async function chooseSticker(id: StickerId) {
    const previous = stickers;
    setMarkError("");
    if (selectedSticker === id) {
      rememberStickers(previous.filter((item) => item.date !== selectedDay));
      try {
        await api(`/api/stickers?date=${selectedDay}`, { method: "DELETE" });
      } catch (reason) {
        rememberStickers(previous);
        setMarkError(reason instanceof ApiError ? reason.message : "스티커를 떼지 못했어요.");
      }
      return;
    }
    rememberStickers([...previous.filter((item) => item.date !== selectedDay), { date: selectedDay, sticker: id }]);
    try {
      await api<{ sticker: DaySticker }>("/api/stickers", {
        method: "PUT",
        body: JSON.stringify({ date: selectedDay, sticker: id }),
      });
    } catch (reason) {
      rememberStickers(previous);
      setMarkError(reason instanceof ApiError ? reason.message : "스티커를 붙이지 못했어요.");
    }
  }

  async function chooseStamp(id: StampId) {
    const previous = stamps;
    setMarkError("");
    if (selectedStamp === id) {
      setStamps(previous.filter((item) => item.date !== selectedDay));
      try {
        await api(`/api/stamps?date=${selectedDay}`, { method: "DELETE" });
      } catch (reason) {
        setStamps(previous);
        setMarkError(reason instanceof ApiError ? reason.message : "도장을 떼지 못했어요.");
      }
      return;
    }
    setStamps([...previous.filter((item) => item.date !== selectedDay), { date: selectedDay, stamp: id }]);
    try {
      await api<{ stamp: DayStamp }>("/api/stamps", {
        method: "PUT",
        body: JSON.stringify({ date: selectedDay, stamp: id }),
      });
    } catch (reason) {
      setStamps(previous);
      setMarkError(reason instanceof ApiError ? reason.message : "도장을 붙이지 못했어요.");
    }
  }

  function moveMonth(delta: number) {
    const next = shiftMonth(monthKey, delta);
    const nextBounds = monthBounds(next);
    setCursor(next);
    if (selectedDay < nextBounds.from || selectedDay > nextBounds.to) {
      setSelected(today >= nextBounds.from && today <= nextBounds.to ? today : nextBounds.from);
    }
  }

  return (
    <div className="page planner">
      <span className="year-pill">{bounds.year}</span>
      <div className="spread" style={{ alignItems: "flex-end" }}>
        <div className="planner-title">
          <span className="planner-month">{headline.month}월</span>
          <span className="planner-daynum">{String(headline.day).padStart(2, "0")}</span>
        </div>
        <div className="planner-nav">
          <button className="icon-btn" type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}>
            <ChevronIcon />
          </button>
          <button className="icon-btn" type="button" aria-label="다음 달" onClick={() => moveMonth(1)}>
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      <div className="planner-spread">
      <div className="planner-side">
      <div className="mini-row">
        <MiniMonth yearMonth={shiftMonth(monthKey, -1)} marked={markedDays} tasks={taskDays} stickers={stickerDays} stamps={stampDays} today={today} onPick={openDate} />
        <MiniMonth yearMonth={shiftMonth(monthKey, 1)} marked={markedDays} tasks={taskDays} stickers={stickerDays} stamps={stampDays} today={today} onPick={openDate} />
      </div>

      <section className="check-block">
        {state !== "error" ? (
          <div className="stamp-tray">
            <h2 className="check-label">오늘의 도장</h2>
            <p className="faint">{selectedStamp ? "도장을 붙였어요. 다시 누르면 떼져요." : "하루 도장을 골라 보세요."}</p>
            <div className="stamp-row" role="listbox" aria-label="도장">
              {STAMPS.map((item) => {
                const active = selectedStamp === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`stamp-pick${active ? " is-active" : ""}`}
                    role="option"
                    aria-selected={active}
                    aria-label={item.label}
                    disabled={state !== "ready"}
                    onClick={() => void chooseStamp(item.id)}
                  >
                    <StampIcon id={item.id} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <h2 className="check-label">확인할 일</h2>
        {state === "error" ? <ErrorState message={message} onRetry={() => setReloadKey((value) => value + 1)} /> : (
          <div className="ruled">
            {state === "loading" && selectedTasks.length === 0 ? <p className="check-empty">할 일을 불러오고 있어요.</p> : null}
            {selectedTasks.map((task) => (
              <TaskLine
                key={task.id}
                task={task}
                onChange={(next) => setTasks((current) => {
                  if (!current.some((item) => item.id === next.id)) return [...current, next];
                  return current.map((item) => item.id === next.id ? next : item);
                })}
                onRemove={(id) => setTasks((current) => current.filter((item) => item.id !== id))}
              />
            ))}
            <TaskComposer
              key={selectedDay}
              date={selectedDay}
              disabled={state !== "ready"}
              onCreated={(task) => setTasks((current) => [...current, task])}
            />
            {Array.from({ length: blankLines }, (_, index) => <p key={index} className="check-empty" />)}
          </div>
        )}
        {state !== "error" && selectedTasks.length > 0 && !allDone ? (
          <p className="faint" style={{ marginTop: 8 }}>모두 체크하면 스티커를 붙일 수 있어요.</p>
        ) : null}
        {state !== "error" && allDone ? (
          <div className="sticker-tray">
            <p className="faint">{selectedSticker ? "스티커를 붙였어요. 다시 누르면 떼져요." : "모두 끝냈어요. 스티커를 붙여 보세요."}</p>
            <div className="sticker-row" role="listbox" aria-label="스티커">
              {STICKERS.map((item) => {
                const active = selectedSticker === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sticker-pick${active ? " is-active" : ""}`}
                    role="option"
                    aria-selected={active}
                    aria-label={item.label}
                    onClick={() => void chooseSticker(item.id)}
                  >
                    <StickerIcon id={item.id} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {state !== "error" && !allDone && selectedSticker ? (
          <div className="sticker-kept">
            <StickerIcon id={selectedSticker} />
            <span className="faint">{stickerLabel(selectedSticker)} 스티커가 붙어 있어요.</span>
            <button className="btn btn-ghost" type="button" onClick={() => void chooseSticker(selectedSticker)}>떼기</button>
          </div>
        ) : null}
        {markError ? <p className="faint" style={{ marginTop: 8 }}>{markError}</p> : null}
        {selectedEntries.length ? (
          <div className="day-links">
            {selectedEntries.map((entry) => (
              <Link key={entry.id} href={`/entry/${entry.id}`}>
                {entry.status === "saved" ? "✓" : "·"} {entryTitle(entry)}
              </Link>
            ))}
          </div>
        ) : null}
        <Link href={`/write?date=${selected}`} className="btn btn-soft" style={{ marginTop: 10 }}>{headline.short}에 기록하기</Link>
      </section>
      </div>
      <div className="planner-main">

      <div className="week-sheet" aria-label="이번 주">
        {weekDays.map((date) => {
          const list = marks.get(date) ?? [];
          const dayTasks = tasksByDate.get(date) ?? [];
          const sticker = stickerByDate.get(date) ?? null;
          const stamp = stampByDate.get(date) ?? null;
          const info = formatKoreanDate(date);
          const note = list[0] ? entryTitle(list[0]) : (dayTasks.find((task) => !task.done) ?? dayTasks[0])?.text ?? "";
          const face = stamp ?? (list[0]?.mood && isStampId(list[0].mood) ? list[0].mood : null);
          return (
            <button
              key={date}
              type="button"
              className={`week-row${date === selected ? " is-selected" : ""}`}
              onClick={() => openDate(date)}
              aria-pressed={date === selected}
              aria-label={`${info.full}${face ? `, ${stampLabel(face)} 도장` : ""}${list.length ? `, 기록 ${list.length}개` : ""}${dayTasks.length ? `, 할 일 ${dayTasks.length}개` : ""}${sticker ? `, ${stickerLabel(sticker)} 스티커` : ""}`}
            >
              <span>
                <span className={`planner-weekname${info.weekday === "일" ? " is-sun" : ""}`}>{info.weekday}요일</span>
                <span className="planner-weeknum">{info.day}</span>
              </span>
              <span className="week-note">{note}</span>
              <DayFace sticker={sticker} stamp={stamp} mood={list[0]?.mood ?? null} tasks={dayTasks.length > 0} compact={false} />
            </button>
          );
        })}
      </div>

      <div className="planner-board">
        <div className="board-week">{WEEK.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="board-grid" aria-label="월별 달력">
          {cells.map((cell, index) => {
            if (!cell.date) return <span key={`empty-${index}`} className="board-day is-out" />;
            const list = marks.get(cell.date) ?? [];
            const dayTasks = tasksByDate.get(cell.date) ?? [];
            const sticker = stickerByDate.get(cell.date) ?? null;
            const stamp = stampByDate.get(cell.date) ?? null;
            const mood = getMood(list[0]?.mood ?? null);
            const day = Number(cell.date.slice(-2));
            const sunday = weekdayLabel(cell.date) === "일";
            const face = stamp ?? (mood && isStampId(mood.id) ? mood.id : null);
            return (
              <button
                key={cell.date}
                type="button"
                className={`board-day${cell.date === today ? " is-today" : ""}${selected === cell.date ? " is-selected" : ""}${sunday ? " is-sun" : ""}`}
                onClick={() => setSelected(cell.date)}
                aria-label={`${formatKoreanDate(cell.date).medium}${face ? `, ${stampLabel(face)} 도장` : ""}${dayTasks.length ? `, 할 일 ${dayTasks.length}개` : ""}${sticker ? `, ${stickerLabel(sticker)} 스티커` : ""}`}
                aria-pressed={selected === cell.date}
              >
                <span className="board-num">{day}</span>
                <DayFace sticker={sticker} stamp={stamp} mood={list[0]?.mood ?? null} tasks={dayTasks.length > 0} compact />
              </button>
            );
          })}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
