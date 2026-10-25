"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EntryCard, entryTitle } from "@/components/EntryCard";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/States";
import { ApiError, api } from "@/lib/api";
import { MOODS } from "@/lib/catalog";
import { formatKoreanDate } from "@/lib/dates";
import type { DiaryEntry, MoodId } from "@/lib/types";

export default function MemoriesPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [mood, setMood] = useState<MoodId | "">("");
  const [view, setView] = useState<"list" | "gallery">("list");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setState("loading");
      try {
        const params = new URLSearchParams({ limit: "12", offset: "0", status: "saved" });
        if (query) params.set("q", query);
        if (mood) params.set("mood", mood);
        if (view === "gallery") params.set("hasPhoto", "1");
        const data = await api<{ entries: DiaryEntry[]; total: number }>(`/api/entries?${params.toString()}`);
        if (ignore) return;
        setEntries(data.entries);
        setTotal(data.total);
        setState("ready");
      } catch (reason) {
        if (!ignore) {
          setMessage(reason instanceof ApiError ? reason.message : "추억을 불러오지 못했어요.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [query, mood, view, reloadKey]);

  async function more() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "12", offset: String(entries.length), status: "saved" });
      if (query) params.set("q", query);
      if (mood) params.set("mood", mood);
      if (view === "gallery") params.set("hasPhoto", "1");
      const data = await api<{ entries: DiaryEntry[]; total: number }>(`/api/entries?${params.toString()}`);
      setEntries((current) => [...current, ...data.entries]);
      setTotal(data.total);
    } catch (reason) {
      setMessage(reason instanceof ApiError ? reason.message : "기록을 더 불러오지 못했어요.");
      setState("error");
    } finally {
      setLoadingMore(false);
    }
  }

  const photos = entries.flatMap((entry) => entry.photos.map((photo) => ({ photo, entry })));

  return (
    <div className="page memories">
      <p className="eyebrow">추억 보관함</p>
      <h1 className="display">다시 펼친 페이지</h1>
      <p className="lead">최신 기록부터, 혹은 사진만 모아 볼 수 있어요.</p>
      <label className="sr-only" htmlFor="search">검색</label>
      <input
        id="search"
        className="search"
        style={{ marginTop: 16 }}
        placeholder="제목이나 본문 검색"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
      <div className="spread" style={{ marginTop: 12 }}>
        <div className="chip-row" aria-label="기분 필터">
          <button className={`chip${mood === "" ? " is-active" : ""}`} type="button" onClick={() => setMood("")}>전체</button>
          {MOODS.map((item) => (
            <button key={item.id} className={`chip${mood === item.id ? " is-active" : ""}`} type="button" onClick={() => setMood(item.id)}>
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chip-row" style={{ marginTop: 10 }} aria-label="보기 방식">
        <button className={`chip${view === "list" ? " is-active" : ""}`} type="button" onClick={() => setView("list")}>목록</button>
        <button className={`chip${view === "gallery" ? " is-active" : ""}`} type="button" onClick={() => setView("gallery")}>갤러리</button>
      </div>
      {state === "loading" ? <div style={{ marginTop: 16 }}><PageSkeleton /></div> : null}
      {state === "error" ? <div style={{ marginTop: 16 }}><ErrorState message={message} onRetry={() => setReloadKey((value) => value + 1)} /></div> : null}
      {state === "ready" && view === "list" ? (
        <div className="stack" style={{ marginTop: 16 }}>
          {entries.length ? entries.map((entry) => <EntryCard key={entry.id} entry={entry} />) : (
            <EmptyState
              title={query || mood ? "찾는 기록이 없어요" : "보관함이 아직 조용해요"}
              body={query || mood ? "다른 마음이나 단어를 시도해 보세요." : "기록을 남기면 이곳에서 앨범처럼 다시 볼 수 있어요."}
            />
          )}
        </div>
      ) : null}
      {state === "ready" && view === "gallery" ? (
        photos.length ? (
          <div className="gallery" style={{ marginTop: 16 }}>
            {photos.map(({ photo, entry }) => (
              <Link key={photo.id} href={`/entry/${entry.id}`} className="gallery-item">
                <Image src={`/api/photos/${photo.id}`} alt={`${entryTitle(entry)} 사진`} fill unoptimized sizes="200px" style={{ objectFit: "cover" }} />
                <span className="gallery-caption">{formatKoreanDate(entry.entryDate).short}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <EmptyState title="사진이 있는 기록이 없어요" body="일기에 사진을 붙이면 이곳에 모여요." />
          </div>
        )
      ) : null}
      {state === "ready" && entries.length < total ? (
        <button className="btn btn-soft btn-block" type="button" style={{ marginTop: 16 }} disabled={loadingMore} onClick={() => void more()}>
          {loadingMore ? "불러오는 중" : "더 보기"}
        </button>
      ) : null}
    </div>
  );
}
