"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ComponentType } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  User,
  Activity,
  Mail,
  Phone,
  Lock,
  BarChart3,
  Clock,
} from "lucide-react";

import { useUserMe } from "@/hooks/useUser";
import { useTransactions } from "@/hooks/useTransactions";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import TipBanner from "@/app/components/ui/TipBanner";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useUserMe({ enabled: false });
  const { data: portfolioSummary } = usePortfolioSummary();
  const { data: transactionsData, isLoading: isTransactionsLoading } = useTransactions({
    page: 1,
    limit: 5,
  });

  const overview = portfolioSummary?.overview;
  const snapshot = portfolioSummary?.performanceSnapshot;

  const currency = overview?.currency || "USD";
  const currencySymbol = currency === "USD" ? "$" : `${currency} `;

  const formatMoney = (value?: number) =>
    `${currencySymbol}${Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatSignedMoney = (value?: number) => {
    const n = Number(value ?? 0);
    const sign = n >= 0 ? "+" : "-";
    return `${sign}${currencySymbol}${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const recentTransactions = useMemo(() => {
    const rows = transactionsData?.data ?? [];
    return [...rows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [transactionsData]);

  function getKycStyle(status?: string) {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "bg-emerald-500/10 text-emerald-500";
      case "REJECTED":
        return "bg-red-500/10 text-red-500";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  }

  const completion =
    [user?.name, user?.email, user?.phone, user?.date_of_birth, user?.city].filter(Boolean)
      .length * 20;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 animate-fadeUp">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Welcome back, {user?.name || "Trader"}</h1>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">Here&apos;s your account performance overview</p>
        </div>

        <button
          onClick={() => router.push("/trade")}
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--text-invert)] text-xs md:text-sm font-medium"
        >
          Open Trading Terminal
        </button>
      </div>

      <div className="card rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 animate-cardsEnter">
        <div>
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Total Portfolio Value</p>
          <h2 className="text-2xl md:text-4xl font-bold mt-2 break-all">{formatMoney(overview?.totalPortfolioValue)}</h2>
          <div
            className={`flex items-center gap-2 mt-2 text-xs md:text-sm ${
              Number(overview?.todayChangePercent ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            <TrendingUp size={16} />
            {Number(overview?.todayChangePercent ?? 0) >= 0 ? "+" : ""}
            {Number(overview?.todayChangePercent ?? 0).toFixed(2)}% today
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 pt-1 md:pt-4">
          <Stat icon={Wallet} label="Wallet Balance" value={formatMoney(overview?.walletBalance)} />
          <Stat
            icon={TrendingUp}
            label="Open Profit"
            value={formatSignedMoney(overview?.openProfit)}
            positive={Number(overview?.openProfit ?? 0) >= 0}
          />
          <Stat
            icon={TrendingDown}
            label="Drawdown"
            value={`${Number(overview?.drawdownPercent ?? 0).toFixed(2)}%`}
          />
          <Stat icon={Activity} label="Active Trades" value={String(overview?.activeTrades ?? 0)} />
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3 animate-cardsEnter">
        <div className="card p-4 md:p-6 rounded-2xl space-y-4 md:space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold">Personal Area</h2>
            <User size={18} className="text-[var(--primary)]" />
          </div>

          <Info icon={Mail} label="Email" value={user?.email} />
          <Info icon={Phone} label="Phone" value={user?.phone || "Not added"} />

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Profile Completion</span>
              <span>{completion}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-glass)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)]" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full ${getKycStyle(
              user?.kycStatus
            )}`}
          >
            <ShieldCheck size={14} />
            {user?.kycStatus || "KYC NOT VERIFIED"}
          </span>

          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full rounded-xl bg-[var(--bg-glass)] py-2 text-xs md:text-sm hover:bg-[var(--primary)]/10 transition"
          >
            Manage Profile
          </button>
        </div>

        <div className="card p-4 md:p-6 rounded-2xl space-y-4 md:space-y-5">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={18} />
            Performance Snapshot
          </h2>

          <MiniStat label="Win Rate" value={`${Number(snapshot?.winRate ?? 0).toFixed(2)}%`} />
          <MiniStat label="Avg. Trade Duration" value={snapshot?.avgTradeDuration || "-"} />
          <MiniStat label="Best Trade" value={formatMoney(snapshot?.bestTrade)} positive />
          <MiniStat label="Worst Trade" value={formatSignedMoney(snapshot?.worstTrade)} />
          <MiniStat label="Closed Trades" value={String(snapshot?.totalClosedTrades ?? 0)} />
        </div>

        <div className="card p-4 md:p-6 rounded-2xl space-y-4 md:space-y-5">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Lock size={18} />
            Account Metrics
          </h2>

          <MiniStat label="Total Accounts" value={String(overview?.totalAccounts ?? 0)} />
          <MiniStat label="Active Accounts" value={String(overview?.activeAccounts ?? 0)} />
          <MiniStat label="Total Equity" value={formatMoney(overview?.totalEquity)} />
          <MiniStat label="Hold Balance" value={formatMoney(overview?.totalHoldBalance)} />
        </div>
      </div>

      <div className="card p-4 md:p-6 rounded-2xl space-y-4 animate-fadeUp">
        <h2 className="text-base md:text-lg font-semibold">Market Overview</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
          <Market symbol="EUR/USD" price="1.0823" change="+0.32%" />
          <Market symbol="GBP/USD" price="1.2645" change="-0.12%" down />
          <Market symbol="XAU/USD" price="2034.50" change="+1.25%" />
          <Market symbol="BTC/USD" price="42,180" change="+3.8%" />
        </div>
      </div>

      <div className="card p-4 md:p-6 rounded-2xl space-y-4 animate-fadeUp">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Clock size={18} />
          Recent Transactions
        </h2>
        {isTransactionsLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading transactions...</p>
        ) : recentTransactions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No recent transactions</p>
        ) : (
          recentTransactions.map((tx) => (
            <Transaction
              key={tx._id}
              type={tx.type}
              accountNumber={tx.accountNumber}
              amount={tx.amount}
              balanceAfter={tx.balanceAfter}
              status={tx.status}
              createdAt={tx.createdAt}
              remark={tx.remark}
            />
          ))
        )}
      </div>

      <div className="space-y-3">
        <TipBanner title="Risk Reminder" message="Always use stop-loss and manage risk per trade." />
        <TipBanner title="Security Tip" message="Enable 2FA to increase account safety." />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-glass)] p-3 md:p-4">
      <div className="flex justify-between text-[10px] md:text-xs text-[var(--text-muted)]">
        <span>{label}</span>
        <Icon size={14} />
      </div>
      <p className={`mt-2 text-sm md:text-lg font-semibold break-all ${positive ? "text-emerald-500" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex justify-between items-center text-xs md:text-sm gap-3">
      <div className="flex items-center gap-2 text-[var(--text-muted)] min-w-0">
        <Icon size={14} />
        {label}
      </div>
      <span className="truncate max-w-[140px] text-right font-medium">{value}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs md:text-sm gap-3">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`text-right break-all ${positive ? "text-emerald-500" : ""}`}>{value}</span>
    </div>
  );
}

function Market({
  symbol,
  price,
  change,
  down,
}: {
  symbol: string;
  price: string;
  change: string;
  down?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-glass)] p-3">
      <p className="text-[10px] md:text-xs text-[var(--text-muted)]">{symbol}</p>
      <p className="font-semibold text-xs md:text-sm">{price}</p>
      <p className={`text-[10px] md:text-xs ${down ? "text-red-500" : "text-emerald-500"}`}>{change}</p>
    </div>
  );
}

function Transaction({
  type,
  accountNumber,
  amount,
  balanceAfter,
  status,
  createdAt,
  remark,
}: {
  type: string;
  accountNumber: string;
  amount: number;
  balanceAfter: number;
  status: string;
  createdAt: string;
  remark: string;
}) {
  const isPositive =
    String(type).toUpperCase().includes("DEPOSIT") ||
    String(type).toUpperCase().includes("PROFIT") ||
    String(type).toUpperCase().includes("IN");

  const formattedAmount = `${isPositive ? "+" : "-"}$${Math.abs(Number(amount) || 0).toFixed(2)}`;
  const normalizedStatus = String(status || "").toUpperCase();
  const statusClass =
    normalizedStatus === "SUCCESS"
      ? "text-[var(--success)] bg-[var(--success)]/10"
      : normalizedStatus === "FAILED"
      ? "text-[var(--error)] bg-[var(--error)]/10"
      : "text-[var(--warning)] bg-[var(--warning)]/10";

  return (
    <div className="border-b border-[var(--border-soft)] pb-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3 text-xs md:text-sm">
        <span className="font-medium">{type}</span>
        <span className={isPositive ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>
          {formattedAmount}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-[var(--text-muted)]">
        <span>{new Date(createdAt).toLocaleString()}</span>
        <span>•</span>
        <span>A/C: {accountNumber || "-"}</span>
        <span>•</span>
        <span>Bal: ${Number(balanceAfter || 0).toFixed(2)}</span>
      </div>
      {remark ? <div className="mt-1 text-[10px] md:text-xs text-[var(--text-muted)]">{remark}</div> : null}
      <div className="mt-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
          {normalizedStatus || "PENDING"}
        </span>
      </div>
    </div>
  );
}

