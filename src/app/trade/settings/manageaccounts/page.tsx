"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PlusCircle, User, Wallet } from "lucide-react";
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
  const [savedAccounts, setSavedAccounts] = useState<SavedTradeAccount[]>([]);


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
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <BackButton />

          <section className="manage-accounts-header rounded-2xl p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Trade Settings
                </p>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold text-[var(--text-main)]">
                  Saved Trade Accounts
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Manage your account shortcuts and switch login instantly.
                </p>
              </div>

              <div className="manage-accounts-stat shrink-0">
                <span className="text-xs text-[var(--text-muted)]">Total</span>
                <span className="text-base font-semibold text-[var(--text-main)]">
                  {displayAccounts.length}
                </span>
              </div>
            </div>
          </section>

          <section className="manage-accounts-shell rounded-2xl p-3 md:p-4">
            {displayAccounts.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-8 text-center">
                <p className="text-sm font-medium text-[var(--text-main)]">
                  No saved accounts yet
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Add an account to quickly login next time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayAccounts.map((item) => (
                  <button
                    key={item.account_number}
                    onClick={() => openTradeLogin(item.account_number)}
                    className="manage-accounts-tile w-full"
                  >
                    <div className="flex items-center gap-3">
                      <div className="manage-accounts-icon">
                        <User size={15} />
                      </div>

                      <div className="text-left">
                        <div className="font-semibold tracking-[0.02em] text-[var(--text-main)]">
                          {item.account_number}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {item.isCurrent
                            ? "Currently active account"
                            : item.password
                              ? "Tap to login directly"
                              : "Tap to continue login"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.isCurrent && (
                        <span className="manage-accounts-badge">Active</span>
                      )}
                      <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <button
            onClick={() => openTradeLogin()}
            className="manage-accounts-add-btn w-full rounded-xl py-3.5 font-medium inline-flex items-center justify-center gap-2"
          >
            <Wallet size={16} />
            <PlusCircle size={18} />
            Add Account
          </button>

          {currentAccountNumber && (
            <div className="px-1 text-xs text-[var(--text-muted)]">
              Current active account:{" "}
              <span className="font-semibold text-[var(--text-main)]">
                {currentAccountNumber}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
