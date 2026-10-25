import type { ReactNode } from "react";

export function PageSkeleton() {
  return (
    <div className="page skeleton" aria-hidden>
      <div className="skeleton-line" style={{ width: "30%" }} />
      <div className="skeleton-line" style={{ width: "55%", height: 32 }} />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <h2 className="serif" style={{ fontSize: "1.35rem" }}>{title}</h2>
      <p className="muted">{body}</p>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <p style={{ margin: 0 }}>{message}</p>
      {onRetry ? (
        <button className="btn btn-soft" style={{ marginTop: 10 }} onClick={onRetry} type="button">
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

export function Meter({
  label,
  value,
  color,
  caption,
}: {
  label: ReactNode;
  value: number;
  color: string;
  caption?: string;
}) {
  const width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
  return (
    <div className="bar-row">
      <div className="bar-meta">
        <span>{label}</span>
        <span className="faint">{caption}</span>
      </div>
      <div className="bar-track" aria-hidden>
        <div className="bar-fill" style={{ width, background: color }} />
      </div>
    </div>
  );
}
