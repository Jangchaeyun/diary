const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(now = new Date()) {
  return toISODate(now);
}

export function parseISODate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isISODate(value: string) {
  return parseISODate(value) !== null;
}

export function isYearMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function shiftMonth(yearMonth: string, delta: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthBounds(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();
  return {
    year,
    month,
    from: `${yearMonth}-01`,
    to: `${yearMonth}-${String(last).padStart(2, "0")}`,
    last,
  };
}

export function currentYearMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function weekdayIndex(iso: string) {
  return parseISODate(iso)?.getDay() ?? 0;
}

export function weekdayLabel(iso: string) {
  return WEEKDAYS[weekdayIndex(iso)];
}

export function formatKoreanDate(iso: string) {
  const date = parseISODate(iso);
  if (!date) {
    return { year: 0, month: 0, day: 0, weekday: "일" as const, full: iso, medium: iso, short: iso };
  }
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return {
    year: date.getFullYear(),
    month,
    day,
    weekday,
    full: `${date.getFullYear()}년 ${month}월 ${day}일 ${weekday}요일`,
    medium: `${month}월 ${day}일 ${weekday}요일`,
    short: `${month}월 ${day}일`,
  };
}

export function formatClock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const hour = hours % 12 || 12;
  return `${period} ${hour}:${minutes}`;
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 5) return { text: "늦은 밤이에요", sky: "night" as const };
  if (hour < 11) return { text: "좋은 아침이에요", sky: "morning" as const };
  if (hour < 17) return { text: "따뜻한 오후예요", sky: "day" as const };
  if (hour < 21) return { text: "포근한 저녁이에요", sky: "evening" as const };
  return { text: "고요한 밤이에요", sky: "night" as const };
}

export function weekRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toISODate(date);
  });
  return { start: days[0], end: days[6], days };
}

export function monthMatrix(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const count = new Date(year, month, 0).getDate();
  const cells: { date: string | null }[] = [];
  for (let index = 0; index < first.getDay(); index += 1) cells.push({ date: null });
  for (let day = 1; day <= count; day += 1) {
    cells.push({ date: toISODate(new Date(year, month - 1, day)) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

export function dayRelation(iso: string, today = todayISO()) {
  if (iso === today) return "오늘";
  const date = parseISODate(iso);
  const base = parseISODate(today);
  if (!date || !base) return formatKoreanDate(iso).short;
  const diff = Math.round((base.getTime() - date.getTime()) / 86400000);
  if (diff === 1) return "어제";
  if (diff === -1) return "내일";
  return formatKoreanDate(iso).short;
}
