"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const isSuccess = type === "success";
  const [visible, setVisible] = useState(true);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true);
    }, 0);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      onCloseRef.current?.();
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [message, type]);

  if (!visible) return null;

  return (
    <div
      className="
        fixed bottom-5 right-5 z-[999]
        animate-slideUp
        rounded-xl
        border
        shadow-2xl
        px-4 py-3
        flex items-center gap-2
        min-w-[240px]
        max-w-[90vw]
        bg-[var(--bg-card)]
      "
      style={{
        borderColor: isSuccess
          ? "var(--success)"
          : "var(--error)",
      }}
    >
      {isSuccess ? (
        <CheckCircle size={18} className="text-[var(--success)]" />
      ) : (
        <XCircle size={18} className="text-[var(--error)]" />
      )}

      <span
        className={`text-sm ${
          isSuccess
            ? "text-[var(--success)]"
            : "text-[var(--error)]"
        }`}
      >
        {message}
      </span>
    </div>
  );
}
