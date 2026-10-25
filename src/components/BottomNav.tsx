"use client";

import Link from "next/link";
import { BookIcon, CalendarIcon, HeartIcon, HomeIcon, PlusIcon } from "@/components/Icons";

const ITEMS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/calendar", label: "달력", icon: CalendarIcon },
  { href: "/write", label: "기록", icon: PlusIcon, center: true },
  { href: "/memories", label: "추억", icon: BookIcon },
  { href: "/insights", label: "마음", icon: HeartIcon },
];

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="nav" aria-label="주요 메뉴">
      <Link href="/" className="nav-brand">감성 다이어리</Link>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : item.href === "/memories"
              ? pathname.startsWith("/memories") || pathname.startsWith("/entry")
              : pathname.startsWith(item.href);
        if (item.center) {
          return (
            <Link key={item.href} href="/write" className="nav-item" aria-label="일기 쓰기" aria-current={active ? "page" : undefined}>
              <span className="nav-write">
                <Icon size={24} />
              </span>
              <span className="nav-label">기록</span>
            </Link>
          );
        }
        return (
          <Link key={item.href} href={item.href} className={`nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
