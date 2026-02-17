"use client";

import {
  ShieldCheck,
  Layers,
  Percent,
  DollarSign,
  Activity,
  Calendar,
} from "lucide-react";

type AccountDetailsData = {
  status?: string;
  account_type?: string;
  balance?: number | string;
  equity?: number | string;
  leverage?: number | string;
  spread_pips?: number | string;
  spread_type?: string;
  commission_per_lot?: number | string;
  currency?: string;
  swap_enabled?: boolean;
  createdAt?: string | number | Date;
};

function toSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatCreatedAt(value: string | number | Date | undefined): string {
  if (value == null) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatLeverage(value: unknown): string {
  const leverage = Number(value);
  if (!Number.isFinite(leverage)) return "-";
  if (leverage === 0) return "Unlimited";
  return `1:${leverage}`;
}

export default function AccountDetails({ data }: { data: AccountDetailsData }) {
  const accountStatus = String(data.status ?? "inactive");
  const commissionPerLot = toSafeNumber(data.commission_per_lot);

  return (
    <div className="mt-3 space-y-3 max-[359px]:mt-2.5 max-[359px]:space-y-2.5">
      {/* ================= SUMMARY STRIP ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--bg-glass)] p-3 max-[359px]:gap-2 max-[359px]:p-2.5">
        <div>
          <div className="text-[11px] text-[var(--text-muted)] max-[359px]:text-[10px]">
            Account status
          </div>
          <div
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium max-[359px]:px-2 max-[359px]:py-0.5 max-[359px]:text-[10px] ${
              accountStatus === "active"
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-600"
            }`}
          >
            <ShieldCheck size={12} />
            {accountStatus.toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-[var(--text-muted)] max-[359px]:text-[10px]">
            Account type
          </div>
          <div className="font-medium capitalize text-sm max-[359px]:text-xs">
            {data.account_type}
          </div>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-2 gap-2 text-sm max-[359px]:gap-1.5 md:grid-cols-3">
        <InfoCard
          icon={<DollarSign />}
          label="Balance"
          value={`${data.balance} ${data.currency}`}
        />

        <InfoCard
          icon={<Activity />}
          label="Equity"
          value={`${data.equity} ${data.currency}`}
        />

        <InfoCard
          icon={<Layers />}
          label="Leverage"
          value={formatLeverage(data.leverage)}
        />

        <InfoCard
          icon={<Percent />}
          label="Spread"
          value={`${data.spread_pips} pips (${data.spread_type})`}
        />

        <InfoCard
          icon={<DollarSign />}
          label="Commission / lot"
          value={
            commissionPerLot > 0
              ? `${commissionPerLot} ${data.currency}`
              : "No commission"
          }
        />

        <InfoCard
          icon={<ShieldCheck />}
          label="Swap"
          value={data.swap_enabled ? "Enabled" : "Disabled"}
        />
      </div>

      {/* ================= FOOTER META ================= */}
      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-3 max-[359px]:p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] max-[359px]:text-[10px]">
          <Calendar size={12} />
          Created on
        </div>
        <div className="mt-1 text-xs min-[360px]:text-sm font-medium break-words">
          {formatCreatedAt(data.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ================= REUSABLE CARD ================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-white/60 dark:bg-black/20 p-2 max-[359px]:p-1.5 min-[360px]:p-2.5 sm:p-3 backdrop-blur min-w-0">
      <div className="flex items-start gap-2.5 min-[360px]:gap-3">
        {/* ICON */}
        <div className="flex h-5 w-5 max-[359px]:h-6 max-[359px]:w-6 min-[360px]:h-8 min-[360px]:w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-glass)] text-[var(--primary)]">
          {icon}
        </div>

        {/* TEXT */}
        <div className="flex flex-col min-w-0">
          <div className="text-[8px] min-[360px]:text-[10px] sm:text-[11px] text-[var(--text-muted)] leading-tight break-words">
            {label}
          </div>

          <div className="mt-0.5 text-[10px] min-[360px]:text-xs sm:text-[13px] font-semibold leading-tight break-words">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

