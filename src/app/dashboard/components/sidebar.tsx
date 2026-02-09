"use client";

import { useMyAccounts } from "@/hooks/useMyAccounts";
import { useUserMe } from "@/hooks/useUser";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileText,
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

  useEffect(() => {
    if (!isPaymentActive) setPaymentOpen(false);
  }, [pathname]);

  // Function to get first live account, fallback to first demo account
  const getFirstTradingAccount = () => {
    if (!accounts || accounts.length === 0) return null;

    // First priority: first LIVE account
    const firstLive = accounts.find((acc: any) => acc.account_type === "live");
    if (firstLive) return firstLive._id;

    // Fallback: first DEMO account
    const firstDemo = accounts.find((acc: any) => acc.account_type === "demo");
    if (firstDemo) return firstDemo._id;

    // Last resort: first account of any type
    return accounts[0]._id;
  };

  const NavButton = ({
    label,
    icon: Icon,
    active,
    onClick,
  }: any) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          flex items-center gap-3 w-full rounded-xl px-3 py-2.5
          ${active
            ? "bg-[var(--bg-glass)] text-[var(--primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)]"
          }
        `}
      >
        <span className="h-9 w-9 flex items-center justify-center rounded-lg">
          <Icon size={18} />
        </span>

        {!collapsed && <span className="text-sm font-medium">{label}</span>}
      </button>

      {/* TOOLTIP */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 rounded-md bg-black px-2 py-1 text-xs text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
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
    fixed md:static z-[100] h-screen transition-all duration-300
    ${collapsed ? "w-20" : "w-64"}
    bg-[var(--bg-card)]
    border-r border-[var(--border-glass)]
    ${open ? "left-0" : "-left-full md:left-0"}
  `}
      >


        <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border-soft)] relative">

          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-transparent pointer-events-none" />

          {!collapsed && (
            <div className="relative z-10">
              <p className="text-lg uppercase tracking-wider text-[var(--text-main)] font-bold">
                {user?.name}
              </p>
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Dashboard
              </p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="relative z-10 rounded-lg p-2 hover:bg-[var(--bg-glass)] transition"
          >
            <ChevronLeft
              size={18}
              className={`transition duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>


        <nav className="mt-4 pl-2 space-y-1">
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
                router.push(item.href);
                onClose?.();
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
                flex items-center justify-between w-full rounded-xl px-3 py-2.5
                ${isPaymentActive
                  ? "bg-[var(--bg-glass)] text-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)]"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 flex items-center justify-center">
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

            {/* DROPDOWN */}
            {paymentOpen && (
              <div
                className={`
                   ${collapsed
                    ? "absolute left-26 top-0 ml-2 z-[110]"
                    : "relative ml-3 mt-1 z-[110]"
                  }
      overflow-visible
      rounded-xl
      bg-[var(--bg-card)]
      shadow-lg
      transition-all duration-300
      animate-dropdown
      min-w-[200px]
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
                          router.push(sub.href);
                          setPaymentOpen(false);
                          onClose?.();
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
                      router.push(`/trade`);
                    } else {
                      router.push(item.href);
                    }
                    onClose?.();
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
                  router.push(item.href);
                  onClose?.();
                }}
              />
            );
          })}
        </nav>
      </aside>
    </>
  );
}
