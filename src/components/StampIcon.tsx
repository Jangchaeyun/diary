import type { ReactNode } from "react";
import { stampColor, type StampId } from "@/lib/stamp-catalog";

const INK = "#3a332c";

function DotEyes({ y = 16, r = 2.5 }: { y?: number; r?: number }) {
  return (
    <>
      <circle cx="14" cy={y} r={r} fill={INK} />
      <circle cx="26" cy={y} r={r} fill={INK} />
    </>
  );
}

function Smile() {
  return <path d="M12 23 Q20 31 28 23" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />;
}

function HeartEye({ cx, cy }: { cx: number; cy: number }) {
  return <path fill={INK} transform={`translate(${cx} ${cy})`} d="M0 1.1C-1.8-.9-4.4.2-2.5 2.7L0 4.8 2.5 2.7C4.4.2 1.8-.9 0 1.1Z" />;
}

const faces: Record<StampId, ReactNode> = {
  happy: (
    <>
      <DotEyes />
      <Smile />
    </>
  ),
  excited: (
    <>
      <circle cx="14" cy="16" r="2.5" fill={INK} />
      <path d="M23 17 q3-3.2 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <Smile />
    </>
  ),
  calm: (
    <>
      <DotEyes r={2.2} />
      <path d="M13 24 Q20 29 27 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  sad: (
    <>
      <DotEyes />
      <path d="M13 28 Q20 22 27 28" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  anxious: (
    <>
      <DotEyes r={2.1} />
      <path d="M14 26 H26" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  tired: <path d="M11 13.2 l6 6 m0-6 l-6 6 M23 13.2 l6 6 m0-6 l-6 6" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />,
  love: (
    <>
      <HeartEye cx={14} cy={13} />
      <HeartEye cx={26} cy={13} />
      <Smile />
    </>
  ),
  shy: (
    <>
      <ellipse cx="9.5" cy="22" rx="2.6" ry="1.7" fill="#e7899b" />
      <ellipse cx="30.5" cy="22" rx="2.6" ry="1.7" fill="#e7899b" />
      <DotEyes r={2.2} />
      <path d="M14 24 Q20 28 26 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  proud: (
    <>
      <path d="M11 17 q3-4 6 0 M23 17 q3-4 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <Smile />
    </>
  ),
  think: (
    <>
      <DotEyes y={14} r={2.3} />
      <path d="M17 27 H23" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  surprise: (
    <>
      <DotEyes y={15} r={2.8} />
      <circle cx="20" cy="26.5" r="3.3" fill="none" stroke={INK} strokeWidth="2.2" />
    </>
  ),
  sleep: <path d="M11 17 H17 M23 17 H29" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />,
  cry: (
    <>
      <DotEyes />
      <path d="M13 27 Q20 22 27 27" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 20c.4 3 .2 5-.4 7M25 20c-.4 3-.2 5.4.4 7" fill="none" stroke="#7ea0c4" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  kiss: (
    <>
      <DotEyes r={2.2} />
      <path d="M16 26c1.2 1.6 2.4 1.6 4 0 1.6 1.6 2.8 1.6 4 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  grin: (
    <>
      <DotEyes />
      <path d="M12 23c1.4 6 14.6 6 16 0z" fill={INK} />
    </>
  ),
  relief: (
    <>
      <path d="M11 17 q3-3 6 0 M23 17 q3-3 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 26 Q20 29 26 26" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  cool: (
    <>
      <path d="M9 16h9v5H10zM22 16h9v5H22z" fill={INK} />
      <path d="M18 18h4" stroke={INK} strokeWidth="2" />
      <path d="M14 26 Q20 30 26 26" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  yum: (
    <>
      <DotEyes />
      <path d="M14 24c2 3 10 3 12 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 25c.4 3 1 4 2.4 5" fill="none" stroke="#d4536a" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  grateful: (
    <>
      <path d="M11 17 q3-4 6 0 M23 17 q3-4 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <HeartEye cx={20} cy={22} />
    </>
  ),
  worry: (
    <>
      <path d="M11 13l5 2M29 13l-5 2" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <DotEyes y={18} />
      <path d="M14 27c2-2 4 2 6 0s4 2 6 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  cheer: (
    <>
      <DotEyes r={2.8} />
      <path d="M11 23c1.6 7 16.4 7 18 0z" fill={INK} />
    </>
  ),
  sorry: (
    <>
      <path d="M12 18 q2 3 4 0 M24 18 q2 3 4 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 27 Q20 23 26 27" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  hope: (
    <>
      <DotEyes y={15} />
      <path d="M13 25 Q20 31 27 25" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  soft: (
    <>
      <ellipse cx="12" cy="22" rx="2.2" ry="1.4" fill="#e7a0a4" />
      <ellipse cx="28" cy="22" rx="2.2" ry="1.4" fill="#e7a0a4" />
      <path d="M12 17 q2-3 4 0 M24 17 q2-3 4 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 26 Q20 29 25 26" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

export function StampIcon({ id, className }: { id: StampId; className?: string }) {
  return (
    <svg className={className ?? "stamp"} viewBox="0 0 40 40" width="32" height="32" aria-hidden>
      <circle cx="20" cy="20" r="16" fill={stampColor(id)} />
      {faces[id]}
    </svg>
  );
}
