export const APPEARANCES = [
  { id: "ink", label: "잉크", bg: "#f3f2ef", paper: "#ffffff", ink: "#1c1917", mark: "#9f4d4d" },
  { id: "linen", label: "리넨", bg: "#f3ecdf", paper: "#fffdf8", ink: "#3f342c", mark: "#9a6244" },
  { id: "forest", label: "숲", bg: "#e7eee8", paper: "#f7faf7", ink: "#1e3328", mark: "#3f6b52" },
  { id: "sea", label: "바다", bg: "#e7eef2", paper: "#f7fafc", ink: "#1c2c38", mark: "#3d6d86" },
  { id: "dusk", label: "노을", bg: "#f3ebe8", paper: "#fffaf8", ink: "#3a2a2a", mark: "#9a5450" },
  { id: "night", label: "밤", bg: "#141311", paper: "#1e1c1a", ink: "#f4f0ea", mark: "#d4a294" },
] as const;

export type AppearanceId = (typeof APPEARANCES)[number]["id"];

const appearanceMap = new Map(APPEARANCES.map((item) => [item.id, item]));

export function isAppearanceId(value: unknown): value is AppearanceId {
  return typeof value === "string" && appearanceMap.has(value as AppearanceId);
}
