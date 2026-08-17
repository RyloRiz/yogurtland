"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
          <path
            d="M4 7h16M9 7V4.6c0-.88.72-1.6 1.6-1.6h2.8c.88 0 1.6.72 1.6 1.6V7M6 7l.9 12.1A2 2 0 008.9 21h6.2a2 2 0 002-1.9L18 7M10.5 11v6M13.5 11v6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 id="confirm-dialog-title" className="mt-5 text-2xl font-light text-ink">
        {title}
      </h2>
      {description && <p className="mt-2 max-w-xs text-center text-[15px] text-ink-muted">{description}</p>}

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-full bg-error px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:opacity-90 active:scale-[0.98]"
        >
          {confirmLabel}
        </button>
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full border-2 border-line px-6 py-3.5 text-[15px] font-semibold text-ink outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-[color:var(--accent-ring)] focus:ring-offset-2 focus:ring-offset-bg"
        >
          {cancelLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
