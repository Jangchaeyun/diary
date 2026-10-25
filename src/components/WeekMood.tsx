import { getMood } from "@/lib/catalog";
import { weekdayLabel } from "@/lib/dates";
import type { DiaryEntry, MoodId } from "@/lib/types";

export function marksFromEntries(entries: DiaryEntry[]) {
  const marks = new Map<string, { mood: MoodId | null; count: number }>();
  const ordered = [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const entry of ordered) {
    const current = marks.get(entry.entryDate);
    if (!current) marks.set(entry.entryDate, { mood: entry.mood, count: 1 });
    else current.count += 1;
  }
  return marks;
}

export function WeekMood({ days, marks }: { days: string[]; marks: Map<string, { mood: MoodId | null; count: number }> }) {
  return (
    <div className="week" aria-label="이번 주 감정">
      {days.map((date) => {
        const mark = marks.get(date);
        const mood = getMood(mark?.mood ?? null);
        return (
          <div key={date} className="week-col">
            <span className="week-face" aria-hidden>{mood?.emoji ?? ""}</span>
            <span
              className="week-mark"
              style={{
                height: mark ? 26 + Math.min(mark.count, 3) * 8 : 8,
                background: mood?.color ?? "transparent",
                border: mood ? "none" : "1px dashed rgba(154, 139, 126, 0.7)",
              }}
            />
            <span className="week-label">{weekdayLabel(date)}</span>
          </div>
        );
      })}
    </div>
  );
}
