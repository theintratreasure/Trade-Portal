"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CandlestickChart,
  Layers,
  Wallet,
} from "lucide-react";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import TipBanner from "@/app/components/ui/TipBanner";
import { useMyAccounts } from "@/hooks/useMyAccounts";

type AccountFilter = "all" | "live" | "demo";

type TradingAccount = {
  _id: string;
  account_type?: string;
  balance?: number;
  account_number?: string;
  plan_name?: string;
  status?: string;
};

function usd(value: number): string {
  return `$ ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function compact(value: number): string {
  return `$ ${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export default function AssetsPage() {
  const router = useRouter();
  const { data, isLoading } = useMyAccounts();
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");

  const accounts = useMemo(
    () => (Array.isArray(data) ? (data as TradingAccount[]) : []),
    [data]
  );

  const liveAccounts = useMemo(
    () => accounts.filter((acc) => acc.account_type === "live"),
    [accounts]
  );
  const demoAccounts = useMemo(
    () => accounts.filter((acc) => acc.account_type === "demo"),
    [accounts]
  );

  const liveBalance = useMemo(
    () =>
      liveAccounts.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0),
    [liveAccounts]
  );
  const demoBalance = useMemo(
    () =>
      demoAccounts.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0),
    [demoAccounts]
  );
  const totalBalance = liveBalance + demoBalance;

  const visibleAccounts = useMemo(() => {
    if (accountFilter === "all") return accounts;
    return accounts.filter((acc) => acc.account_type === accountFilter);
  }, [accountFilter, accounts]);

  if (isLoading) {
    return (
      <div className="p-6">
        <GlobalLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-3 md:p-6 space-y-4 md:space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 md:p-6 animate-fadeUp">
        <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[var(--primary-glow)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[var(--primary-glow)] blur-3xl" />

        <div className="relative z-10 flex flex-col gap-3 md:gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-wide">
                Assets Command Center
              </h1>
              <p className="mt-1 text-[11px] md:text-sm text-[var(--text-muted)]">
                Capital overview, account routing, and fast trade access
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/dashboard/payments/deposit")}
                className="h-8 md:h-9 px-3 md:px-4 rounded-lg text-[11px] md:text-sm font-semibold bg-[var(--primary)] text-[var(--text-invert)]"
              >
                Deposit
              </button>
              <button
                onClick={() => router.push("/dashboard/payments/withdraw")}
                className="h-8 md:h-9 px-3 md:px-4 rounded-lg text-[11px] md:text-sm font-semibold border border-[var(--border-soft)] bg-[var(--bg-glass)]"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatTile
              icon={<Wallet size={15} />}
              label="Total Assets"
              value={usd(totalBalance)}
            />
            <StatTile
              icon={<BadgeDollarSign size={15} />}
              label="Live Balance"
              value={usd(liveBalance)}
            />
            <StatTile
              icon={<Layers size={15} />}
              label="Demo Balance"
              value={usd(demoBalance)}
            />
            <StatTile
              icon={<Building2 size={15} />}
              label="Accounts"
              value={`${accounts.length} total`}
              meta={`${liveAccounts.length} live • ${demoAccounts.length} demo`}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 md:p-4 animate-cardsEnter">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-soft)]">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {(["all", "live", "demo"] as AccountFilter[]).map((item) => {
              const selected = item === accountFilter;
              const label = item === "all" ? "All" : item === "live" ? "Live" : "Demo";
              return (
                <button
                  key={item}
                  onClick={() => setAccountFilter(item)}
                  className={`h-8 px-3 rounded-full text-xs font-semibold border transition whitespace-nowrap ${
                    selected
                      ? "bg-[var(--primary)] text-[var(--text-invert)] border-[var(--primary)]"
                      : "bg-[var(--bg-glass)] border-[var(--border-soft)] text-[var(--text-main)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {visibleAccounts.length} account(s)
          </span>
        </div>

        <div className="pt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visibleAccounts.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] px-4 py-5 text-xs md:text-sm text-[var(--text-muted)]">
              No accounts found for this filter.
            </div>
          ) : (
            visibleAccounts.map((acc) => {
              const isLive = acc.account_type === "live";
              const status = String(acc.status || "ACTIVE").toUpperCase();
              const accountNo = String(acc.account_number || "-");
              const balance = Number(acc.balance ?? 0);
              return (
                <article
                  key={acc._id}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 md:p-4 transition hover:bg-[var(--bg-glass)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm md:text-[15px] font-semibold truncate">
                        {acc.plan_name || "Trading Account"}
                      </p>
                      <p className="text-[11px] md:text-xs text-[var(--text-muted)] mt-0.5 break-all">
                        {accountNo}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        Balance
                      </p>
                      <p className="text-base md:text-lg font-semibold mt-0.5">
                        {usd(balance)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                        isLive
                          ? "bg-[var(--primary)] text-[var(--text-invert)]"
                          : "bg-[var(--bg-glass)] text-[var(--text-muted)] border border-[var(--border-soft)]"
                      }`}
                    >
                      {isLive ? "LIVE" : "DEMO"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                        status === "ACTIVE"
                          ? "text-[var(--success)] bg-[var(--success)]/10"
                          : "text-[var(--warning)] bg-[var(--warning)]/10"
                      }`}
                    >
                      {status}
                    </span>
                    <span className="ml-auto text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
                      <CandlestickChart size={12} />
                      {compact(balance)}
                    </span>
                  </div>

                  <button
                    onClick={() => router.push("/trade")}
                    className="mt-3 w-full h-9 rounded-lg text-xs font-semibold bg-[var(--primary)] text-[var(--text-invert)] inline-flex items-center justify-center gap-1"
                  >
                    Trade <ArrowUpRight size={13} />
                  </button>
                </article>
              );
            })
          )}
        </div>
      </section>

      <div className="space-y-3 pb-5 animate-fadeUp">
        <TipBanner
          title="Execution Note"
          message="Use live accounts for real market execution and demo accounts for strategy tests."
        />
        <TipBanner
          title="Capital Control"
          message="Keep enough free balance for margin and maintain risk limits per account."
        />
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] px-2.5 py-2 md:px-3 md:py-2.5">
      <div className="flex items-center justify-between text-[9px] md:text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <p className="mt-1 text-xs md:text-base font-semibold break-all leading-tight">{value}</p>
      {meta ? (
        <p className="mt-1 text-[9px] md:text-xs text-[var(--text-muted)]">
          {meta}
        </p>
      ) : null}
    </div>
  );
}
