"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PlusCircle, User } from "lucide-react";
import TopBarSlot from "../../components/layout/TopBarSlot";
import TradeTopBar from "../../components/layout/TradeTopBar";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import {
  SavedTradeAccount,
  getSavedTradeAccounts,
} from "@/lib/tradeLoginAccounts";
import BackButton from "@/app/components/ui/BackButton";

type DisplayTradeAccount = SavedTradeAccount & {
  isCurrent: boolean;
};

export default function TradeManageAccountsPage() {
  const router = useRouter();
  const { data: account } = useTradeAccount();
  const [savedAccounts] = useState<SavedTradeAccount[]>(() => getSavedTradeAccounts());

  const currentAccountNumber = account?.accountNumber
    ? String(account.accountNumber)
    : "";

  const displayAccounts = useMemo<DisplayTradeAccount[]>(() => {
    const map = new Map<string, DisplayTradeAccount>();

    for (const item of savedAccounts) {
      map.set(item.account_number, {
        ...item,
        isCurrent: item.account_number === currentAccountNumber,
      });
    }

    if (currentAccountNumber && !map.has(currentAccountNumber)) {
      map.set(currentAccountNumber, {
        account_number: currentAccountNumber,
        password: "",
        updatedAt: new Date(0).toISOString(),
        isCurrent: true,
      });
    }

    return Array.from(map.values());
  }, [currentAccountNumber, savedAccounts]);

  const openTradeLogin = (accountNumber?: string) => {
    const params = new URLSearchParams();
    params.set("manageAccounts", "1");

    if (accountNumber) params.set("account", accountNumber);

    router.push(`/trade-login?${params.toString()}`);
  };

  return (
    <>
      <TopBarSlot>
        <TradeTopBar title="Manage Accounts" showMenu />
      </TopBarSlot>

      <div className="px-4 py-4 mt-14 pb-20">
        <div className="mx-auto w-full max-w-2xl space-y-4">
        <BackButton />
          <div
            className="rounded-xl border border-[var(--border-soft)] p-4 bg-[var(--bg-plan)] md:bg-[var(--bg-glass)]"
          >
            <p className="text-sm text-[var(--text-muted)]">
              Saved trade accounts
            </p>

            <div className="mt-3 space-y-2">
              {displayAccounts.length === 0 && (
                <div className="text-sm text-[var(--text-muted)]">
                  No saved accounts yet.
                </div>
              )}

              {displayAccounts.map((item) => (
                <button
                  key={item.account_number}
                  onClick={() => openTradeLogin(item.account_number)}
                  className="w-full flex items-center justify-between rounded-lg border border-[var(--border-soft)] px-3 py-3 bg-[var(--bg-card)]"
                >
                  <div className="flex items-center gap-3">
                    <User size={16} />
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {item.account_number}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {item.isCurrent
                          ? "Currently active"
                          : item.password
                            ? "Tap to login directly"
                            : "Tap to continue login"}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => openTradeLogin()}
            className="w-full rounded-xl py-3 font-medium bg-[var(--primary)] text-white inline-flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            Add account
          </button>
        </div>
      </div>
    </>
  );
}
