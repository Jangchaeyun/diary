"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal-backdrop" type="button" aria-label="닫기" onClick={onClose} />
      <div className="modal-card">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
