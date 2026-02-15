"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Toast } from "@/app/components/ui/Toast";

export default function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setToast({ message: `${label} copied`, type: "success" });

      setTimeout(() => {
        setCopied(false);
        setToast(null);
      }, 1200);
    } catch (err) {
      // optional: handle error
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] p-3">
        <div className="pr-3">
          <div className="text-xs text-[var(--text-muted)]">
            {label}
          </div>
          <div className="font-medium break-all">
            {value}
          </div>
        </div>

        <button
          onClick={copy}
          className={`
            flex h-9 w-9 items-center justify-center rounded-md
            transition
            ${
              copied
                ? "bg-[var(--success)] text-[var(--text-invert)]"
                : "bg-[var(--bg-glass)]"
            }
          `}
        >
          {copied ? <Check size={16} /> : <Copy size={14} />}
        </button>
      </div>

      {/* TOAST */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
