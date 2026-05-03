"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogOut,
  ChevronRight,
  User,
  Users,
  Palette,
  Calendar,
  LineChart,
  Landmark,
  ArrowUpRight,
} from "lucide-react";

import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { useLiveTradeSocket } from "@/hooks/useLiveTradeSocket";
import { useTheme } from "@/app/providers";

import TopBarSlot from "../components/layout/TopBarSlot";
import TradeTopBar from "../components/layout/TradeTopBar";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { useLanguage } from "../components/LanguageProvider";
import {
  TRADE_LOGIN_REMEMBER_KEY,
} from "@/lib/tradeLoginAccounts";
import {
  clearClientCookie,
  clearTradeTokenCookie,
  getCookieValue,
} from "@/lib/tradeToken";

const TRADE_LOGIN_ACCOUNTS_KEY = "trade-login-accounts";
const TRADE_AUTH_STATE_KEY = "trade-auth-state";
const TRADE_AUTH_LOGGED_OUT = "trade-logged-out";

export default function TradeSettingsPage() {
  const router = useRouter();
  const { data: account, isLoading, refetch } = useTradeAccount();
  const accountId =
    account?.accountId ?? account?._id ?? account?.id ?? "";
  const { account: liveAccount } = useLiveTradeSocket(
    accountId ? String(accountId) : undefined
  );
  const { theme, toggleTheme } = useTheme();

  const { language, setLanguage } = useLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [quoteView, setQuoteView] = useState<"simple" | "advanced">(() => {
    if (typeof window === "undefined") return "simple";
    const saved = localStorage.getItem("trade-quote-view");
    return saved === "advanced" || saved === "simple" ? saved : "simple";
  });

  const handleLogout = () => {
    clearTradeTokenCookie({ silent: true });
    clearClientCookie("accountId");
    clearClientCookie("sessionType");
    clearClientCookie("tradeSessionType");
    clearClientCookie("tradeAccount");
    if (typeof window !== "undefined") {
      localStorage.removeItem("tradeAccountId");
      localStorage.removeItem("tradeToken");
      localStorage.removeItem("trade-lang");
      localStorage.removeItem("trade-quote-view");
      localStorage.removeItem(TRADE_LOGIN_REMEMBER_KEY);
      localStorage.removeItem(TRADE_LOGIN_ACCOUNTS_KEY);
      localStorage.setItem(TRADE_AUTH_STATE_KEY, TRADE_AUTH_LOGGED_OUT);
      window.dispatchEvent(new Event("trade-account-change"));
    }

    window.location.replace("/trade-login");
  };
  useEffect(() => {
    const langMap: Record<string, string> = {
      english: "en",
      indonesia: "id",
      russia: "ru",
    };

    document.documentElement.lang = langMap[language];
  }, [language]);

  useEffect(() => {
    const saved = localStorage.getItem("trade-lang");
    if (saved) setLanguage(saved);
  }, [setLanguage]);

  useEffect(() => {
    localStorage.setItem("trade-lang", language);
  }, [language]);

  useEffect(() => {
    const refresh = () => {
      void refetch();
    };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("trade-account-change", refresh);
    window.addEventListener("trade-token-change", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("trade-account-change", refresh);
      window.removeEventListener("trade-token-change", refresh);
    };
  }, [refetch]);

  const setQuoteViewAndPersist = (next: "simple" | "advanced") => {
    setQuoteView(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("trade-quote-view", next);
      window.dispatchEvent(
        new CustomEvent("trade-quote-view-change", { detail: next })
      );
    }
  };

  const handleSwitchToBroker = () => {
    window.location.assign("/login");
  };



  if (isLoading) {
    return (
      <div className="p-6">
        <GlobalLoader />
      </div>
    );
  }

  const accountNumber = String(
    account?.accountNumber ?? account?.account_number ?? "--"
  );
  const accountTypeRaw = String(
    account?.accountType ?? account?.account_type ?? ""
  ).toLowerCase();
  const accountTypeLabel =
    accountTypeRaw === "demo"
      ? "Demo"
      : accountTypeRaw === "live"
      ? "Live"
      : "--";
  const sessionTypeRaw = String(
    account?.sessionType ?? getCookieValue("sessionType") ?? ""
  ).toUpperCase();
  const sessionTypeLabel =
    sessionTypeRaw === "WATCH"
      ? "Watch Only"
      : sessionTypeRaw === "TRADE"
      ? "Trade"
      : "--";
  const currency = String(account?.currency ?? "");
  const effectiveBalance =
    liveAccount?.balance ?? account?.balance ?? 0;

  const cardClass =
    "rounded-xl p-4 lg:p-5 border border-[var(--border-soft)] shadow-sm lg:shadow-md bg-[var(--bg-plan)] md:bg-[var(--bg-glass)]";

  return (
    <>
      <TopBarSlot>
        <TradeTopBar title="Settings" showMenu />
      </TopBarSlot>

       <div className="flex-1 w-full min-h-full px-4 py-4">
        <div className="mx-auto w-full max-w-5xl">
          <div className="hidden md:block mb-4">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Manage your account, appearance, and trading preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ACCOUNT */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <User size={18} />
            <span className="font-semibold text-sm">Account Information</span>
          </div>

          <div className="space-y-3 text-sm">
            <Row label="Account No" value={accountNumber} />
            <Row label="Account Type" value={accountTypeLabel} />
            <Row label="Session Type" value={sessionTypeLabel} />
            <Row
              label="Balance"
              value={`${Number(effectiveBalance).toFixed(2)} ${currency}`}
            />
          </div>
        </div>

        <div className={cardClass}>
          <button
            onClick={() => router.push("/trade/settings/manageaccounts")}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users size={18} />
              <span className="text-sm font-medium">Manage Accounts</span>
            </div>

            <ChevronRight size={16} />
          </button>
        </div>

        {/* THEME */}
        <div className={cardClass}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Palette size={18} />
              <span className="text-sm font-medium">Theme</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>

        {/* LANGUAGE */}
        {/* <div className={cardClass}>
          <div className="flex items-center gap-3 mb-3">
            <Globe size={18} />
            <span className="text-sm font-medium">Language</span>
          </div>

          <div className="flex gap-2">
            {["english", "indonesia", "russia"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 text-xs rounded-full transition ${language === lang
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-main)] text-[var(--text-muted)]"
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div> */}

        {/* ECONOMIC CALENDAR */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={18} />
              <span className="text-sm font-medium">
                Economic Calendar
              </span>
            </div>

            <Toggle
              active={calendarEnabled}
              onClick={() => setCalendarEnabled(!calendarEnabled)}
            />
          </div>
        </div>

        {/* QUOTES VIEW */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-3">
            <LineChart size={18} />
            <span className="text-sm font-medium">Quotes View</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setQuoteViewAndPersist("simple")}
              className={`flex-1 py-2 text-xs rounded-lg ${quoteView === "simple"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-main)] text-[var(--text-muted)]"
                }`}
            >
              Simple View
            </button>

            <button
              onClick={() => setQuoteViewAndPersist("advanced")}
              className={`flex-1 py-2 text-xs rounded-lg ${quoteView === "advanced"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-main)] text-[var(--text-muted)]"
                }`}
            >
              Advanced View
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,83,45,0.92)_55%,rgba(5,150,105,0.82))] p-[1px] shadow-[0_18px_44px_rgba(5,150,105,0.18)]">
          <div className="relative rounded-[calc(1rem-1px)] bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] px-5 py-5 sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.2),transparent_38%)]" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
                  <Landmark size={14} />
                  Broker Access
                </div>
                <h2 className="text-lg font-semibold text-white sm:text-xl">
                  Switch to Broker Portal
                </h2>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                  Move from trading view to your broker workspace in one tap.
                  If your broker session is not active, you will stay on the
                  broker login screen until you sign in.
                </p>
              </div>

              <button
                onClick={handleSwitchToBroker}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_34px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <span>Switch to Broker</span>
                <ArrowUpRight
                  size={16}
                  className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <div className={`${cardClass} border border-red-500/30 bg-[var(--mt-red)] lg:col-span-2`}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between text-[var(--text-main)]"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span className="text-sm font-semibold">Logout from Trade Panel</span>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>

          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <ConfirmModal
          title="Confirm Logout"
          description="Are you sure you want to logout from trading panel?"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-[var(--text-muted)]">
      <span>{label}</span>
      <span className="text-[var(--text-main)] font-medium">
        {value || "--"}
      </span>
    </div>
  );
}

function Toggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${active ? "bg-[var(--primary)]" : "bg-gray-500"
        }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${active ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </div>
  );
}
