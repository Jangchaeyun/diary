"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AI_DISCLAIMER } from "@/lib/copy";
import { formatClock, formatKoreanDate } from "@/lib/dates";
import type { AiSource } from "@/lib/types";

export function AiSection({
  title,
  description,
  configured,
  loading,
  error,
  info,
  notice,
  result,
  onRun,
  children,
}: {
  title: string;
  description: string;
  configured: boolean | null;
  loading: boolean;
  error: string | null;
  info?: string | null;
  notice?: string | null;
  result: { source: AiSource; createdAt: string; stale: boolean } | null;
  onRun: (mode: "live" | "test", force?: boolean) => void;
  children?: ReactNode;
}) {
  const when = result ? `${formatKoreanDate(result.createdAt.slice(0, 10)).short} ${formatClock(result.createdAt)}` : "";
  return (
    <section className="ai">
      <div className="spread">
        <h3>{title}</h3>
        {result ? (
          <span className={`badge ${result.source === "test" ? "badge-test" : "badge-live"}`}>
            {result.source === "test" ? "테스트 예시" : "저장된 분석"}
          </span>
        ) : null}
      </div>
      <p className="faint" style={{ marginTop: 6 }}>{description}</p>
      {configured === false ? (
        <p className="ai-note" style={{ marginTop: 10 }}>
          API가 연결되지 않았어요. 실제 분석처럼 예시를 채우지는 않아요.{" "}
          <Link href="/privacy">연결 방법</Link>
        </p>
      ) : null}
      {info ? <p className="banner" style={{ marginTop: 10 }}>{info}</p> : null}
      {notice ? <p className="faint" style={{ marginTop: 8 }}>{notice}</p> : null}
      {result?.stale ? <p className="banner" style={{ marginTop: 10 }}>일기를 고친 뒤라 이전 분석과 내용이 달라요. 다시 만들 수 있어요.</p> : null}
      {loading ? <p className="banner" style={{ marginTop: 10 }} aria-live="polite">적힌 문장을 천천히 읽고 있어요.</p> : null}
      {error ? (
        <div className="error-box" style={{ marginTop: 10 }} role="alert">
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      ) : null}
      {result ? <div style={{ marginTop: 12 }}>{children}</div> : null}
      {result ? <p className="faint" style={{ marginTop: 10 }}>{AI_DISCLAIMER} {when ? `· ${when}` : ""}</p> : null}
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" type="button" disabled={loading} onClick={() => onRun("live", Boolean(result))}>
          {loading ? "읽고 있어요" : result ? "다시 만들기" : "AI에게 부탁하기"}
        </button>
        {configured === false ? (
          <button className="btn btn-soft" type="button" disabled={loading} onClick={() => onRun("test", true)}>
            테스트 예시 보기
          </button>
        ) : null}
      </div>
    </section>
  );
}
