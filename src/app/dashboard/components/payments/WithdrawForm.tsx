"use client";

import { useState, useEffect, useMemo } from "react";
import { useCreateWithdrawal } from "@/hooks/useCreateWithdrawal";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import { useWithdrawMethods } from "@/hooks/useWithdrawMethods";
import Select from "@/app/components/ui/Select";
import { PremiumInput } from "@/app/components/ui/TextInput";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { Toast } from "@/app/components/ui/Toast";
import SuccessModal from "@/app/components/ui/SuccessModal";
import { useSearchParams, useRouter } from "next/navigation";

export default function WithdrawForm() {
  const { data: accounts = [] } = useMyAccounts();
  const {
    data: methodsData,
    isLoading: methodsLoading,
    isError: methodsError,
    error: methodsErr,
    refetch: refetchMethods,
  } = useWithdrawMethods();
  const { mutateAsync, isPending } = useCreateWithdrawal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const liveAccounts = accounts.filter((acc: any) => acc.account_type === "live");
  const enabledMethods = methodsData?.enabledMethods ?? [];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState<any>({
    accountId: "",
    amount: "",
    method: "",
    payout: {},
  });

  const selectedMethod = useMemo(
    () => enabledMethods.find((m) => m.code === form.method) || null,
    [enabledMethods, form.method],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!enabledMethods.length) {
      if (form.method) setForm((prev: any) => ({ ...prev, method: "", payout: {} }));
      return;
    }
    const stillValid = enabledMethods.some((m) => m.code === form.method);
    if (!stillValid) {
      setForm((prev: any) => ({
        ...prev,
        method: enabledMethods[0].code,
        payout: {},
      }));
    }
  }, [enabledMethods, form.method]);

  useEffect(() => {
    if (form.accountId) return;
    const fromQuery = searchParams.get("account") || searchParams.get("accountId");
    if (!fromQuery) return;
    const exists = liveAccounts.some((a: any) => a._id === fromQuery);
    if (exists) {
      setForm((prev: any) => ({ ...prev, accountId: fromQuery }));
    }
  }, [liveAccounts, form.accountId, searchParams]);

  useEffect(() => {
    if (!form.accountId) return;
    const stillLive = liveAccounts.some((a: any) => a._id === form.accountId);
    if (!stillLive) {
      setForm((prev: any) => ({ ...prev, accountId: "" }));
    }
  }, [liveAccounts, form.accountId]);

  const updatePayoutField = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      payout: { ...prev.payout, [key]: value },
    }));
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);

    try {
      await mutateAsync({
        ...form,
        amount: Number(form.amount),
      });

      setShowSuccessModal(true);
      setForm({
        accountId: "",
        amount: "",
        method: enabledMethods[0]?.code || "",
        payout: {},
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      setToast({
        message,
        type: "error",
      });
    }
  };

  const methodsErrorMessage =
    methodsErr instanceof Error
      ? methodsErr.message
      : (methodsErr as any)?.message || "Failed to load withdrawal methods";

  return (
    <div className="card p-3 md:p-6 space-y-4 md:space-y-5 w-full overflow-visible">
      <Select
        label="Select Account"
        value={form.accountId}
        onChange={(v) => setForm({ ...form, accountId: v })}
        options={liveAccounts.map((acc: any) => ({
          label: `${acc.account_number} | $${Number(acc.balance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`,
          value: acc._id,
        }))}
      />

      <PremiumInput
        label="Amount"
        value={form.amount}
        required
        onChange={(v) => {
          const numericValue = v.replace(/[^0-9]/g, "");
          if (Number(numericValue) > 100000) return;
          setForm({ ...form, amount: numericValue });
        }}
      />

      <div className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">Withdrawal Method</p>

        {methodsLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading withdrawal methods…</p>
        ) : methodsError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm space-y-2">
            <p>{methodsErrorMessage}</p>
            <button
              type="button"
              onClick={() => refetchMethods()}
              className="underline text-[var(--primary)]"
            >
              Retry
            </button>
          </div>
        ) : enabledMethods.length === 0 ? (
          <p className="rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] p-3 text-sm text-[var(--text-muted)]">
            No withdrawal methods are enabled yet. Please contact support.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {enabledMethods.map((m) => {
              const active = form.method === m.code;
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setForm({ ...form, method: m.code, payout: {} })}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-glass)]"
                  }`}
                >
                  <span className="block text-sm font-medium text-[var(--text-main)]">
                    {m.label}
                  </span>
                  {m.description ? (
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                      {m.description}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedMethod?.fields?.length ? (
        <div className="space-y-4">
          {selectedMethod.fields.map((field) => (
            <PremiumInput
              key={field.key}
              label={field.required ? field.label : `${field.label} (optional)`}
              required={field.required}
              value={form.payout?.[field.key] || ""}
              onChange={(v) => updatePayoutField(field.key, v)}
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending || !form.method || enabledMethods.length === 0}
        className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--primary-hover)] transition disabled:opacity-60"
      >
        Submit Withdrawal
      </button>

      {confirmOpen && (
        <ConfirmModal
          title="Confirm Withdrawal"
          description="Please confirm that your payout details are correct."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
          loading={isPending}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showSuccessModal && (
        <SuccessModal
          title="Withdrawal Submitted Successfully"
          message="Your withdrawal request has been submitted successfully. Funds will be transferred to your selected payout method once approved."
          actionLabel="Okay"
          onAction={() => router.push("/dashboard/accounts")}
          onClose={() => router.push("/dashboard/accounts")}
        />
      )}
    </div>
  );
}
