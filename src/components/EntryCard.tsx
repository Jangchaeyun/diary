import Image from "next/image";
import Link from "next/link";
import { getMood, getTheme } from "@/lib/catalog";
import { dayRelation } from "@/lib/dates";
import type { DiaryEntry } from "@/lib/types";

export function entryTitle(entry: Pick<DiaryEntry, "title" | "body">) {
  return entry.title.trim() || "제목 없는 기록";
}

export function excerpt(body: string) {
  const text = body.trim().replace(/\s+/g, " ");
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export function EntryCard({ entry }: { entry: DiaryEntry }) {
  const mood = getMood(entry.mood);
  const theme = getTheme(entry.theme);
  const photo = entry.photos[0];
  return (
    <Link href={`/entry/${entry.id}`} className="card card-link" style={{ background: theme.paper, borderColor: theme.accent }}>
      <article className="entry-card">
        <div className="entry-copy">
          <div className="meta">
            <span>{dayRelation(entry.entryDate)}</span>
            {entry.status === "draft" ? <span className="badge">임시</span> : null}
            {mood ? <span className="meta-mood"><span aria-hidden>{mood.emoji}</span>{mood.label}</span> : null}
          </div>
          <h3 className="entry-title serif">{entryTitle(entry)}</h3>
          <p className="muted clamp-2" style={{ margin: 0 }}>{excerpt(entry.body) || "아직 본문이 없어요."}</p>
        </div>
        {photo ? (
          <div className="thumb">
            <Image src={`/api/photos/${photo.id}`} alt={`${entryTitle(entry)} 사진`} fill unoptimized sizes="76px" style={{ objectFit: "cover" }} />
          </div>
        ) : mood ? (
          <span className="seal" style={{ background: mood.soft }} aria-hidden>{mood.emoji}</span>
        ) : null}
      </article>
    </Link>
  );
}
