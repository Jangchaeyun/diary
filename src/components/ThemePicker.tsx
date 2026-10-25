"use client";

import { THEMES } from "@/lib/catalog";
import type { ThemeId } from "@/lib/types";

export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (theme: ThemeId) => void }) {
  return (
    <div className="theme-row" role="listbox" aria-label="일기 테마">
      {THEMES.map((theme) => {
        const active = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="option"
            aria-selected={active}
            className={`theme-swatch${active ? " is-active" : ""}`}
            style={{ background: theme.paper, ["--swatch" as string]: theme.accent }}
            onClick={() => onChange(theme.id)}
          >
            {theme.label}
          </button>
        );
      })}
    </div>
  );
}
