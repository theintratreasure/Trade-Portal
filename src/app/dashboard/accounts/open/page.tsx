"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Wallet2 } from "lucide-react";
import { Toast } from "@/app/components/ui/Toast";
import { useActiveAccountPlans } from "@/hooks/useActiveAccountPlans";
import { useCreateAccount } from "@/hooks/useCreateAccount";
import type { AccountPlan } from "@/services/accounts.service";
import AccountPlanCard from "../../components/account/AccountPlanCard";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import GlobalLoader from "@/app/components/ui/GlobalLoader";

type CreatedAccount = {
  account_number: string;
  account_type: string;
  plan_name: string;
  currency: string;
  leverage: number;
  trade_password: string;
  watch_password: string;
};

function formatLeverage(value: unknown): string {
  const leverage = Number(value);
  if (!Number.isFinite(leverage)) return "-";
  if (leverage === 0) return "Unlimited";
  return `1:${leverage}`;
}

export default function OpenAccountPage() {
  const router = useRouter();
  const { data, isLoading } = useActiveAccountPlans();
  const createAccount = useCreateAccount();
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<AccountPlan | null>(null);
  const [accountType, setAccountType] = useState<"live" | "demo">("live");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [demoBalanceOpen, setDemoBalanceOpen] = useState(false);
  const [demoOpeningBalance, setDemoOpeningBalance] = useState<string>("25000");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleContinue = () => {
    if (!selectedPlan) return;
    if (accountType === "demo") {
      const amount = Number(demoOpeningBalance);
      if (!Number.isFinite(amount) || amount <= 0) {
        setErrorMsg("Please enter a valid demo opening balance.");
        return;
      }
      setDemoBalanceOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    try {
      const payload: {
        account_plan_id: string;
        account_type: "live" | "demo";
        opening_balance?: number;
      } = {
        account_plan_id: selectedPlan._id,
        account_type: accountType,
      };

      if (accountType === "demo") {
        payload.opening_balance = Number(demoOpeningBalance);
      }

      const res = await createAccount.mutateAsync({
        ...payload,
      });

      setConfirmOpen(false);
      setDemoBalanceOpen(false);
      setCreatedAccount(res.data);
      setToast({
        message:
          "Account created successfully. The account credentials have been sent to your registered email.",
        type: "success",
      });
    } catch (err: unknown) {
      setConfirmOpen(false);
      setDemoBalanceOpen(false);
      const row = err as { response?: { data?: { message?: string } }; message?: string };
      const apiMessage = row?.response?.data?.message || row?.message || "Something went wrong. Please try again.";
      setErrorMsg(apiMessage);
    }
  };

  const filteredPlans = useMemo(() => {
    const plans = data ?? [];
    if (accountType === "demo") {
      return plans.filter((plan) => plan.is_demo_allowed);
    }
    return plans.filter((plan) => !plan.is_demo_allowed);
  }, [accountType, data]);

  useEffect(() => {
    if (accountType !== "demo") return;
    if (filteredPlans.length !== 1) return;
    if (selectedPlan?._id === filteredPlans[0]?._id) return;
    const timer = window.setTimeout(() => {
      setSelectedPlan(filteredPlans[0]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accountType, filteredPlans, selectedPlan]);
  const currentStep = !selectedPlan ? 2 : 3;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-28 md:pb-24">
      <div className="mx-auto w-full max-w-5xl px-2.5 pt-3 min-[360px]:px-3 min-[360px]:pt-4 md:px-6 md:pt-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-main)]"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3.5 min-[360px]:p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Wallet2 size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-[var(--text-main)] min-[360px]:text-xl md:text-2xl">
                Open Account
              </h1>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)] min-[360px]:text-xs md:text-sm">
                Select account type, choose your plan, and continue to create a new trading account.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] min-[360px]:text-xs">
            Account Creation Steps
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
            <StepItem
              index={1}
              title="Choose Type"
              description="Live or demo"
              active={true}
              done={true}
            />
            <StepItem
              index={2}
              title="Select Plan"
              description="Pick one account plan"
              active={currentStep === 2}
              done={!!selectedPlan}
            />
            <StepItem
              index={3}
              title="Create Account"
              description="Review and confirm"
              active={currentStep === 3}
              done={false}
            />
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-1.5">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] min-[360px]:text-xs">
            Step 1: Choose Account Type
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(["live", "demo"] as const).map((t) => {
              const active = accountType === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setAccountType(t);
                    setSelectedPlan(null);
                  }}
                  className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition min-[360px]:text-sm ${
                    active
                      ? "bg-[var(--primary)] text-[var(--text-invert)] shadow"
                      : "bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {t === "live" ? "Live Account" : "Demo Account"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] min-[360px]:text-xs">
            Step 2: Select Your Plan
          </p>
          {isLoading ? (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6">
              <GlobalLoader />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-card)] p-4 text-center text-xs text-[var(--text-muted)] min-[360px]:text-sm">
              No plans available for {accountType} account.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {filteredPlans.map((plan) => (
                <AccountPlanCard
                  key={plan._id}
                  plan={plan}
                  selected={selectedPlan?._id === plan._id}
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] min-[360px]:text-xs">
            Step 3: Review Before Continue
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
            <MiniField label="Account Type" value={accountType === "live" ? "Live" : "Demo"} />
            <MiniField label="Selected Plan" value={selectedPlan?.name || "Not selected"} />
            <MiniField
              label="Min Deposit"
              value={selectedPlan ? `${selectedPlan.minDeposit} USD` : "--"}
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)] min-[360px]:text-xs">
            Continue dabane ke baad confirmation modal open hoga, uske baad account create hoga.
          </p>
        </div>

      </div>

      <div className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 md:hidden">
        <button
          disabled={!selectedPlan}
          onClick={handleContinue}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
            selectedPlan
              ? "bg-[var(--primary)] text-[var(--text-invert)] shadow-lg"
              : "bg-[var(--bg-glass)] text-[var(--text-muted)]"
          }`}
        >
          Continue
        </button>
      </div>

      <div className="fixed bottom-5 right-5 z-30 hidden md:block">
        <button
          disabled={!selectedPlan}
          onClick={handleContinue}
          className={`min-w-52 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition ${
            selectedPlan
              ? "bg-[var(--primary)] text-[var(--text-invert)] hover:brightness-110"
              : "bg-[var(--bg-glass)] text-[var(--text-muted)]"
          }`}
        >
          Continue
        </button>
      </div>

      {createdAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2.5 min-[360px]:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-glass)] px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-[var(--success)]" />
              <h2 className="text-sm font-semibold min-[360px]:text-base">Account Created Successfully</h2>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
              <InfoField label="Account Number" value={createdAccount.account_number} />
              <InfoField label="Account Type" value={createdAccount.account_type} />
              <InfoField label="Plan Name" value={createdAccount.plan_name} />
              <InfoField label="Currency" value={createdAccount.currency} />
              <InfoField label="Leverage" value={formatLeverage(createdAccount.leverage)} />
              <InfoField label="Trade Password" value={createdAccount.trade_password} />
              <InfoField label="Watch Password" value={createdAccount.watch_password} />

              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-500 min-[360px]:text-xs">
                Please save these credentials. They will not be shown again.
              </p>
            </div>

            <div className="border-t border-[var(--border-soft)] p-4">
              <button
                onClick={() => {
                  setCreatedAccount(null);
                  router.push("/dashboard/accounts");
                }}
                className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-semibold text-[var(--text-invert)]"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && selectedPlan && (
        <ConfirmModal
          title="Create trading account?"
          description={`You are about to create a ${accountType} ${selectedPlan.name} account.`}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmCreate}
          loading={createAccount.isPending}
        />
      )}

      {demoBalanceOpen && selectedPlan && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-[var(--bg-card)] p-5 shadow-xl">
            <h2 className="text-lg font-semibold">Demo Opening Balance</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Enter the opening balance for your demo account.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min={1}
                step="1"
                inputMode="numeric"
                value={demoOpeningBalance}
                onChange={(e) => setDemoOpeningBalance(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                placeholder="Enter demo amount"
              />
              <span className="text-xs text-[var(--text-muted)]">USD</span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDemoBalanceOpen(false)}
                className="rounded-md px-4 py-2 text-sm bg-[var(--bg-glass)]"
              >
                Cancel
              </button>
              <button
                disabled={createAccount.isPending}
                onClick={() => {
                  const amount = Number(demoOpeningBalance);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    setErrorMsg("Please enter a valid demo opening balance.");
                    return;
                  }
                  void handleConfirmCreate();
                }}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--text-main)]"
              >
                {createAccount.isPending ? "Creating..." : "Confirm & Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />}
      {toast && <Toast message={toast.message} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 break-all text-xs font-semibold text-[var(--text-main)] min-[360px]:text-sm">
        {value}
      </p>
    </div>
  );
}

function StepItem({
  index,
  title,
  description,
  active,
  done,
}: {
  index: number;
  title: string;
  description: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-2.5 py-2 ${
        active
          ? "border-[var(--primary)] bg-[var(--primary)]/10"
          : "border-[var(--border-soft)] bg-[var(--bg-glass)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
            done
              ? "bg-[var(--success)]/20 text-[var(--success)]"
              : active
                ? "bg-[var(--primary)] text-[var(--text-invert)]"
                : "bg-[var(--bg-main)] text-[var(--text-muted)]"
          }`}
        >
          {index}
        </span>
        <p className="text-[11px] font-semibold text-[var(--text-main)] min-[360px]:text-xs">{title}</p>
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-muted)] min-[360px]:text-[11px]">{description}</p>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] p-2">
      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)] min-[360px]:text-[10px]">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold text-[var(--text-main)] min-[360px]:text-xs">
        {value}
      </p>
    </div>
  );
}
