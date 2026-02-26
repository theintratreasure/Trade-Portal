"use client";

import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";

type SuccessModalProps = {
  title: string;
  message: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

export default function SuccessModal({
  title,
  message,
  onClose,
  actionLabel = "Done",
  onAction,
}: SuccessModalProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] animate-kycPop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.16)_40%,transparent_70%)]" />
        <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-36 w-36 rounded-full bg-[var(--primary)]/20 blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-500/12 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text-main)]">{title}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>
        </div>

        <div className="relative mt-6 flex justify-center">
          <button
            onClick={onAction || onClose}
            className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-invert)] shadow-lg transition hover:bg-[var(--primary-hover)]"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
