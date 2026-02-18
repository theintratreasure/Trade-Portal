"use client";

import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useTransition } from "react";

const tabs = [
  {
    key: "internal-fund-transfer",
    label: "Fund Trans",
    icon: ArrowLeftRight,
    path: "/dashboard/payments/internal-fund-transfer",
  },
  {
    key: "deposit",
    label: "Deposit",
    icon: ArrowDownCircle,
    path: "/dashboard/payments/deposit",
  },
  {
    key: "withdraw",
    label: "Withdraw",
    icon: ArrowUpCircle,
    path: "/dashboard/payments/withdraw",
  },
];

export default function PaymentTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const matchedIndex = tabs.findIndex((tab) => pathname.includes(tab.key));
  const activeIndex = matchedIndex >= 0 ? matchedIndex : 0;

  useEffect(() => {
    tabs.forEach((tab) => router.prefetch(tab.path));
  }, [router]);

  const navigateTo = useCallback(
    (path: string) => {
      if (pathname === path || isPending) return;
      startTransition(() => {
        router.push(path);
      });
    },
    [isPending, pathname, router]
  );

  return (
    <div className="relative flex overflow-hidden rounded-xl bg-[var(--bg-glass)] p-1">
      {/* Sliding Active Background */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-1 bottom-1 rounded-lg bg-[var(--primary)]"
        style={{
          width: `${100 / tabs.length}%`,
          left: `${(100 / tabs.length) * activeIndex}%`,
        }}
      />

      {tabs.map(({ key, label, icon: Icon, path }, index) => {
        const active = index === activeIndex;

        return (
          <button
            key={key}
            onClick={() => navigateTo(path)}
            onMouseEnter={() => router.prefetch(path)}
            onFocus={() => router.prefetch(path)}
            onTouchStart={() => router.prefetch(path)}
            className={`relative z-10 flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-0.5 py-2 text-[10px] font-medium transition-colors min-[360px]:px-1 min-[360px]:text-xs
              ${
                active
                  ? "text-[var(--text-invert)]"
                  : "text-[var(--text-muted)]"
              }`}
          >
            <Icon size={14} className="shrink-0 min-[360px]:h-4 min-[360px]:w-4" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
