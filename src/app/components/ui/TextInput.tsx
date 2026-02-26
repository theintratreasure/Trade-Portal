"use client";

import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { KeyboardEventHandler, Ref, useState } from "react";

type PremiumInputProps = {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  icon?: LucideIcon;
  required?: boolean | undefined;
  inputRef?: Ref<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

export function PremiumInput({
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  required = false,
  inputRef,
  onKeyDown,
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
          className="absolute left-3 top-4  text-[var(--text-muted)]"
        />
      )}

      <input
        ref={inputRef}
        type={inputType}
        value={value}
        required={required}  
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
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
export function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-lg border border-[var(--border-glass)]
          bg-[var(--bg-card)]
          px-3 pt-5 pb-2 text-sm outline-none
          focus:border-[var(--primary)]
          focus:ring-1 focus:ring-[var(--primary)]
        "
      />
      <label
        className="
          absolute left-3 -top-2 bg-[var(--bg-card)]
          px-1 text-xs text-[var(--text-muted)]
        "
      >
        {label}
      </label>
    </div>
  );
}
export function GenderSelect({
  value,
  onChange,
}: {
  value?: "MALE" | "FEMALE";
  onChange: (v: "MALE" | "FEMALE") => void;
}) {
  return (
    <div className="flex gap-2">
      {(["MALE", "FEMALE"] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`
            flex-1 px-4 py-3 rounded-lg border text-sm font-medium
            transition
            ${
              value === g
                ? "bg-[var(--primary)] text-[var(--text-main)] border-[var(--primary)]"
                : "bg-[var(--bg-card)] border-[var(--border-glass)] text-[var(--text-muted)]"
            }
          `}
        >
          {g === "MALE" ? "Male" : "Female"}
        </button>
      ))}
    </div>
  );
}
