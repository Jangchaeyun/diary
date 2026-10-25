"use client";

import { MOODS } from "@/lib/catalog";
import type { MoodId } from "@/lib/types";

export function MoodPicker({
  value,
  onChange,
}: {
  value: MoodId | null;
  onChange: (mood: MoodId) => void;
}) {
  return (
    <div className="mood-grid" role="listbox" aria-label="기분 선택">
      {MOODS.map((mood) => {
        const active = value === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            role="option"
            aria-selected={active}
            className={`mood-btn${active ? " is-active" : ""}`}
            style={{ background: active ? mood.soft : undefined }}
            onClick={() => onChange(mood.id)}
          >
            <span className="mood-emoji" aria-hidden>{mood.emoji}</span>
            <span>{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}
