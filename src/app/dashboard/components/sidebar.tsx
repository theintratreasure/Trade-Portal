"use client";

import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileText,
  Layers,
  Gift,
  Headphones,
  ChevronLeft,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Assets", icon: Wallet, href: "/dashboard/assets" },
  {
    label: "Internal Transfer",
    icon: ArrowLeftRight,
    href: "/dashboard/transfer",
  },
  {
    label: "Transactions",
    icon: FileText,
    href: "/dashboard/transactions",
  },
  { label: "Platform", icon: Layers, href: "/dashboard/platform" },
  { label: "Task Center", icon: Gift, href: "/dashboard/tasks" },
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
          fixed md:static z-50 h-full transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          bg-[var(--bg-card)]
          border-r border-[var(--border-glass)]
          ${open ? "left-0" : "-left-full md:left-0"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border-soft)]">
          {!collapsed && (
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Account
              </p>
              <p className="text-lg font-semibold text-[var(--text-main)]">
                Dashboard
              </p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 hover:bg-[var(--bg-glass)] transition"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* MENU */}
        <nav className="mt-4 px-2 space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.href);
                  onClose?.();
                }}
                className={`
                  group relative flex items-center gap-3 w-full
                  rounded-xl px-3 py-2.5 transition-all
                  ${
                    active
                      ? "bg-[var(--bg-glass)] text-[var(--primary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary-glow)]" />
                )}

                <span
                  className={`
                    flex items-center justify-center h-9 w-9 rounded-lg
                    ${
                      active
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "group-hover:bg-[var(--bg-glass)]"
                    }
                  `}
                >
                  <Icon size={18} />
                </span>

                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
