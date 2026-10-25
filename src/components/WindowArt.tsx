export function WindowArt({ sky }: { sky: "morning" | "day" | "evening" | "night" }) {
  const colors = {
    morning: ["#F8E2C8", "#F6D3C6"],
    day: ["#F7E7CF", "#E7E3F4"],
    evening: ["#F3D2C8", "#E4D4F1"],
    night: ["#E7D7EA", "#D9C6EA"],
  }[sky];
  return (
    <svg viewBox="0 0 140 92" width="92" height="60" aria-hidden>
      <rect x="28" y="8" width="84" height="70" rx="18" fill={colors[0]} />
      <rect x="36" y="16" width="68" height="54" rx="12" fill={colors[1]} />
      <path d="M70 16v54M36 42h68" stroke="#fffaf5" strokeWidth="2" />
      <circle cx="86" cy="30" r="7" fill="#fff7ea" />
      <path d="M48 70c6-10 12-10 16 0" fill="#C9DCC8" />
      <rect x="62" y="58" width="6" height="12" rx="2" fill="#C4A484" />
    </svg>
  );
}
