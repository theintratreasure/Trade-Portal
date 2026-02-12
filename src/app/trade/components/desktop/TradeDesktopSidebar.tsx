"use client";

import {
  type LucideIcon,
  BarChart3,
  Copy,
  Settings,
  Users,
  Bookmark,
  HexagonIcon,
  TrendingUp,
  ChartBarBigIcon,
  CandlestickChart,
  History,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTradeDesktop } from "./TradeDesktopContext";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function TradeDesktopSidebar() {
  const router = useRouter();
  const { accountId } = useParams<{ accountId: string }>();

  const base = `/trade`;
  const { toggleQuotes } = useTradeDesktop();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const isExact = (path: string) => pathname === path;
  return (
    <aside
      className="hidden md:flex z-40 h-full w-[68px] flex-col items-center py-4 gap-5"
      style={{
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-soft)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
      }}
    >
      {/* LOGO */}
      <div
        className="w-10 h-10 mb-6 flex items-center justify-center rounded-xl"
        style={{
          background: "var(--bg-glass)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <img
          src="/logo/logo.png"
          className="w-6 h-6 object-contain"
        />
      </div>

      <NavIcon
        icon={BarChart3}
        active={isExact(`${base}`) || isExact(`${base}/`)}
        onClick={() => router.push(`${base}`)}
      />
      <NavIcon
        icon={Bookmark}
        onClick={toggleQuotes}
        active={pathname?.includes("/quotes")}
      />
      <NavIcon
        icon={CandlestickChart}
        active={isExact(`${base}/charts`)}
        onClick={() => router.push(`${base}/charts`)}
      />

      <NavIcon
        icon={TrendingUp}
        active={isExact(`${base}/trade`)}
        onClick={() => router.push(`${base}/trade`)}
      />

<NavIcon
  icon={History}
  active={isExact(`${base}/history`)}
  onClick={() => router.push(`${base}/history`)}
/>
      <NavIcon
        icon={Settings}
        active={isExact(`${base}/settings`)}
        onClick={() => router.push(`${base}/settings`)}
      />
      <ThemeToggle />



      <div className="flex-1" />
    </aside>
  );
}

/* ---------------- NAV ICON ---------------- */

function NavIcon({
  icon: Icon,
  onClick,
  active,
}: {
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-12 h-12 flex items-center justify-center      rounded-xl transition-all duration-200 group"
      style={{
        background: active
          ? "var(--bg-glass)"
          : "transparent",
      }}
    >
      {/* Active left indicator */}
      {active && (
        <div
          className="absolute left-0 h-6 w-[3px] rounded-r-full"
          style={{ background: "var(--primary)" }}
        />
      )}

      <Icon
        size={20}
        style={{
          color: active
            ? "var(--primary)"
            : "var(--text-muted)",
        }}
        className="transition-colors duration-200"
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: "var(--primary-glow)",
        }}
      />
    </button>
  );
}
