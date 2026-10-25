export const STAMPS = [
  { id: "happy", label: "행복", color: "#F3C399" },
  { id: "excited", label: "설렘", color: "#F0B9C8" },
  { id: "calm", label: "평온", color: "#C5D9C6" },
  { id: "sad", label: "슬픔", color: "#C5D4E8" },
  { id: "anxious", label: "불안", color: "#D7C4EA" },
  { id: "tired", label: "피곤", color: "#E3D3B8" },
  { id: "love", label: "사랑", color: "#E7A0A4" },
  { id: "shy", label: "수줍", color: "#F3C1D3" },
  { id: "proud", label: "뿌듯", color: "#E7C98A" },
  { id: "think", label: "생각", color: "#C9B6E0" },
  { id: "surprise", label: "놀람", color: "#F0C399" },
  { id: "sleep", label: "잠", color: "#D5D0E8" },
  { id: "cry", label: "눈물", color: "#C5D4E8" },
  { id: "kiss", label: "쪽", color: "#F3C1D3" },
  { id: "grin", label: "활짝", color: "#F2C14D" },
  { id: "relief", label: "안도", color: "#D5E3D4" },
  { id: "cool", label: "멋", color: "#C9D7E4" },
  { id: "yum", label: "맛남", color: "#F3C399" },
  { id: "grateful", label: "고마움", color: "#E7A0A4" },
  { id: "worry", label: "걱정", color: "#D7C4EA" },
  { id: "cheer", label: "신남", color: "#F0B9C8" },
  { id: "sorry", label: "미안", color: "#E3D3B8" },
  { id: "hope", label: "희망", color: "#E7C98A" },
  { id: "soft", label: "다정", color: "#F6E3D4" },
] as const;

export type StampId = (typeof STAMPS)[number]["id"];

export type DayStamp = {
  date: string;
  stamp: StampId;
};

export function isStampId(value: unknown): value is StampId {
  return typeof value === "string" && STAMPS.some((item) => item.id === value);
}

export function stampLabel(id: StampId) {
  return STAMPS.find((item) => item.id === id)?.label ?? "도장";
}

export function stampColor(id: StampId) {
  return STAMPS.find((item) => item.id === id)?.color ?? "#f2c94c";
}
