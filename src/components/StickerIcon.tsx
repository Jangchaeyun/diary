import type { ReactNode } from "react";
import type { StickerId } from "@/lib/sticker-catalog";

const shapes: Record<StickerId, ReactNode> = {
  star: <polygon points="20,3 24.8,14.2 37,15.2 27.6,23.2 30.6,35 20,28.6 9.4,35 12.4,23.2 3,15.2 15.2,14.2" fill="#f2c14d" />,
  heart: <path d="M20 34 C8 24 5 16 11 11 C15 8 19 11 20 14 C21 11 25 8 29 11 C35 16 32 24 20 34 Z" fill="#e7a0a4" />,
  flower: (
    <>
      <circle cx="20" cy="11" r="6" fill="#f3c1d3" />
      <circle cx="29" cy="18" r="6" fill="#f3c1d3" />
      <circle cx="25" cy="28" r="6" fill="#f3c1d3" />
      <circle cx="15" cy="28" r="6" fill="#f3c1d3" />
      <circle cx="11" cy="18" r="6" fill="#f3c1d3" />
      <circle cx="20" cy="20" r="4.2" fill="#f2c14d" />
    </>
  ),
  clover: (
    <>
      <circle cx="20" cy="12" r="6" fill="#7daf8a" />
      <circle cx="12" cy="20" r="6" fill="#7daf8a" />
      <circle cx="28" cy="20" r="6" fill="#7daf8a" />
      <circle cx="20" cy="22" r="5" fill="#6a9b78" />
      <path d="M20 24 v12" stroke="#6a9b78" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  ribbon: (
    <>
      <path d="M20 18 C12 8 4 14 10 22 C14 26 18 22 20 18 Z" fill="#e7b7b2" />
      <path d="M20 18 C28 8 36 14 30 22 C26 26 22 22 20 18 Z" fill="#e7b7b2" />
      <circle cx="20" cy="19" r="3.2" fill="#c48480" />
      <path d="M17 22 L12 34 L20 28 L18 22 Z" fill="#e7b7b2" />
      <path d="M23 22 L28 34 L20 28 L22 22 Z" fill="#d7a39e" />
    </>
  ),
  moon: <path fill="#d4c0ee" fillRule="evenodd" d="M19 5a14 14 0 1 0 0 30 14 14 0 1 0 0-30zm9 5a11 11 0 1 1 0 22 11 11 0 1 1 0-22z" />,
  sun: (
    <>
      <circle cx="20" cy="20" r="8" fill="#f2c14d" />
      <g fill="#f2c14d">
        <rect x="18.2" y="3" width="3.6" height="6" rx="1.8" />
        <rect x="18.2" y="31" width="3.6" height="6" rx="1.8" />
        <rect x="3" y="18.2" width="6" height="3.6" rx="1.8" />
        <rect x="31" y="18.2" width="6" height="3.6" rx="1.8" />
        <rect x="7.2" y="7.2" width="3.6" height="6" rx="1.8" transform="rotate(-45 9 10.2)" />
        <rect x="29.2" y="7.2" width="3.6" height="6" rx="1.8" transform="rotate(45 31 10.2)" />
        <rect x="7.2" y="26.8" width="3.6" height="6" rx="1.8" transform="rotate(45 9 29.8)" />
        <rect x="29.2" y="26.8" width="3.6" height="6" rx="1.8" transform="rotate(-45 31 29.8)" />
      </g>
    </>
  ),
  cloud: <path d="M14 29h14a7 7 0 0 0 1.2-13.9 8.5 8.5 0 0 0-16.4 2.4A6.2 6.2 0 0 0 14 29z" fill="#d5e4f4" />,
  butterfly: (
    <>
      <ellipse cx="12.5" cy="15" rx="8" ry="6.2" fill="#d4c0ee" transform="rotate(-18 12.5 15)" />
      <ellipse cx="27.5" cy="15" rx="8" ry="6.2" fill="#d4c0ee" transform="rotate(18 27.5 15)" />
      <ellipse cx="13.5" cy="25.5" rx="6.2" ry="5" fill="#f3c1d3" transform="rotate(16 13.5 25.5)" />
      <ellipse cx="26.5" cy="25.5" rx="6.2" ry="5" fill="#f3c1d3" transform="rotate(-16 26.5 25.5)" />
      <rect x="18.4" y="11" width="3.2" height="18" rx="1.6" fill="#8d6eae" />
      <circle cx="20" cy="10.2" r="1.8" fill="#8d6eae" />
    </>
  ),
  sparkle: (
    <>
      <path d="M20 4l2.2 11.2L34 18l-11.8 2.8L20 32l-2.2-11.2L6 18l11.8-2.8z" fill="#f2c14d" />
      <path d="M31 26l.8 3.4L35.2 31l-3.4.8L31 35.2l-.8-3.4L26.8 31l3.4-.8z" fill="#f6d98a" />
    </>
  ),
  tulip: (
    <>
      <path d="M20 22c-1.2-4-6.5-6.5-8.2-2.2-1.4 3.4 2.2 6.4 8.2 2.2z" fill="#e7a0b4" />
      <path d="M20 22c1.2-4 6.5-6.5 8.2-2.2 1.4 3.4-2.2 6.4-8.2 2.2z" fill="#e7a0b4" />
      <path d="M20 23c-2.4-5.2-1.2-10 0-13 1.2 3 2.4 7.8 0 13z" fill="#d4536a" />
      <path d="M19 22.5h2V34h-2z" fill="#7daf8a" />
      <path d="M20 28c6 0 8 3 9 6-5-1-8-3-9-6z" fill="#7daf8a" />
    </>
  ),
  leaf: (
    <>
      <path d="M9 27c1-12 12-18 24-18-1 13-11 22-24 18z" fill="#7daf8a" />
      <path d="M12 26c6-5 12-9 18-13" fill="none" stroke="#f7fbf6" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  note: (
    <>
      <ellipse cx="14.5" cy="29" rx="6.2" ry="4.4" fill="#c48480" transform="rotate(-18 14.5 29)" />
      <path d="M19.2 27.2V9.2h2.6V25z" fill="#c48480" />
      <path d="M21.6 9.2h11.2v3.2c-3.6 1.6-7.4 1.8-11.2.2z" fill="#c48480" />
    </>
  ),
  smile: (
    <>
      <circle cx="20" cy="20" r="14" fill="#f6d98a" />
      <circle cx="14.8" cy="17" r="1.7" fill="#6b5344" />
      <circle cx="25.2" cy="17" r="1.7" fill="#6b5344" />
      <path d="M13.5 23.5c1.8 3.4 4 5 6.5 5s4.7-1.6 6.5-5" fill="none" stroke="#6b5344" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  rainbow: (
    <>
      <path d="M6 30c0-12 6.2-20 14-20s14 8 14 20" fill="none" stroke="#e7a0a4" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M10 30c0-9 4.4-15 10-15s10 6 10 15" fill="none" stroke="#f2c14d" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M14 30c0-6 2.6-10 6-10s6 4 6 10" fill="none" stroke="#7daf8a" strokeWidth="3.2" strokeLinecap="round" />
    </>
  ),
  cake: (
    <>
      <path d="M9 22c2.6-4 6-4 8.5 0S22 26 25 22s6-4 7.5 0v12H9z" fill="#f3c1d3" />
      <rect x="9" y="24" width="23" height="11" rx="2" fill="#f6d98a" />
      <circle cx="20" cy="14" r="2.6" fill="#d4536a" />
      <path d="M20 14 V9" stroke="#7daf8a" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  coffee: (
    <>
      <path d="M11 16h16v12a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z" fill="#c48480" />
      <path d="M27 18h3.2a4 4 0 0 1 0 8H27" fill="none" stroke="#c48480" strokeWidth="2.4" />
      <path d="M16 12c.8 1.6-.2 2.4.6 4M20 10c.8 1.6-.2 2.4.6 4M24 12c.8 1.6-.2 2.4.6 4" fill="none" stroke="#d7c4ea" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  cat: (
    <>
      <path d="M11 18 8 8l8 6zM29 18l3-10-8 6z" fill="#f2c14d" />
      <circle cx="20" cy="23" r="11" fill="#f2c14d" />
      <circle cx="16" cy="22" r="1.5" fill="#3c332c" />
      <circle cx="24" cy="22" r="1.5" fill="#3c332c" />
      <path d="M18.2 25.5h3.6L20 28z" fill="#e7a0a4" />
    </>
  ),
  cherry: (
    <>
      <circle cx="20" cy="16" r="5" fill="#f3c1d3" />
      <circle cx="13" cy="22" r="5" fill="#f3c1d3" />
      <circle cx="27" cy="22" r="5" fill="#e7a0b4" />
      <circle cx="16" cy="29" r="4.5" fill="#f3c1d3" />
      <circle cx="24" cy="29" r="4.5" fill="#f3c1d3" />
      <circle cx="20" cy="23" r="3.2" fill="#f2c14d" />
    </>
  ),
  balloon: (
    <>
      <ellipse cx="20" cy="16" rx="10" ry="12" fill="#e7a0a4" />
      <path d="M20 28l-2 3h4z" fill="#c48480" />
      <path d="M20 31c2 3-1 5 1 7" fill="none" stroke="#c48480" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  gift: (
    <>
      <rect x="8" y="16" width="24" height="16" rx="2" fill="#f3c1d3" />
      <rect x="18" y="16" width="4" height="16" fill="#e7a0a4" />
      <rect x="8" y="21" width="24" height="4" fill="#e7a0a4" />
      <path d="M20 16c-4-6-10-4-8 0M20 16c4-6 10-4 8 0" fill="none" stroke="#d4536a" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  book: (
    <>
      <path d="M8 10h11v22H10a2 2 0 0 1-2-2z" fill="#f6d98a" />
      <path d="M32 10H21v22h9a2 2 0 0 0 2-2z" fill="#f3c1d3" />
      <path d="M20 10v22" stroke="#c48480" strokeWidth="1.4" />
    </>
  ),
  camera: (
    <>
      <rect x="7" y="14" width="26" height="18" rx="4" fill="#6f6258" />
      <circle cx="20" cy="23" r="6" fill="#d5e4f4" />
      <circle cx="20" cy="23" r="3" fill="#3c332c" />
      <rect x="14" y="10" width="8" height="5" rx="1.5" fill="#6f6258" />
    </>
  ),
  umbrella: (
    <>
      <path d="M8 20a12 12 0 0 1 24 0z" fill="#d4c0ee" />
      <path d="M20 8v22" stroke="#8d6eae" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 30a4 4 0 0 0 4 4" fill="none" stroke="#8d6eae" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  snow: <path d="M20 5l1.6 8.2L30 9l-4.2 7.2L36 20l-10.2 1.8L30 31l-8.4-4.2L20 35l-1.6-8.2L10 31l4.2-7.2L4 20l10.2-1.8L10 9l8.4 4.2z" fill="#d5e4f4" />,
  candle: (
    <>
      <rect x="16" y="16" width="8" height="18" rx="2" fill="#f6d98a" />
      <path d="M20 15c2-3 1-6 0-8-1 2-2 5 0 8z" fill="#f0b429" />
    </>
  ),
  candy: (
    <>
      <ellipse cx="20" cy="20" rx="8" ry="6" fill="#e7a0a4" transform="rotate(-20 20 20)" />
      <path d="M12 16 6 12l2 6zM28 24l6 4-2-6z" fill="#f3c1d3" />
    </>
  ),
  crown: <path d="M8 28 10 14l6 8 4-12 4 12 6-8 2 14z" fill="#f2c14d" />,
  berry: (
    <>
      <path d="M20 12c8 2 12 10 10 18-2 6-8 8-10 8s-8-2-10-8C8 22 12 14 20 12z" fill="#d4536a" />
      <path d="M16 12c2-4 8-4 10 0" fill="none" stroke="#7daf8a" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  bunny: (
    <>
      <ellipse cx="14" cy="12" rx="3.2" ry="8" fill="#f6e7dc" />
      <ellipse cx="26" cy="12" rx="3.2" ry="8" fill="#f6e7dc" />
      <circle cx="20" cy="24" r="10" fill="#f6e7dc" />
      <circle cx="16.5" cy="23" r="1.4" fill="#3c332c" />
      <circle cx="23.5" cy="23" r="1.4" fill="#3c332c" />
      <path d="M18.5 26.5h3L20 28.4z" fill="#e7a0a4" />
    </>
  ),
  letter: (
    <>
      <rect x="7" y="12" width="26" height="18" rx="2" fill="#f6d98a" />
      <path d="M7 14l13 9 13-9" fill="none" stroke="#e7c98a" strokeWidth="2" />
    </>
  ),
  cream: (
    <>
      <path d="M14 20h12l-6 16z" fill="#e7c98a" />
      <circle cx="16" cy="16" r="6" fill="#f3c1d3" />
      <circle cx="24" cy="16" r="6" fill="#f6d98a" />
      <circle cx="20" cy="12" r="5" fill="#fff" />
    </>
  ),
  cookie: (
    <>
      <circle cx="20" cy="20" r="13" fill="#e7c98a" />
      <circle cx="15" cy="16" r="1.6" fill="#8a5a3a" />
      <circle cx="24" cy="18" r="1.6" fill="#8a5a3a" />
      <circle cx="18" cy="24" r="1.6" fill="#8a5a3a" />
      <circle cx="25" cy="25" r="1.4" fill="#8a5a3a" />
    </>
  ),
  rose: (
    <>
      <circle cx="20" cy="18" r="5" fill="#d4536a" />
      <circle cx="15" cy="20" r="4" fill="#e7a0a4" />
      <circle cx="25" cy="20" r="4" fill="#e7a0a4" />
      <circle cx="20" cy="23" r="4" fill="#f3c1d3" />
      <path d="M20 26v10" stroke="#7daf8a" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  mushroom: (
    <>
      <path d="M8 22a12 12 0 0 1 24 0z" fill="#d4536a" />
      <rect x="16" y="22" width="8" height="12" rx="3" fill="#f6e7dc" />
      <circle cx="16" cy="18" r="1.6" fill="#fff" />
      <circle cx="24" cy="17" r="1.3" fill="#fff" />
    </>
  ),
  comet: (
    <>
      <path d="M8 28c8-2 14-8 18-16-6 2-12 8-18 16z" fill="#f2c14d" />
      <circle cx="28" cy="12" r="5" fill="#f6d98a" />
    </>
  ),
  tea: (
    <>
      <path d="M10 16h16v10a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z" fill="#7daf8a" />
      <path d="M26 18h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#7daf8a" strokeWidth="2.4" />
      <path d="M12 14h12" stroke="#6a9b78" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  bear: (
    <>
      <circle cx="11" cy="12" r="5" fill="#c48480" />
      <circle cx="29" cy="12" r="5" fill="#c48480" />
      <circle cx="20" cy="22" r="12" fill="#e7b7b2" />
      <ellipse cx="20" cy="25" rx="4" ry="3" fill="#f6e7dc" />
      <circle cx="16" cy="20" r="1.5" fill="#3c332c" />
      <circle cx="24" cy="20" r="1.5" fill="#3c332c" />
    </>
  ),
  peach: (
    <>
      <circle cx="20" cy="22" r="12" fill="#f3c399" />
      <path d="M20 10c2 6 2 12 0 24" fill="none" stroke="#e7b08a" strokeWidth="1.4" />
      <path d="M20 12c4-2 8 0 8 2-4 1-7 0-8-2z" fill="#7daf8a" />
    </>
  ),
  gem: <path d="M12 14h16l4 6-12 16L8 20z" fill="#d4c0ee" />,
  paw: (
    <>
      <ellipse cx="20" cy="26" rx="8" ry="6" fill="#e7b7b2" />
      <circle cx="12" cy="16" r="3.2" fill="#e7b7b2" />
      <circle cx="18" cy="12" r="3.2" fill="#e7b7b2" />
      <circle cx="25" cy="13" r="3.2" fill="#e7b7b2" />
      <circle cx="30" cy="18" r="2.8" fill="#e7b7b2" />
    </>
  ),
  drop: <path d="M20 6c8 10 10 14 10 18a10 10 0 0 1-20 0c0-4 2-8 10-18z" fill="#9eb6e0" />,
  tree: (
    <>
      <path d="M20 6 32 22H8z" fill="#7daf8a" />
      <path d="M20 14 34 30H6z" fill="#6a9b78" />
      <rect x="17" y="28" width="6" height="8" rx="1" fill="#c48480" />
    </>
  ),
  donut: (
    <>
      <path fill="#f3c399" fillRule="evenodd" d="M20 6a14 14 0 1 0 0 28 14 14 0 0 0 0-28zm0 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
      <circle cx="16" cy="16" r="1.3" fill="#d4536a" />
      <circle cx="25" cy="18" r="1.3" fill="#f2c14d" />
      <circle cx="22" cy="26" r="1.3" fill="#7daf8a" />
    </>
  ),
};

export function StickerIcon({ id, className }: { id: StickerId; className?: string }) {
  return (
    <svg className={className ?? "sticker-icon"} viewBox="0 0 40 40" width="32" height="32" aria-hidden>
      {shapes[id]}
    </svg>
  );
}
