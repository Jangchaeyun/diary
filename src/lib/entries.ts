import fs from "fs";
import path from "path";
import { getMood } from "@/lib/catalog";
import { monthBounds, weekRange } from "@/lib/dates";
import { getDb, photoDirectory, withTransaction } from "@/lib/db";
import { deleteObject, getObject, objectKey, putObject, storageStatus } from "@/lib/storage";
import { currentUserId } from "@/lib/user-context";
import { entryContentHash, hashContent } from "@/lib/hash";
import { LIMITS, PHOTO_TYPES } from "@/lib/limits";
import { rememberMood, listMoods } from "@/lib/moods";
import type {
  AiEmotionBar,
  AiFlags,
  AiKind,
  AiRecord,
  AiSource,
  DayMark,
  DiaryEntry,
  EmotionPayload,
  EmpathyPayload,
  SummaryPayload,
  EntryAi,
  EntryDetail,
  EntryInput,
  MoodCount,
  MoodId,
  MonthlyPayload,
  Photo,
  QuestionsPayload,
  ThemeId,
} from "@/lib/types";

type EntryRow = {
  id: string;
  title: string;
  body: string;
  mood: string | null;
  theme: string;
  entry_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const emptyFlags = (): AiFlags => ({
  summary: false,
  emotion: false,
  empathy: false,
  questions: false,
});

function asEntry(row: Record<string, unknown>): EntryRow {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    mood: row.mood ? String(row.mood) : null,
    theme: String(row.theme),
    entry_date: String(row.entry_date),
    status: String(row.status),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapEntry(row: EntryRow, photos: Photo[], flags: AiFlags): DiaryEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    mood: getMood(row.mood as MoodId | null) ? (row.mood as MoodId) : null,
    theme: row.theme as ThemeId,
    entryDate: row.entry_date,
    status: row.status === "draft" ? "draft" : "saved",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos,
    aiReady: flags,
  };
}

function loadPhotos(ids: string[]) {
  const grouped = new Map<string, Photo[]>();
  if (ids.length === 0) return grouped;
  const marks = ids.map(() => "?").join(",");
  const rows = getDb()
    .prepare(`SELECT id, entry_id, mime FROM photos WHERE entry_id IN (${marks}) ORDER BY created_at ASC`)
    .all(...ids);
  for (const row of rows) {
    const entryId = String(row.entry_id);
    const list = grouped.get(entryId) ?? [];
    list.push({ id: String(row.id), mime: String(row.mime) });
    grouped.set(entryId, list);
  }
  return grouped;
}

function loadFlags(ids: string[]) {
  const grouped = new Map<string, AiFlags>();
  if (ids.length === 0) return grouped;
  const marks = ids.map(() => "?").join(",");
  const rows = getDb()
    .prepare(
      `SELECT scope_id, kind FROM ai_results WHERE scope = 'entry' AND scope_id IN (${marks})`,
    )
    .all(...ids);
  for (const row of rows) {
    const id = String(row.scope_id);
    const flags = grouped.get(id) ?? emptyFlags();
    const kind = String(row.kind);
    if (kind === "summary" || kind === "emotion" || kind === "empathy" || kind === "questions") {
      flags[kind] = true;
    }
    grouped.set(id, flags);
  }
  return grouped;
}

export type EntryQuery = {
  q?: string;
  mood?: MoodId;
  from?: string;
  to?: string;
  status?: "draft" | "saved";
  hasPhoto?: boolean;
  limit: number;
  offset: number;
};

export function listEntries(query: EntryQuery) {
  const where: string[] = ["user_id = ?"];
  const params: unknown[] = [currentUserId()];
  if (query.status) {
    where.push("status = ?");
    params.push(query.status);
  }
  if (query.mood) {
    where.push("mood = ?");
    params.push(query.mood);
  }
  if (query.from) {
    where.push("entry_date >= ?");
    params.push(query.from);
  }
  if (query.to) {
    where.push("entry_date <= ?");
    params.push(query.to);
  }
  if (query.q) {
    const escaped = query.q.replace(/[\\%_]/g, (char) => `\\${char}`);
    where.push("(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')");
    params.push(`%${escaped}%`, `%${escaped}%`);
  }
  if (query.hasPhoto) {
    where.push("EXISTS (SELECT 1 FROM photos p WHERE p.entry_id = entries.id)");
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();
  const totalRow = db.prepare(`SELECT COUNT(*) AS count FROM entries ${clause}`).get(...params);
  const rows = db
    .prepare(
      `SELECT * FROM entries ${clause} ORDER BY entry_date DESC, updated_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, query.limit, query.offset)
    .map(asEntry);
  const ids = rows.map((row) => row.id);
  const photos = loadPhotos(ids);
  const flags = loadFlags(ids);
  return {
    total: Number(totalRow?.count ?? 0),
    entries: rows.map((row) => mapEntry(row, photos.get(row.id) ?? [], flags.get(row.id) ?? emptyFlags())),
  };
}

export function getEntry(id: string) {
  const row = getDb().prepare("SELECT * FROM entries WHERE id = ? AND user_id = ?").get(id, currentUserId());
  if (!row) return null;
  const entry = asEntry(row);
  const photos = loadPhotos([entry.id]).get(entry.id) ?? [];
  const flags = loadFlags([entry.id]).get(entry.id) ?? emptyFlags();
  return mapEntry(entry, photos, flags);
}

function latestResult(scope: string, scopeId: string, kind: AiKind) {
  return getDb()
    .prepare(
      `SELECT * FROM ai_results
       WHERE scope = ? AND scope_id = ? AND kind = ? AND user_id = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(scope, scopeId, kind, currentUserId());
}

function answersFor(resultId: string) {
  const rows = getDb()
    .prepare("SELECT question_index, answer FROM question_answers WHERE result_id = ?")
    .all(resultId);
  const map = new Map<number, string>();
  for (const row of rows) map.set(Number(row.question_index), String(row.answer));
  return map;
}

function toRecord<T>(row: Record<string, unknown> | undefined, hash: string, hydrate?: (payload: T, resultId: string) => T): AiRecord<T> | null {
  if (!row) return null;
  let payload = JSON.parse(String(row.payload)) as T;
  if (hydrate) payload = hydrate(payload, String(row.id));
  return {
    id: String(row.id),
    source: String(row.source) as AiSource,
    createdAt: String(row.created_at),
    stale: String(row.content_hash) !== hash,
    payload,
  };
}

export function getEntryDetail(id: string): EntryDetail | null {
  const entry = getEntry(id);
  if (!entry) return null;
  const hash = entryContentHash(entry);
  const summary = toRecord<SummaryPayload>(latestResult("entry", id, "summary"), hash);
  const emotion = toRecord<EmotionPayload>(latestResult("entry", id, "emotion"), hash);
  const empathy = toRecord<EmpathyPayload>(latestResult("entry", id, "empathy"), hash);
  const questions = toRecord<QuestionsPayload>(latestResult("entry", id, "questions"), hash, (payload, resultId) => {
    const answers = answersFor(resultId);
    return {
      questions: payload.questions.map((question) => ({
        ...question,
        answer: answers.get(question.index) ?? null,
      })),
    };
  });
  const ai: EntryAi = { summary, emotion, empathy, questions };
  return { ...entry, ai };
}

export function createEntry(input: EntryInput) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO entries (id, title, body, mood, theme, entry_date, status, created_at, updated_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, input.title, input.body, input.mood, input.theme, input.entryDate, input.status, now, now, currentUserId());
  if (input.status === "saved" && input.mood) rememberMood(input.entryDate, input.mood);
  return getEntry(id)!;
}

export function updateEntry(id: string, input: EntryInput) {
  const existing = getEntry(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE entries
       SET title = ?, body = ?, mood = ?, theme = ?, entry_date = ?, status = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(input.title, input.body, input.mood, input.theme, input.entryDate, input.status, now, id, currentUserId());
  if (input.status === "saved" && input.mood) rememberMood(input.entryDate, input.mood);
  return getEntry(id);
}

export async function deleteEntry(id: string) {
  if (!getEntry(id)) return false;
  const photos = getDb().prepare("SELECT filename, storage FROM photos WHERE entry_id = ?").all(id);
  const userId = currentUserId();
  withTransaction(() => {
    const db = getDb();
    db.prepare(
      `DELETE FROM question_answers
       WHERE result_id IN (SELECT id FROM ai_results WHERE scope = 'entry' AND scope_id = ? AND user_id = ?)`,
    ).run(id, userId);
    db.prepare("DELETE FROM ai_results WHERE scope = 'entry' AND scope_id = ? AND user_id = ?").run(id, userId);
    db.prepare("DELETE FROM photos WHERE entry_id = ?").run(id);
    db.prepare("DELETE FROM entries WHERE id = ? AND user_id = ?").run(id, userId);
  });
  for (const photo of photos) {
    await removeStoredPhoto(String(photo.filename), String(photo.storage ?? "local"), userId);
  }
  return true;
}

export async function addPhoto(entryId: string, file: File) {
  const entry = getEntry(entryId);
  if (!entry) return { ok: false as const, status: 404, message: "기록을 찾지 못했어요." };
  if (!PHOTO_TYPES.includes(file.type as (typeof PHOTO_TYPES)[number])) {
    return { ok: false as const, status: 400, message: "jpg, png, webp, gif 사진만 담을 수 있어요." };
  }
  if (file.size > LIMITS.photoBytes) {
    return { ok: false as const, status: 400, message: "사진은 6MB보다 작은 파일로 올려 주세요." };
  }
  if (entry.photos.length >= LIMITS.photos) {
    return { ok: false as const, status: 400, message: `사진은 ${LIMITS.photos}장까지 붙일 수 있어요.` };
  }
  const id = crypto.randomUUID();
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${id}.${ext}`;
  const full = path.join(photoDirectory(), filename);
  return writePhoto(entryId, id, file, filename, full);
}

async function writePhoto(entryId: string, id: string, file: File, filename: string, full: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > LIMITS.photoBytes) {
    return { ok: false as const, status: 400, message: "사진은 6MB보다 작은 파일로 올려 주세요." };
  }
  const userId = currentUserId();
  const remote = storageStatus().mode === "s3";
  try {
    if (remote) await putObject(objectKey(userId, filename), bytes, file.type);
    else await fs.promises.writeFile(full, bytes);
  } catch {
    return { ok: false as const, status: 502, message: "사진 저장소에 올리지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요." };
  }
  try {
    getDb()
      .prepare("INSERT INTO photos (id, entry_id, mime, filename, created_at, storage) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, entryId, file.type, filename, new Date().toISOString(), remote ? "s3" : "local");
  } catch (error) {
    if (remote) await deleteObject(objectKey(userId, filename)).catch(() => undefined);
    else await fs.promises.rm(full, { force: true });
    throw error;
  }
  return { ok: true as const, photo: { id, mime: file.type } satisfies Photo };
}

async function removeStoredPhoto(filename: string, storage: string, userId: string) {
  if (!/^[\w.-]+$/.test(filename)) return;
  if (storage === "s3") {
    await deleteObject(objectKey(userId, filename)).catch(() => undefined);
    return;
  }
  await fs.promises.rm(path.join(photoDirectory(), filename), { force: true });
}

export async function deletePhoto(entryId: string, photoId: string) {
  if (!getEntry(entryId)) return false;
  const row = getDb().prepare("SELECT filename, storage FROM photos WHERE id = ? AND entry_id = ?").get(photoId, entryId);
  if (!row) return false;
  getDb().prepare("DELETE FROM photos WHERE id = ? AND entry_id = ?").run(photoId, entryId);
  await removeStoredPhoto(String(row.filename), String(row.storage ?? "local"), currentUserId());
  return true;
}

export async function readPhoto(photoId: string) {
  const row = getDb()
    .prepare(
      `SELECT photos.filename, photos.mime, photos.storage
       FROM photos
       JOIN entries ON entries.id = photos.entry_id
       WHERE photos.id = ? AND entries.user_id = ?`,
    )
    .get(photoId, currentUserId());
  if (!row) return null;
  const filename = String(row.filename);
  if (!/^[\w.-]+$/.test(filename)) return null;
  if (String(row.storage ?? "local") === "s3") {
    try {
      const bytes = await getObject(objectKey(currentUserId(), filename));
      if (!bytes) return null;
      return { mime: String(row.mime), bytes };
    } catch {
      return null;
    }
  }
  const full = path.join(photoDirectory(), filename);
  if (!fs.existsSync(full)) return null;
  return { mime: String(row.mime), bytes: fs.readFileSync(full) };
}

export async function photosForAi(entryId: string) {
  const entry = getEntry(entryId);
  if (!entry) return { images: [] as { mime: string; base64: string }[], ids: [] as string[], note: "", message: "기록을 찾지 못했어요." };
  const images: { mime: string; base64: string }[] = [];
  const ids: string[] = [];
  let skipped = 0;
  for (const photo of entry.photos) {
    if (images.length >= 2) {
      skipped += 1;
      continue;
    }
    const file = await readPhoto(photo.id);
    if (!file || file.bytes.byteLength > 2 * 1024 * 1024) {
      skipped += 1;
      continue;
    }
    images.push({ mime: file.mime, base64: file.bytes.toString("base64") });
    ids.push(photo.id);
  }
  if (!images.length) {
    return { images, ids, note: "", message: "보낼 수 있는 사진이 없어요. 2MB 이하 사진을 최대 2장까지 함께 보냅니다." };
  }
  const note = skipped
    ? "첨부 사진 중 일부가 함께 전달되었습니다. 용량이 크거나 두 장을 넘는 사진은 빠졌습니다. 사진에서 실제로 보이는 장면만 참고하고, 보이지 않는 내용은 추측하지 마세요."
    : "첨부 사진이 함께 전달되었습니다. 사진에서 실제로 보이는 장면만 참고하고, 보이지 않는 내용은 추측하지 마세요. 사진으로 마음 상태를 진단하지 마세요.";
  return { images, ids, note, message: "" };
}

export function findCachedAi(scope: string, scopeId: string, kind: AiKind, hash: string, source: AiSource) {
  const row = latestResult(scope, scopeId, kind);
  if (!row) return null;
  if (String(row.content_hash) !== hash || String(row.source) !== source) return null;
  return row;
}

export function saveAiResult(input: {
  scope: "entry" | "month";
  scopeId: string;
  kind: AiKind;
  hash: string;
  source: AiSource;
  payload: unknown;
}) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO ai_results (id, scope, scope_id, kind, content_hash, source, payload, created_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, input.scope, input.scopeId, input.kind, input.hash, input.source, JSON.stringify(input.payload), createdAt, currentUserId());
  return { id, createdAt };
}

export function saveAnswer(entryId: string, index: number, answer: string) {
  const row = latestResult("entry", entryId, "questions");
  if (!row) return { ok: false as const, message: "먼저 회고 질문을 만들어 주세요." };
  const payload = JSON.parse(String(row.payload)) as QuestionsPayload;
  if (!payload.questions.some((question) => question.index === index)) {
    return { ok: false as const, message: "질문을 찾지 못했어요." };
  }
  const resultId = String(row.id);
  const trimmed = answer.trim();
  if (!trimmed) {
    getDb().prepare("DELETE FROM question_answers WHERE result_id = ? AND question_index = ?").run(resultId, index);
  } else if (trimmed.length > 4000) {
    return { ok: false as const, message: "답은 4,000자까지 남길 수 있어요." };
  } else {
    getDb()
      .prepare(
        `INSERT INTO question_answers (result_id, question_index, answer, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(result_id, question_index)
         DO UPDATE SET answer = excluded.answer, updated_at = excluded.updated_at`,
      )
      .run(resultId, index, trimmed, new Date().toISOString());
  }
  return { ok: true as const, entry: getEntryDetail(entryId) };
}

function mergeDayMoods(marks: DayMark[], from: string, to: string) {
  const byDate = new Map(marks.map((mark) => [mark.date, { ...mark }]));
  for (const item of listMoods(from, to)) {
    const current = byDate.get(item.date);
    if (!current) byDate.set(item.date, { date: item.date, mood: item.mood, count: 0 });
    else if (!current.mood) current.mood = item.mood;
  }
  return [...byDate.values()];
}

function latestMoodByDay(entries: DiaryEntry[]) {
  const marks = new Map<string, DayMark>();
  const ordered = [...entries].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  for (const entry of ordered) {
    const current = marks.get(entry.entryDate) ?? { date: entry.entryDate, mood: null, count: 0 };
    current.count += 1;
    current.mood = entry.mood;
    marks.set(entry.entryDate, current);
  }
  return [...marks.values()];
}

export function getInsights(month: string) {
  const bounds = monthBounds(month);
  const saved = listEntries({ from: bounds.from, to: bounds.to, status: "saved", limit: 400, offset: 0 }).entries;
  const withBody = saved.filter((entry) => entry.body.trim().length > 0);
  const moodCounts = new Map<string, number>();
  let unselected = 0;
  for (const entry of saved) {
    if (!entry.mood) unselected += 1;
    else moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
  }
  const dated = new Set(saved.filter((entry) => entry.mood).map((entry) => entry.entryDate));
  for (const item of listMoods(bounds.from, bounds.to)) {
    if (dated.has(item.date)) continue;
    moodCounts.set(item.mood, (moodCounts.get(item.mood) ?? 0) + 1);
  }
  const userMoods: MoodCount[] = [...moodCounts.entries()]
    .map(([mood, count]) => ({ mood: mood as MoodId, count }))
    .sort((a, b) => b.count - a.count);
  if (unselected) userMoods.push({ mood: null, count: unselected });

  const emotionTotals = new Map<string, { intensity: number; count: number }>();
  let analyzedCount = 0;
  if (saved.length) {
    const ids = saved.map((entry) => entry.id);
    const marks = ids.map(() => "?").join(",");
    const rows = getDb()
      .prepare(
        `SELECT scope_id, source, payload, created_at FROM ai_results
         WHERE scope = 'entry' AND kind = 'emotion' AND scope_id IN (${marks})
         ORDER BY created_at DESC`,
      )
      .all(...ids);
    const seen = new Set<string>();
    for (const row of rows) {
      const entryId = String(row.scope_id);
      if (seen.has(entryId)) continue;
      seen.add(entryId);
      if (String(row.source) !== "llm") continue;
      const payload = JSON.parse(String(row.payload)) as EmotionPayload;
      if (!payload.emotions?.length) continue;
      analyzedCount += 1;
      for (const emotion of payload.emotions) {
        const current = emotionTotals.get(emotion.label) ?? { intensity: 0, count: 0 };
        current.intensity += emotion.intensity;
        current.count += 1;
        emotionTotals.set(emotion.label, current);
      }
    }
  }
  const aiEmotions: AiEmotionBar[] = [...emotionTotals.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      intensity: value.count ? value.intensity / value.count : 0,
    }))
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 6);

  const week = weekRange();
  const weekEntries = listEntries({
    from: week.start,
    to: week.end,
    status: "saved",
    limit: 100,
    offset: 0,
  }).entries;
  const monthHash = hashContent(
    withBody
      .map((entry) => [entry.id, entry.updatedAt, entry.entryDate, entry.mood ?? "", entry.title, entry.body].join("\n"))
      .sort()
      .join("\n---\n"),
  );
  const monthly = toRecord<MonthlyPayload>(latestResult("month", month, "monthly"), monthHash);

  return {
    month,
    entryCount: withBody.length,
    savedCount: saved.length,
    sufficient: withBody.length >= LIMITS.monthlyMinEntries,
    userMoods,
    days: mergeDayMoods(latestMoodByDay(saved), bounds.from, bounds.to),
    aiEmotions,
    analyzedCount,
    week: {
      start: week.start,
      end: week.end,
      days: mergeDayMoods(latestMoodByDay(weekEntries), week.start, week.end),
    },
    monthly,
    entries: withBody.map((entry) => ({
      id: entry.id,
      title: entry.title,
      body: entry.body,
      mood: entry.mood,
      entryDate: entry.entryDate,
      updatedAt: entry.updatedAt,
    })),
  };
}
