"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppearanceProvider } from "@/components/Appearance";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { ReminderHost } from "@/components/ReminderHost";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const writing = pathname.startsWith("/write") || pathname === "/login";
  return (
    <AppearanceProvider>
    <div className="shell">
      <div className="page-wrap">
        <AuthGate>
          <ReminderHost />
          {children}
        </AuthGate>
      </div>
      {writing ? null : <BottomNav pathname={pathname} />}
    </div>
    </AppearanceProvider>
  );
}
