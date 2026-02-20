"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Newspaper,
  Mail,
  BookOpen,
  Settings,
  Calendar,
  Users,
  Bot,
  HelpCircle,
  Info,
  ChevronRight,
  CandlestickChart,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useTradeSidebar } from "./TradeSidebarContext";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { getCookieValue } from "@/lib/tradeToken";



export default function TradeSidebar() {
  const { isOpen, close } = useTradeSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const { accountId } = useParams<{ accountId: string }>();
  const { data: account } = useTradeAccount();
  const accountTypeRaw = String(
    account?.accountType ?? account?.account_type ?? ""
  ).toLowerCase();
  const sessionTypeRaw = String(
    account?.sessionType ?? getCookieValue("sessionType") ?? ""
  ).toUpperCase();
  const isWatchOnly = sessionTypeRaw === "WATCH";
  const ribbonLabel = isWatchOnly
    ? "READ ONLY"
    : accountTypeRaw === "demo"
      ? "DEMO"
      : accountTypeRaw === "live"
        ? "LIVE"
        : "";
  const ribbonBackground = isWatchOnly
    ? "var(--bg-muted-card)"
    : accountTypeRaw === "demo"
      ? "var(--success)"
      : "var(--mt-red)";

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (isOpen && ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, close]);

  const go = (path: string) => {
    router.push(path);
    close();
  };

  const base = `/trade`;
  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        style={{ background: "rgba(0,0,0,0.55)" }}
      />

      {/* SIDEBAR */}
      <aside
        ref={ref}
        className={`fixed left-0 top-0 z-[999] h-full w-[75%] max-w-[360px]
        transform transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "var(--bg-plan)",
          color: "var(--text-main)",
          borderRight: "1px solid var(--border-soft)",
          boxShadow: "0 0 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* PROFILE HEADER */}
        {ribbonLabel && (
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
            <div
              className="absolute right-[-34px] top-[12px] rotate-45 text-[11px] font-semibold px-10 py-[4px] text-center shadow-md"
              style={{
                background: ribbonBackground,
                color: "#ffffff",
                letterSpacing: "0.5px",
              }}
            >
              {ribbonLabel}
            </div>
          </div>
        )}


        <div className="flex items-center gap-3 mt-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
            style={{ background: "var(--bg-plan)" }}
          >
            <img
              src="/logo/logo.png"
              alt="Platform Logo"
              className="w-8 h-8 object-contain rounded-full"
            />
          </div>

          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold truncate">
              {account?.name || "Trader"}
            </span>

            <span
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {account?.accountNumber} · ALS Traders
            </span>

            <button
              className="mt-3 text-[13px] font-medium transition text-left"
              style={{ color: "var(--primary)" }}
              onClick={() => go("/trade/settings/manageaccounts")}
            >
              Manage accounts
            </button>
          </div>

        </div>

        {/* MENU */}
        <nav className="py-3 flex flex-col gap-1">
          <Item
            icon={BarChart3}
            label="Trade"
            active={pathname === `${base}/trade`}
            onClick={() => go(`${base}/trade`)}
          />
          <Item
            icon={CandlestickChart}
            label="Chart"
            active={pathname === `${base}/charts`}
            onClick={() => go(`${base}/charts`)}
          />
          <Item
            icon={Clock}
            label="History"
            active={pathname === `${base}/history`}
            onClick={() => go(`${base}/history`)}
          />


          <Item
            icon={Settings}
            label="Settings"
            active={pathname?.startsWith(`${base}/settings`)}
            onClick={() => go(`${base}/settings`)}
          />
          <Item
            icon={Calendar}
            label="Economic calendar"
            badge={<Badge color="blue">Ads</Badge>}
            active={pathname === "/calendar"}
            onClick={() => go("/calendar")}
          />
        </nav>

        {/* FOOTER */}
        <div
          className="absolute bottom-0 w-full py-2"
          style={{ borderTop: "1px solid var(--border-soft)" }}
        >
          <Item
            icon={HelpCircle}
            label="User guide"
            onClick={() => go("/guide")}
          />
          <Item
            icon={Info}
            label="About"
            onClick={() => window.open("https://www.alstrades.com/about", "_blank")}
          />
        </div>
      </aside >
    </>
  );
}

/* ---------- ITEM ---------- */

function Item({
  icon: Icon,
  label,
  badge,
  onClick,
  active,
}: {
  icon: LucideIcon;
  label: string;
  badge?: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3 text-[15px] transition-all duration-200"
      style={{
        background: active ? "var(--bg-plan)" : "transparent",
        borderLeft: active
          ? "3px solid var(--primary)"
          : "3px solid transparent",
      }}
    >
      <div className="flex items-center gap-4">
        <Icon
          size={19}
          style={{
            color: active
              ? "var(--primary)"
              : "var(--text-muted)",
          }}
        />
        <span
          style={{
            color: active
              ? "var(--primary)"
              : "var(--text-main)",
          }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {badge}
        <ChevronRight
          size={16}
          style={{ color: "var(--text-muted)" }}
        />
      </div>
    </button>
  );
}

/* ---------- BADGE ---------- */

function Badge({
  children,
  color,
}: {
  children: string;
  color: "red" | "blue";
}) {
  return (
    <span
      className="text-[11px] px-2 py-[3px] rounded-full font-medium"
      style={{
        background:
          color === "red"
            ? "var(--error)"
            : "var(--bg-glass)",
        color:
          color === "red"
            ? "#fff"
            : "var(--primary)",
      }}
    >
      {children}
    </span>
  );
}
