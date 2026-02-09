"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  to?: string;        // custom route if you want forced navigation
  fallback?: string;  // if no history exists
  label?: string;
  className?: string;
};

export default function BackButton({
  to,
  fallback = "/",
  label,
  className = "",
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    // If custom route is provided → always go there
    if (to) {
      router.push(to);
      return;
    }

    // Otherwise behave like real back button
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`
        flex items-center gap-2
        px-3 py-2
        rounded-lg
        border
        transition
        ${className}
      `}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-soft)",
        color: "var(--text-main)",
      }}
    >
      <ArrowLeft size={18} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
