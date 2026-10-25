"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page">
      <div className="error-box" role="alert">
        <h1 className="serif" style={{ fontSize: "1.6rem" }}>화면을 열지 못했어요</h1>
        <p>잠시 뒤 다시 시도해 주세요. 저장된 일기는 지워지지 않아요.</p>
        <button className="btn btn-primary" type="button" onClick={reset}>다시 시도</button>
      </div>
    </div>
  );
}
