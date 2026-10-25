"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ErrorState, PageSkeleton } from "@/components/States";
import { ApiError, api } from "@/lib/api";
import type { SessionUser } from "@/lib/session";

const AuthContext = createContext<SessionUser | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const open = pathname === "/login" || pathname === "/privacy";
  const [user, setUser] = useState<SessionUser | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">(open ? "ready" : "loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) return;
    let ignore = false;
    api<{ user: SessionUser }>("/api/auth")
      .then((data) => {
        if (ignore) return;
        setUser(data.user);
        setPhase("ready");
      })
      .catch((reason: unknown) => {
        if (ignore) return;
        if (reason instanceof ApiError && reason.status === 401) {
          router.replace("/login");
          return;
        }
        setMessage(reason instanceof ApiError ? reason.message : "일기장을 열지 못했어요.");
        setPhase("error");
      });
    return () => {
      ignore = true;
    };
  }, [open, pathname, router]);

  if (open) return children;
  if (phase === "loading") return <PageSkeleton />;
  if (phase === "error" || !user) {
    return (
      <div className="page">
        <ErrorState message={message || "일기장을 열지 못했어요."} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
