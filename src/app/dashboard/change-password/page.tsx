"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useChangePassword } from "@/hooks/useAuth";
import TipBanner from "@/app/components/ui/TipBanner";
import ConfirmModal from "@/app/components/ui/ConfirmModal";

type FormState = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const row = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      row.response?.data?.message ||
      row.message ||
      "Failed to change password."
    );
  }
  return "Failed to change password.";
}

export default function ChangePasswordPage() {
  const changePassword = useChangePassword();
  const [form, setForm] = useState<FormState>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    old: false,
    next: false,
    confirm: false,
  });
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.oldPassword.trim().length > 0 &&
      form.newPassword.trim().length >= 6 &&
      form.confirmPassword.trim().length >= 6
    );
  }, [form.confirmPassword, form.newPassword, form.oldPassword]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    if (!canSubmit) {
      setToast({ type: "err", text: "Please fill all fields correctly." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setToast({ type: "err", text: "New password and confirm password do not match." });
      return;
    }
    if (form.oldPassword === form.newPassword) {
      setToast({ type: "err", text: "New password must be different from old password." });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = () => {
    changePassword.mutate(
      {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setToast({ type: "ok", text: "Password changed successfully." });
          setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (error: unknown) => {
          setConfirmOpen(false);
          setToast({ type: "err", text: getErrorMessage(error) });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-3 sm:p-4 md:p-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 sm:p-5 md:p-6 animate-fadeUp">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-soft)] flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">Change Password</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Update your account password securely
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <PasswordField
              label="Old Password"
              value={form.oldPassword}
              onChange={(v) => update("oldPassword", v)}
              visible={show.old}
              onToggle={() => setShow((p) => ({ ...p, old: !p.old }))}
            />
            <PasswordField
              label="New Password"
              value={form.newPassword}
              onChange={(v) => update("newPassword", v)}
              visible={show.next}
              onToggle={() => setShow((p) => ({ ...p, next: !p.next }))}
            />
            <PasswordField
              label="Confirm New Password"
              value={form.confirmPassword}
              onChange={(v) => update("confirmPassword", v)}
              visible={show.confirm}
              onToggle={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
            />
          </div>

          <button
            onClick={submit}
            disabled={changePassword.isPending}
            className="mt-5 h-10 w-full rounded-xl bg-[var(--primary)] text-[var(--text-invert)] text-sm font-semibold disabled:opacity-60"
          >
            {changePassword.isPending ? "Updating..." : "Change Password"}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <TipBanner
            title="Security Tip"
            message="Use a unique password with letters, numbers, and symbols. Avoid reusing old passwords."
          />
          <TipBanner
            title="Important"
            message="After password update, log in again on all devices to keep your session secure."
          />
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 max-w-[92vw] rounded-lg px-3 py-2 text-sm shadow-lg z-50 ${
            toast.type === "ok"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {confirmOpen && (
        <ConfirmModal
          title="Confirm Password Change"
          description="Are you sure you want to update your account password?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmSubmit}
          loading={changePassword.isPending}
        />
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs sm:text-sm text-[var(--text-muted)]">{label}</span>
      <div className="h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 flex items-center gap-2">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none text-sm min-w-0"
          placeholder={label}
        />
        <button
          type="button"
          onClick={onToggle}
          className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center hover:bg-[var(--bg-card)]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </label>
  );
}
