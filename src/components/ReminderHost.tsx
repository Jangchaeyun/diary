"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthGate";
import { api } from "@/lib/api";

const SENT_KEY = "diary-reminder-sent";

export function ReminderHost() {
  const user = useAuth();

  useEffect(() => {
    if (!user) return;
    let timer = 0;
    const tick = async () => {
      try {
        const data = await api<{ reminder: { enabled: boolean; hour: number; minute: number } }>("/api/account");
        if (!data.reminder.enabled) return;
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
        const now = new Date();
        const stamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${data.reminder.hour}-${data.reminder.minute}`;
        const due =
          now.getHours() > data.reminder.hour ||
          (now.getHours() === data.reminder.hour && now.getMinutes() >= data.reminder.minute);
        const late = now.getHours() * 60 + now.getMinutes() <= data.reminder.hour * 60 + data.reminder.minute + 120;
        if (!due || !late || localStorage.getItem(`${SENT_KEY}:${user.id}`) === stamp) return;
        localStorage.setItem(`${SENT_KEY}:${user.id}`, stamp);
        new Notification("감성 다이어리", { body: "오늘의 페이지를 남겨 볼까요?" });
      } catch {
        /* 알림 확인 실패는 일기 작성을 막지 않아요. */
      }
    };
    void tick();
    timer = window.setInterval(() => void tick(), 60_000);
    return () => window.clearInterval(timer);
  }, [user]);

  return null;
}
