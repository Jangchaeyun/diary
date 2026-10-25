"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { CalendarIcon, CloseIcon } from "@/components/Icons";
import { Modal } from "@/components/Modal";
import { MoodPicker } from "@/components/MoodPicker";
import { PageSkeleton } from "@/components/States";
import { ThemePicker } from "@/components/ThemePicker";
import { ApiError, api } from "@/lib/api";
import { getTheme, isMoodId } from "@/lib/catalog";
import { formatClock, formatKoreanDate, isISODate, todayISO } from "@/lib/dates";
import { LIMITS, PHOTO_TYPES } from "@/lib/limits";
import type { DiaryEntry, EntryDetail, MoodId, Photo, ThemeId } from "@/lib/types";

type LocalDraft = {
  title: string;
  body: string;
  mood: MoodId | null;
  theme: ThemeId;
  savedAt: string;
};

type NewPhoto = { file: File; url: string };

function draftKey(userId: string, entryId: string | undefined, date: string) {
  return entryId ? `diary:${userId}:draft:edit:${entryId}` : `diary:${userId}:draft:new:${date}`;
}

function readDraft(key: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalDraft;
    if (!parsed || typeof parsed.body !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function WriteForm({
  entryId,
  initialDate,
  initialMood,
  initialPrompt,
}: {
  entryId?: string;
  initialDate?: string | null;
  initialMood?: string | null;
  initialPrompt?: string | null;
}) {
  const router = useRouter();
  const user = useAuth();
  const owner = user?.id ?? "local";
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<MoodId | null>(null);
  const [theme, setTheme] = useState<ThemeId>("ivory");
  const [entryDate, setEntryDate] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [existing, setExisting] = useState<Photo[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [pending, setPending] = useState<LocalDraft | null>(null);
  const [localNote, setLocalNote] = useState("");
  const [serverNote, setServerNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (entryId) {
        try {
          const data = await api<{ entry: EntryDetail }>(`/api/entries/${entryId}`);
          if (ignore) return;
          const entry = data.entry;
          setTitle(entry.title);
          setBody(entry.body);
          setMood(entry.mood);
          setTheme(entry.theme);
          setEntryDate(entry.entryDate);
          setCreatedAt(entry.createdAt);
          setExisting(entry.photos);
          const draft = readDraft(draftKey(owner, entryId, entry.entryDate));
          if (draft && draft.savedAt > entry.updatedAt) setPending(draft);
        } catch (reason) {
          if (!ignore) setLoadError(reason instanceof ApiError ? reason.message : "기록을 불러오지 못했어요.");
        }
      } else {
        const date = initialDate && isISODate(initialDate) ? initialDate : todayISO();
        setEntryDate(date);
        if (isMoodId(initialMood)) setMood(initialMood);
        const draft = readDraft(draftKey(owner, undefined, date));
        if (draft) {
          setTitle(draft.title ?? "");
          setBody(draft.body ?? "");
          setMood(draft.mood);
          setTheme(draft.theme ?? "ivory");
          setLocalNote("이 기기에 남겨 둔 글을 불러왔어요.");
        } else {
          if (initialPrompt) setBody(`${initialPrompt}\n\n`);
          if (!isMoodId(initialMood)) {
            const stored = await api<{ moods: { date: string; mood: MoodId }[] }>(`/api/moods?from=${date}&to=${date}`);
            const found = stored.moods.find((item) => isMoodId(item.mood));
            if (!ignore && found) setMood(found.mood);
          }
        }
      }
      if (!ignore) setReady(true);
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [entryId, initialDate, initialMood, initialPrompt, owner]);

  useEffect(() => {
    if (!ready || pending) return;
    const handle = window.setTimeout(() => {
      const key = draftKey(owner, entryId, entryDate);
      if (!title.trim() && !body.trim()) {
        localStorage.removeItem(key);
        return;
      }
      const draft: LocalDraft = { title, body, mood, theme, savedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(draft));
      setLocalNote("이 브라우저에 잠시 남겨 두었어요.");
    }, 700);
    return () => window.clearTimeout(handle);
  }, [ready, pending, entryId, entryDate, title, body, mood, theme, owner]);

  const photosRef = useRef<NewPhoto[]>([]);
  useEffect(() => {
    photosRef.current = newPhotos;
  }, [newPhotos]);
  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  async function persist(status: "draft" | "saved") {
    if (saving) return;
    setSaving(true);
    setError("");
    setServerNote("");
    try {
      const saved = await api<{ entry: DiaryEntry }>(entryId ? `/api/entries/${entryId}` : "/api/entries", {
        method: entryId ? "PATCH" : "POST",
        body: JSON.stringify({ title, body, mood, theme, entryDate, status }),
      });
      const id = saved.entry.id;
      for (const photoId of removed) {
        await api(`/api/entries/${id}/photos/${photoId}`, { method: "DELETE" });
      }
      for (const photo of newPhotos) {
        const form = new FormData();
        form.set("file", photo.file);
        await api(`/api/entries/${id}/photos`, { method: "POST", body: form });
      }
      localStorage.removeItem(draftKey(owner, entryId, entryDate));
      localStorage.removeItem(draftKey(owner, undefined, entryDate));
      localStorage.removeItem(draftKey(owner, id, entryDate));
      if (status === "draft") {
        setServerNote("임시 저장했어요. 언제든 이어서 쓸 수 있어요.");
        setRemoved([]);
        setNewPhotos([]);
        if (!entryId) router.replace(`/write/${id}`);
        else {
          const fresh = await api<{ entry: EntryDetail }>(`/api/entries/${id}`);
          setExisting(fresh.entry.photos);
        }
      } else {
        setSavedId(id);
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry() {
    if (!entryId) return;
    setSaving(true);
    try {
      await api(`/api/entries/${entryId}`, { method: "DELETE" });
      localStorage.removeItem(draftKey(owner, entryId, entryDate));
      router.push("/");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "삭제하지 못했어요.");
      setSaving(false);
      setDeleteOpen(false);
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...newPhotos];
    let message = "";
    for (const file of list) {
      const kept = existing.filter((photo) => !removed.includes(photo.id)).length + next.length;
      if (kept >= LIMITS.photos) {
        message = `사진은 ${LIMITS.photos}장까지 붙일 수 있어요.`;
        break;
      }
      if (!PHOTO_TYPES.includes(file.type as (typeof PHOTO_TYPES)[number])) {
        message = "jpg, png, webp, gif 사진만 담을 수 있어요.";
        continue;
      }
      if (file.size > LIMITS.photoBytes) {
        message = "사진은 6MB보다 작은 파일로 올려 주세요.";
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setNewPhotos(next);
    setError(message);
  }

  if (!ready) return <PageSkeleton />;
  if (loadError) {
    return (
      <div className="page">
        <div className="error-box" role="alert">
          <p>{loadError}</p>
          <Link href="/" className="btn btn-soft">홈으로</Link>
        </div>
      </div>
    );
  }

  const paper = getTheme(theme);
  const dateLabel = formatKoreanDate(entryDate);
  const visibleExisting = existing.filter((photo) => !removed.includes(photo.id));

  return (
    <form
      className="write-shell"
      style={{ background: paper.paper }}
      onSubmit={(event) => {
        event.preventDefault();
        void persist("saved");
      }}
    >
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="닫기" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <CloseIcon />
        </Link>
        <p className="faint" aria-live="polite" style={{ margin: 0, textAlign: "center" }}>{serverNote || localNote}</p>
        <button className="btn btn-primary" type="submit" disabled={saving} style={{ minHeight: 40 }}>
          {saving ? "저장 중" : "저장"}
        </button>
      </header>
      <div className="write-scroll">
        <div className="meta" style={{ gap: 10 }}>
          <span>{dateLabel.full}</span>
          <label className="date-btn">
            <CalendarIcon size={18} />
            <input
              className="date-input"
              type="date"
              value={entryDate}
              aria-label="일기 날짜"
              onChange={(event) => setEntryDate(event.target.value)}
            />
          </label>
        </div>
        {createdAt ? <p className="faint">처음 쓴 시간 {formatClock(createdAt)}</p> : <p className="faint">지금 이 페이지를 쓰고 있어요.</p>}
        <label className="sr-only" htmlFor="title">제목</label>
        <input
          id="title"
          className="title-input"
          placeholder="오늘의 제목"
          maxLength={LIMITS.title}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label className="sr-only" htmlFor="body">본문</label>
        <textarea
          id="body"
          className="textarea"
          placeholder="오늘은 어떤 하루였나요?"
          maxLength={LIMITS.body}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <p className="faint" style={{ textAlign: "right" }}>{body.length.toLocaleString("ko-KR")} / {LIMITS.body.toLocaleString("ko-KR")}</p>
        {pending ? (
          <div className="banner">
            <p style={{ marginTop: 0 }}>이 기기에 아직 올리지 않은 수정이 있어요.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-soft"
                type="button"
                onClick={() => {
                  setTitle(pending.title);
                  setBody(pending.body);
                  setMood(pending.mood);
                  setTheme(pending.theme);
                  setPending(null);
                }}
              >
                불러오기
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  localStorage.removeItem(draftKey(owner, entryId, entryDate));
                  setPending(null);
                }}
              >
                지우기
              </button>
            </div>
          </div>
        ) : null}
        {error ? <div className="error-box" role="alert">{error}</div> : null}
        <div className="section">
          <h3>오늘의 기분</h3>
          <div style={{ height: 10 }} />
          <MoodPicker value={mood} onChange={setMood} />
        </div>
        <div className="section">
          <h3>페이지 색</h3>
          <div style={{ height: 10 }} />
          <ThemePicker value={theme} onChange={setTheme} />
        </div>
        <div className="section">
          <div className="spread">
            <h3>사진</h3>
            <label className="btn btn-soft" htmlFor="photos" style={{ minHeight: 40 }}>사진 첨부</label>
          </div>
          <input
            id="photos"
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <p className="faint">사진은 이 앱 안에만 보관되고, AI로는 보내지 않아요.</p>
          <div className="photo-grid">
            {visibleExisting.map((photo) => (
              <div key={photo.id} className="photo-tile">
                <Image src={`/api/photos/${photo.id}`} alt="첨부한 사진" fill unoptimized sizes="200px" style={{ objectFit: "cover" }} />
                <button className="remove-photo" type="button" aria-label="사진 빼기" onClick={() => setRemoved((current) => [...current, photo.id])}>×</button>
              </div>
            ))}
            {newPhotos.map((photo) => (
              <div key={photo.url} className="photo-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="새로 첨부한 사진 미리보기" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  className="remove-photo"
                  type="button"
                  aria-label="미리보기 빼기"
                  onClick={() => {
                    URL.revokeObjectURL(photo.url);
                    setNewPhotos((current) => current.filter((item) => item.url !== photo.url));
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        {entryId ? (
          <button className="btn btn-danger btn-block" type="button" style={{ marginTop: 22 }} onClick={() => setDeleteOpen(true)}>
            이 기록 삭제
          </button>
        ) : null}
      </div>
      <footer className="write-actions">
        <button className="btn btn-soft" type="button" disabled={saving} onClick={() => void persist("draft")}>임시 저장</button>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "저장 중" : "기록하기"}</button>
      </footer>
      <Modal open={Boolean(savedId)} title="오늘의 페이지를 남겼어요" onClose={() => savedId && router.push(`/entry/${savedId}`)}>
        <p className="muted">일기장에 잘 넣어 두었어요. AI 정리는 기록 화면에서 원할 때 부탁할 수 있어요.</p>
        <Link href={savedId ? `/entry/${savedId}` : "/"} className="btn btn-primary btn-block">기록 보기</Link>
      </Modal>
      <Modal open={deleteOpen} title="이 기록을 일기장에서 뺄까요?" onClose={() => setDeleteOpen(false)}>
        <p className="muted">사진과 저장해 둔 AI 결과도 함께 삭제돼요.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" type="button" onClick={() => setDeleteOpen(false)}>남겨 두기</button>
          <button className="btn btn-danger" type="button" onClick={() => void removeEntry()}>삭제</button>
        </div>
      </Modal>
    </form>
  );
}
