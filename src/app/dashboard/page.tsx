"use client";

import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  User,
  Activity,
  ArrowUpRight,
  Mail,
  Phone,
  Lock,
  BarChart3,
  DollarSign,
  Clock,
} from "lucide-react";

import { useUserMe } from "@/hooks/useUser";
import TipBanner from "@/app/components/ui/TipBanner";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useUserMe({ enabled: false });

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
    [
      user?.name,
      user?.email,
      user?.phone,
      user?.date_of_birth,
      user?.city,
    ].filter(Boolean).length * 20;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 md:p-6 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome back, {user?.name || "Trader"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Here’s your account performance overview
          </p>
        </div>

        <button
          onClick={() => router.push("/trade")}
          className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--text-invert)] text-sm font-medium"
        >
          Open Trading Terminal
        </button>
      </div>

      {/* ================= PORTFOLIO SUMMARY ================= */}
      <div className="card rounded-2xl p-6 space-y-6">

        <div>
          <p className="text-sm text-[var(--text-muted)]">
            Total Portfolio Value
          </p>
          <h2 className="text-4xl font-bold mt-2">$ 24,580.00</h2>
          <div className="flex items-center gap-2 mt-2 text-emerald-500 text-sm">
            <TrendingUp size={16} />
            +2.45% today
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <Stat icon={Wallet} label="Wallet Balance" value="$ 18,200" />
          <Stat icon={TrendingUp} label="Open Profit" value="+$ 1,240" positive />
          <Stat icon={TrendingDown} label="Drawdown" value="-2.1%" />
          <Stat icon={Activity} label="Active Trades" value="6" />
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* PERSONAL AREA */}
        <div className="card p-6 rounded-2xl space-y-5">

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Personal Area</h2>
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
              <div
                className="h-full bg-[var(--primary)]"
                style={{ width: `${completion}%` }}
              />
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
            className="w-full rounded-xl bg-[var(--bg-glass)] py-2 text-sm hover:bg-[var(--primary)]/10 transition"
          >
            Manage Profile
          </button>
        </div>

        {/* PERFORMANCE SNAPSHOT */}
        <div className="card p-6 rounded-2xl space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={18} />
            Performance Snapshot
          </h2>

          <MiniStat label="Win Rate" value="68%" />
          <MiniStat label="Avg. Trade Duration" value="3h 24m" />
          <MiniStat label="Best Trade" value="+$540" positive />
          <MiniStat label="Worst Trade" value="- $180" />
        </div>

        {/* SECURITY PANEL */}
        <div className="card p-6 rounded-2xl space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lock size={18} />
            Security Center
          </h2>

          <MiniStat label="Password" value="Strong" positive />
          <MiniStat label="2FA Authentication" value="Disabled" />
          <MiniStat label="Last Login" value="Today, 09:32 AM" />
        </div>
      </div>

      {/* ================= MARKET OVERVIEW ================= */}
      <div className="card p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-semibold">Market Overview</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Market symbol="EUR/USD" price="1.0823" change="+0.32%" />
          <Market symbol="GBP/USD" price="1.2645" change="-0.12%" down />
          <Market symbol="XAU/USD" price="2034.50" change="+1.25%" />
          <Market symbol="BTC/USD" price="42,180" change="+3.8%" />
        </div>
      </div>

      {/* ================= RECENT TRANSACTIONS ================= */}
      <div className="card p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={18} />
          Recent Transactions
        </h2>

        <Transaction type="Deposit" amount="+$500" status="Completed" />
        <Transaction type="Withdrawal" amount="- $200" status="Pending" />
        <Transaction type="Trade Profit" amount="+$120" status="Closed" />
      </div>

      {/* ================= TIPS ================= */}
      <div className="space-y-3">
        <TipBanner
          title="Risk Reminder"
          message="Always use stop-loss and manage risk per trade."
        />
        <TipBanner
          title="Security Tip"
          message="Enable 2FA to increase account safety."
        />
      </div>

    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Stat({ icon: Icon, label, value, positive }: any) {
  return (
    <div className="rounded-xl bg-[var(--bg-glass)] p-4">
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>{label}</span>
        <Icon size={14} />
      </div>
      <p className={`mt-2 text-lg font-semibold ${positive ? "text-emerald-500" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex justify-between items-center text-sm">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <Icon size={14} />
        {label}
      </div>
      <span className="truncate max-w-[130px] text-right font-medium">
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, positive }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={positive ? "text-emerald-500" : ""}>{value}</span>
    </div>
  );
}

function Market({ symbol, price, change, down }: any) {
  return (
    <div className="rounded-xl bg-[var(--bg-glass)] p-3">
      <p className="text-xs text-[var(--text-muted)]">{symbol}</p>
      <p className="font-semibold">{price}</p>
      <p className={`text-xs ${down ? "text-red-500" : "text-emerald-500"}`}>
        {change}
      </p>
    </div>
  );
}

function Transaction({ type, amount, status }: any) {
  return (
    <div className="flex justify-between text-sm border-b border-[var(--border-soft)] pb-2">
      <span>{type}</span>
      <span>{amount}</span>
      <span className="text-[var(--text-muted)]">{status}</span>
    </div>
  );
}
