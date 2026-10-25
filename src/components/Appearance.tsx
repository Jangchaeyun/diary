"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { APPEARANCES, isAppearanceId, type AppearanceId } from "@/lib/appearances";

type AppearanceContextValue = {
  appearance: AppearanceId;
  choose: (next: AppearanceId) => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const guest = pathname === "/login" || pathname === "/privacy";
  const [appearance, setAppearance] = useState<AppearanceId>("ink");

  useEffect(() => {
    document.documentElement.dataset.appearance = appearance;
  }, [appearance]);

  useEffect(() => {
    if (guest) return;
    let ignore = false;
    api<{ appearance: string }>("/api/account")
      .then((data) => {
        if (!ignore && isAppearanceId(data.appearance)) setAppearance(data.appearance);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [guest]);

  async function choose(next: AppearanceId) {
    const previous = appearance;
    setAppearance(next);
    try {
      await api("/api/account", { method: "PATCH", body: JSON.stringify({ appearance: next }) });
    } catch (reason) {
      setAppearance(previous);
      throw reason instanceof ApiError ? reason : new Error("테마를 저장하지 못했어요.");
    }
  }

  return <AppearanceContext.Provider value={{ appearance, choose }}>{children}</AppearanceContext.Provider>;
}

export function AppearancePicker() {
  const context = useContext(AppearanceContext);
  if (!context) return null;
  const { appearance, choose } = context;
  return (
    <div className="appearance-row" role="listbox" aria-label="화면 테마">
      {APPEARANCES.map((item) => {
        const active = appearance === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={active}
            className={`appearance-swatch${active ? " is-active" : ""}`}
            onClick={() => {
              void choose(item.id).catch(() => {});
            }}
          >
            <span className="appearance-preview" style={{ background: item.bg, color: item.ink }}>
              <span style={{ background: item.paper }}>가</span>
              <i style={{ background: item.mark }} />
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
