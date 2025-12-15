"use client";

import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PremiumInputProps = {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  icon?: LucideIcon;
};

export function PremiumInput({
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
}: PremiumInputProps) {
  const filled = value.length > 0;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-4 text-[var(--text-muted)]"
        />
      )}

      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          peer w-full rounded-lg border border-[var(--border-glass)]
          bg-[var(--bg-card)] px-3 ${Icon ? "pl-9" : "pl-3"}
          ${isPassword ? "pr-9" : ""}
          pt-5 pb-2 text-sm outline-none transition
          focus:border-[var(--primary)]
          focus:ring-1 focus:ring-[var(--primary)]
        `}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-4 text-[var(--text-muted)] hover:text-[var(--primary)]"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}

      <label
        className={`
          absolute ${Icon ? "left-9 " : "left-3"}
          bg-[var(--bg-card)] px-1 text-[var(--text-muted)]
          transition-all pointer-events-none
          ${filled ? "-top-2 text-xs" : "top-3 text-sm"}
          peer-focus:-top-2 peer-focus:text-xs
          peer-focus:text-[var(--primary)]
        `}
      >
        {label}
      </label>
    </div>
  );
}
