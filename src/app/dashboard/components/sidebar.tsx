"use client";

import { useMyAccounts } from "@/hooks/useMyAccounts";
import { useUserMe } from "@/hooks/useUser";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Layers,
  Gift,
  Headphones,
  Landmark,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

const items = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Assets", icon: Wallet, href: "/dashboard/assets" },
  { label: "Account", icon: Landmark, href: "/dashboard/accounts" },
];

const paymentItems = [
  { label: "Deposit", href: "/dashboard/payments/deposit", icon: ArrowDownCircle },
  { label: "Withdrawal", href: "/dashboard/payments/withdraw", icon: ArrowUpCircle },
  { label: "Internal Transfer", href: "/dashboard/payments/internal-fund-transfer", icon: ArrowLeftRight },
  { label: "Transactions", href: "/dashboard/payments/transactions", icon: Receipt },
];

const bottomItems = [
  { label: "Trading Platform", icon: Layers, href: "/trade" },
  { label: "Referal", icon: Gift, href: "/dashboard/referal" },
  { label: "Support", icon: Headphones, href: "/dashboard/support" },
];

type TradingAccount = {
  _id: string;
  account_type?: string;
};

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  open: boolean;
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: accounts } = useMyAccounts();
  const { data: user } = useUserMe();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const isPaymentActive = pathname.startsWith("/dashboard/payments");
  const userInitial = String(user?.name || "T").trim().charAt(0).toUpperCase();

  const typedAccounts = (Array.isArray(accounts) ? accounts : []) as TradingAccount[];

  useEffect(() => {
    const routes = new Set<string>([
      ...items.map((item) => item.href),
      ...paymentItems.map((item) => item.href),
      ...bottomItems.map((item) => item.href),
      "/trade",
    ]);
    routes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  const navigateTo = (href: string) => {
    onClose?.();
    router.push(href);
  };

  // Function to get first live account, fallback to first demo account
  const getFirstTradingAccount = () => {
    if (!typedAccounts || typedAccounts.length === 0) return null;

    // First priority: first LIVE account
    const firstLive = typedAccounts.find((acc) => acc.account_type === "live");
    if (firstLive) return firstLive._id;

    // Fallback: first DEMO account
    const firstDemo = typedAccounts.find((acc) => acc.account_type === "demo");
    if (firstDemo) return firstDemo._id;

    // Last resort: first account of any type
    return typedAccounts[0]._id;
  };

  const NavButton = ({
    label,
    icon: Icon,
    active,
    onClick,
  }: {
    label: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    active: boolean;
    onClick: () => void;
  }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-all duration-200
          ${active
            ? "bg-[var(--bg-glass)] text-[var(--primary)] shadow-[inset_3px_0_0_var(--primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
          }
        `}
      >
        <span className="h-9 w-9 flex items-center justify-center rounded-lg bg-[var(--bg-glass)] border border-[var(--border-soft)]">
          <Icon size={18} />
        </span>

        {!collapsed && <span className="text-sm font-medium">{label}</span>}
      </button>

      {/* TOOLTIP */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-[130] shadow-lg">
          {label}
        </span>
      )}
    </div>
  );

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`
    fixed md:relative z-[120] h-screen transition-all duration-300 flex flex-col overflow-x-visible
    ${collapsed ? "w-20" : "w-72"}
    bg-[var(--bg-card)]/95 backdrop-blur-md
    border-r border-[var(--border-glass)]
    ${open ? "left-0" : "-left-full md:left-0"}
  `}
      >

        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-soft)] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/15 via-[var(--primary)]/5 to-transparent pointer-events-none" />

          {!collapsed && (
            <div className="relative z-10">
              <p className="text-[15px] uppercase tracking-wider text-[var(--text-main)] font-bold truncate max-w-[180px]">
                {user?.name || "Trader"}
              </p>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide">Dashboard</p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="relative z-10 rounded-lg p-2 border border-[var(--border-soft)] bg-[var(--bg-glass)] hover:bg-[var(--primary)]/10 transition"
          >
            <ChevronLeft
              size={18}
              className={`transition duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <nav
          className={`mt-4 px-2 space-y-1 flex-1 ${
            collapsed ? "overflow-visible" : "overflow-y-auto"
          }`}
        >
          {items.map((item) => (
            <NavButton
              key={item.label}
              {...item}
              active={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              }
              onClick={() => {
                navigateTo(item.href);
              }}
            />
          ))}

          {/* PAYMENTS */}
          <div
            className="relative group"
            onMouseEnter={() => collapsed && setPaymentOpen(true)}
            onMouseLeave={() => collapsed && setPaymentOpen(false)}
          >
            <button
              onClick={() => !collapsed && setPaymentOpen((v) => !v)}
              className={`
                flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all duration-200
                ${isPaymentActive
                  ? "bg-[var(--bg-glass)] text-[var(--primary)] shadow-[inset_3px_0_0_var(--primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 flex items-center justify-center rounded-lg bg-[var(--bg-glass)] border border-[var(--border-soft)]">
                  <CreditCard size={18} />
                </span>
                {!collapsed && <span className="text-sm">Payments</span>}
              </div>

              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`transition ${paymentOpen ? "rotate-180" : ""
                    }`}
                />
              )}
            </button>
            {collapsed && (
              <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-[130] shadow-lg">
                Payments
              </span>
            )}

            {/* DROPDOWN */}
            {paymentOpen && (
              <div
                className={`
                   ${collapsed
                    ? "absolute left-12 top-0 ml-2 z-[9999]"
                    : "relative ml-3 mt-1 z-[9999]"
                  }
      overflow-x-hidden
      rounded-xl
      bg-[var(--bg-card)] border border-[var(--border-soft)]
      shadow-none
      transition-all duration-300
      animate-dropdown
      w-[196px] max-w-[calc(100vw-120px)]
      z-[140]
    `}
              >
                <div className="flex flex-col py-1">
                  {paymentItems.map((sub) => {
                    const Icon = sub.icon;
                    const active = pathname === sub.href;

                    return (
                      <button
                        key={sub.label}
                        onClick={() => {
                          setPaymentOpen(false);
                          navigateTo(sub.href);
                        }}
                        className={`
  group relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5
  transition-all duration-300
  ${active
                            ? "bg-[var(--bg-glass)] text-[var(--primary)] shadow-[0_0_20px_var(--primary-glow)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:shadow-[0_0_15px_var(--primary-glow)]"
                          }
`}
                      >
                        <span className={`
  h-9 w-9 flex items-center justify-center rounded-lg
  transition-all duration-300
  ${active ? "bg-[var(--primary)]/10" : "group-hover:bg-[var(--primary)]/5"}
`}>
                          <Icon size={18} />
                        </span>


                        <span className="text-sm font-medium whitespace-nowrap">
                          {sub.label}
                        </span>
                      </button>


                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {bottomItems.map((item) => {
            // Special handling for Trading Platform
            if (item.label === "Trading Platform") {
              return (
                <NavButton
                  key={item.label}
                  {...item}
                  active={pathname.startsWith("/trade")}
                  onClick={() => {
                    const accountId = getFirstTradingAccount();
                    if (accountId) {
                      navigateTo(`/trade`);
                    } else {
                      navigateTo(item.href);
                    }
                  }}
                />
              );
            }

            return (
              <NavButton
                key={item.label}
                {...item}
                active={pathname.startsWith(item.href)}
                onClick={() => {
                  navigateTo(item.href);
                }}
              />
            );
          })}
        </nav>

        <div className="mx-2 mb-2 mt-2 border border-[var(--border-soft)] bg-[var(--bg-glass)] rounded-xl px-3 py-2.5">
          {collapsed ? (
            <div className="h-9 w-9 rounded-full bg-[var(--primary)]/15 border border-[var(--border-soft)] text-[var(--primary)] font-bold flex items-center justify-center">
              {userInitial}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[var(--primary)]/15 border border-[var(--border-soft)] text-[var(--primary)] font-bold flex items-center justify-center">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-main)] truncate">
                  {user?.name || "Trader"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {user?.email || "Broker Portal"}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
