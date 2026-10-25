export const STICKERS = [
  { id: "star", label: "별" },
  { id: "heart", label: "하트" },
  { id: "flower", label: "꽃" },
  { id: "clover", label: "클로버" },
  { id: "ribbon", label: "리본" },
  { id: "moon", label: "달" },
  { id: "sun", label: "해" },
  { id: "cloud", label: "구름" },
  { id: "butterfly", label: "나비" },
  { id: "sparkle", label: "반짝" },
  { id: "tulip", label: "튤립" },
  { id: "leaf", label: "잎" },
  { id: "note", label: "음표" },
  { id: "smile", label: "웃음" },
  { id: "rainbow", label: "무지개" },
  { id: "cake", label: "케이크" },
  { id: "coffee", label: "커피" },
  { id: "cat", label: "고양이" },
  { id: "cherry", label: "벚꽃" },
  { id: "balloon", label: "풍선" },
  { id: "gift", label: "선물" },
  { id: "book", label: "책" },
  { id: "camera", label: "카메라" },
  { id: "umbrella", label: "우산" },
  { id: "snow", label: "눈" },
  { id: "candle", label: "초" },
  { id: "candy", label: "사탕" },
  { id: "crown", label: "왕관" },
  { id: "berry", label: "딸기" },
  { id: "bunny", label: "토끼" },
  { id: "letter", label: "편지" },
  { id: "cream", label: "아이스크림" },
  { id: "cookie", label: "쿠키" },
  { id: "rose", label: "장미" },
  { id: "mushroom", label: "버섯" },
  { id: "comet", label: "별똥별" },
  { id: "tea", label: "차" },
  { id: "bear", label: "곰" },
  { id: "peach", label: "복숭아" },
  { id: "gem", label: "보석" },
  { id: "paw", label: "발자국" },
  { id: "drop", label: "빗방울" },
  { id: "tree", label: "나무" },
  { id: "donut", label: "도넛" },
] as const;

export type StickerId = (typeof STICKERS)[number]["id"];

export type DaySticker = {
  date: string;
  sticker: StickerId;
};

export function isStickerId(value: unknown): value is StickerId {
  return typeof value === "string" && STICKERS.some((item) => item.id === value);
}

export function stickerLabel(id: StickerId) {
  return STICKERS.find((item) => item.id === id)?.label ?? "스티커";
}
