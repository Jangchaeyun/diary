"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          mode,
          name,
          email,
          password,
        }),
      });
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "로그인하지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <p className="eyebrow">감성 다이어리</p>
      <h1 className="display">{mode === "login" ? "다시 만나요" : "새 일기장"}</h1>
      <p className="lead">계정마다 일기가 따로 보관돼요. 다른 사람의 기록은 열리지 않아요.</p>
      <form className="card stack" style={{ marginTop: 18 }} onSubmit={(event) => void submit(event)}>
        <div className="view-toggle" role="tablist" aria-label="계정 방식">
          <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>로그인</button>
          <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>가입</button>
        </div>
        {mode === "signup" ? (
          <label className="stack">
            <span className="faint">이름</span>
            <input className="input" value={name} maxLength={40} autoComplete="nickname" onChange={(event) => setName(event.target.value)} />
          </label>
        ) : null}
        <label className="stack">
          <span className="faint">이메일</span>
          <input className="input" type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="stack">
          <span className="faint">비밀번호</span>
          <input className="input" type="password" value={password} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {mode === "signup" ? (
          <p className="faint">이 기기에 계정이 생기기 전 남아 있던 기록은 처음 만든 계정으로 옮겨져요.</p>
        ) : null}
        {error ? <div className="error-box" role="alert">{error}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "확인하고 있어요" : mode === "login" ? "들어가기" : "일기장 만들기"}</button>
      </form>
      <p className="faint" style={{ marginTop: 16 }}>
        일기와 AI에 무엇이 전달되는지는 <Link href="/privacy">안내</Link>에서 볼 수 있어요.
      </p>
    </div>
  );
}
