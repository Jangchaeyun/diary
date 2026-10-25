"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppearancePicker } from "@/components/Appearance";
import { useAuth } from "@/components/AuthGate";
import { ErrorState, PageSkeleton } from "@/components/States";
import { ApiError, api } from "@/lib/api";

type Account = {
  reminder: { enabled: boolean; hour: number; minute: number };
  storage: { mode: "local" | "s3"; host: string | null };
};

function clock(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function AccountPage() {
  const user = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    api<Account>("/api/account")
      .then((data) => {
        if (!ignore) setAccount(data);
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof ApiError ? reason.message : "계정 정보를 불러오지 못했어요.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function saveReminder(next: Account["reminder"]) {
    setBusy(true);
    setNote("");
    setError("");
    try {
      const data = await api<{ reminder: Account["reminder"] }>("/api/account", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      setAccount((current) => (current ? { ...current, reminder: data.reminder } : current));
      if (next.enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      setNote(next.enabled ? "이 화면을 열어 둔 동안, 고른 시각에 알림을 띄워요." : "알림을 꺼 두었어요.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "알림을 저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/export", { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new ApiError(data?.message || "내보내기에 실패했어요.", "error", response.status);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "diary.zip";
      link.click();
      URL.revokeObjectURL(url);
      setNote("일기와 사진을 묶어 내려받았어요.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "내보내기에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api("/api/auth", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  if (!user || (!account && !error)) return <PageSkeleton />;
  if (!account) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="page">
      <p className="eyebrow">내 일기장</p>
      <h1 className="display">{user.name}</h1>
      <p className="lead">{user.email}</p>
      <div className="stack" style={{ marginTop: 18 }}>
        {error ? <div className="error-box" role="alert">{error}</div> : null}
        {note ? <p className="banner">{note}</p> : null}
        <section className="card stack">
          <h2>화면 테마</h2>
          <p className="muted">고른 테마는 이 계정에 저장되고, 일기장 화면 전체에 적용돼요. 각 일기의 페이지 색은 글을 쓸 때 따로 고를 수 있어요.</p>
          <AppearancePicker />
        </section>
        <section className="card stack">
          <h2>알림</h2>
          <p className="muted">일기장을 열어 둔 동안, 고른 시각에 오늘의 페이지를 권하는 알림을 띄워요. 앱을 완전히 닫으면 휴대폰 푸시처럼 도착하지는 않아요.</p>
          <label className="spread">
            <span>알림 받기</span>
            <input
              type="checkbox"
              checked={account.reminder.enabled}
              disabled={busy}
              onChange={(event) => void saveReminder({ ...account.reminder, enabled: event.target.checked })}
            />
          </label>
          <label className="stack">
            <span className="faint">시각</span>
            <input
              className="input"
              type="time"
              value={clock(account.reminder.hour, account.reminder.minute)}
              disabled={busy}
              onChange={(event) => {
                const [hour, minute] = event.target.value.split(":").map(Number);
                if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
                void saveReminder({ enabled: account.reminder.enabled, hour, minute });
              }}
            />
          </label>
        </section>
        <section className="card stack">
          <h2>내보내기</h2>
          <p className="muted">내 일기와 첨부 사진을 하나의 압축 파일로 받아요.</p>
          <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void download()}>일기 내려받기</button>
        </section>
        <section className="card stack">
          <h2>사진 저장</h2>
          <p className="muted">
            {account.storage.mode === "s3"
              ? `사진은 설정한 저장소(${account.storage.host})에 올라가요. 키는 서버에만 있어요.`
              : "클라우드 저장소가 연결되지 않아 사진은 이 컴퓨터의 데이터 폴더에 남아요. S3 호환 주소와 키를 환경 변수에 넣으면 그곳으로 저장돼요."}
          </p>
        </section>
        <section className="card stack">
          <h2>휴대폰에 두기</h2>
          <p className="muted">브라우저의 공유 메뉴에서 홈 화면에 추가하면 앱처럼 열 수 있어요. 앱스토어에 올릴 서명된 설치 파일은 개발자 계정 없이는 만들지 않아요.</p>
        </section>
        <Link href="/privacy" className="btn btn-soft">일기와 AI 안내</Link>
        <button className="btn btn-ghost" type="button" onClick={() => void logout()}>로그아웃</button>
      </div>
    </div>
  );
}
