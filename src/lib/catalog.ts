import type { MoodId, ThemeId } from "@/lib/types";

export const MOODS: {
  id: MoodId;
  label: string;
  emoji: string;
  color: string;
  soft: string;
  ink: string;
}[] = [
  { id: "happy", label: "행복", emoji: "😄", color: "#F3C399", soft: "#FDE8D4", ink: "#8A5432" },
  { id: "excited", label: "설렘", emoji: "🤩", color: "#F0B9C8", soft: "#FDE7EE", ink: "#8E4560" },
  { id: "calm", label: "평온", emoji: "😌", color: "#C5D9C6", soft: "#E7F1E6", ink: "#3E6848" },
  { id: "sad", label: "슬픔", emoji: "😢", color: "#C5D4E8", soft: "#E4EEF6", ink: "#3E5C80" },
  { id: "anxious", label: "불안", emoji: "😰", color: "#D7C4EA", soft: "#F1E8F8", ink: "#694884" },
  { id: "tired", label: "피곤함", emoji: "🥱", color: "#E3D3B8", soft: "#F6EFE3", ink: "#6E5840" },
];

export const THEMES: { id: ThemeId; label: string; paper: string; accent: string }[] = [
  { id: "ivory", label: "아이보리", paper: "#FFF9F2", accent: "#E7D3B4" },
  { id: "blush", label: "블러쉬", paper: "#FFF5F3", accent: "#F0C6C0" },
  { id: "lavender", label: "라벤더", paper: "#F8F4FC", accent: "#D9C6EA" },
  { id: "sage", label: "세이지", paper: "#F5F8F4", accent: "#C9DCC8" },
  { id: "sand", label: "샌드", paper: "#FBF6EE", accent: "#E4CFAE" },
  { id: "dusk", label: "더스크", paper: "#F7F2F5", accent: "#E3D0DA" },
];

const moodMap = new Map(MOODS.map((mood) => [mood.id, mood]));
const themeMap = new Map(THEMES.map((theme) => [theme.id, theme]));

export function isMoodId(value: unknown): value is MoodId {
  return typeof value === "string" && moodMap.has(value as MoodId);
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeMap.has(value as ThemeId);
}

export function getMood(id: MoodId | null) {
  if (!id) return null;
  return moodMap.get(id) ?? null;
}

export function getTheme(id: ThemeId) {
  return themeMap.get(id) ?? THEMES[0];
}
