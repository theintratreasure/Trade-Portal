"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  fallback?: string; // optional fallback route
  label?: string;    // optional text
  className?: string;
};

export default function BackButton({
  fallback = "/",
  label,
  className = "",
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.push('/');
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
