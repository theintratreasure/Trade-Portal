"use client";

import { CheckCircle2, Gem, Sparkles } from "lucide-react";
import type { AccountPlan } from "@/services/accounts.service";

export default function AccountPlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: AccountPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group w-full rounded-2xl text-left transition-all duration-300 focus:outline-none ${
        selected ? "scale-[1.01]" : "hover:-translate-y-0.5"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all min-[360px]:p-4 lg:p-5 ${
          selected
            ? "border-[var(--primary)] bg-[var(--bg-card)] ring-2 ring-[var(--primary)]/20"
            : "border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--primary)]/30"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--primary)]/10 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--bg-glass)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] min-[360px]:text-xs">
              <Gem className="h-3.5 w-3.5 text-[var(--primary)]" />
              Trading Plan
            </div>
            <h2 className="mt-2 truncate text-base font-semibold text-[var(--text-main)] min-[360px]:text-lg">
              {plan.name}
            </h2>
          </div>

          <div
            className={`shrink-0 rounded-full p-1.5 ${
              selected ? "bg-[var(--primary)]/15" : "bg-[var(--bg-glass)]"
            }`}
          >
            {selected ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
            ) : (
              <Sparkles className="h-4 w-4 text-[var(--text-muted)]" />
            )}
          </div>
        </div>

        <p className="relative mt-2 text-[11px] leading-relaxed text-[var(--text-muted)] min-[360px]:text-xs lg:text-sm">
          {plan.guidance}
        </p>

        <div className="relative mt-3 grid grid-cols-2 gap-2 min-[360px]:gap-2.5 lg:mt-4 lg:grid-cols-5">
          <Meta label="Min deposit" value={`${plan.minDeposit} USD`} />
          <Meta label="Spread" value={`From ${plan.spreadPips} pips`} />
          <Meta label="Referral" value={`$ ${plan.referral_reward_amount}`} />
          <Meta label="Leverage" value={`1:${plan.max_leverage}`} />
          <Meta
            label="Commission"
            value={
              plan.commission_per_lot > 0
                ? `${plan.commission_per_lot} USD / lot`
                : "No commission"
            }
          />
        </div>
      </div>
    </button>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-2.5 min-[360px]:p-3 lg:bg-transparent lg:p-0 lg:text-right">
      <div className="text-[10px] text-[var(--text-muted)] min-[360px]:text-[11px]">
        {label}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-[var(--text-main)] min-[360px]:text-sm">
        {value}
      </div>
    </div>
  );
}
