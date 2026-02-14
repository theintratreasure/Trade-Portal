"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import AccountRow from "../components/account/AccountRow";
import TipBanner from "@/app/components/ui/TipBanner";
import GlobalLoader from "@/app/components/ui/GlobalLoader";

type AccountTab = "live" | "demo";
type AccountItem = {
    _id: string;
    account_type: AccountTab;
    account_number: string;
    plan_name: string;
    balance: number;
    currency: string;
};

export default function MyAccountsPage() {
    const { data, isLoading } = useMyAccounts();
    const [tab, setTab] = useState<AccountTab>("live");
    const router = useRouter();

    if (isLoading) {
        return <div className="p-6"><GlobalLoader/></div>;
    }

    const accounts =
        ((data as AccountItem[] | undefined)?.filter((a) => a.account_type === tab) ?? []);

    return (
        <div className="min-h-screen bg-[var(--bg-main)] pb-28 md:pb-6">
            {/* ================= HEADER ================= */}
            <div className="px-2 py-2 md:p-6 space-y-3 md:space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-lg md:text-2xl font-semibold">
                        My accounts
                    </h1>

                    {/* Desktop CTA */}
                    <button
                        onClick={() =>
                            router.push("/dashboard/accounts/open")
                        }
                        className="hidden md:flex items-center gap-2 rounded-md bg-[var(--bg-glass)] px-4 py-2 text-sm"
                    >
                        <Plus size={16} />
                        Open account
                    </button>
                </div>

                {/* ================= TABS ================= */}
                <div className="flex gap-4 overflow-x-auto border-b border-[var(--border-soft)]">
                    {(["live", "demo"] as AccountTab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`pb-2.5 text-xs md:text-sm font-medium whitespace-nowrap ${tab === t
                                    ? "border-b-2 border-[var(--primary)] text-[var(--text-main)]"
                                    : "text-[var(--text-muted)]"
                                }`}
                        >
                            {t === "live" ? "Live accounts" : "Demo accounts"}
                        </button>
                    ))}
                </div>

                {/* ================= TOOLBAR (DESKTOP ONLY) ================= */}
                <div className="hidden md:flex items-center justify-end">



                </div>
            </div>

            {/* ================= ACCOUNTS ================= */}
            <div className="px-2 md:px-6 space-y-3 md:space-y-4">
                {accounts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-4 md:p-6 text-center text-xs md:text-sm text-[var(--text-muted)]">
                        No {tab === "live" ? "real" : "demo"} accounts found.
                    </div>
                ) : (
                    accounts.map((acc) => (
                        <AccountRow key={acc._id} account={acc} />
                    ))
                )}
            </div>

            {/* ================= MOBILE STICKY CTA ================= */}
            <div className="fixed left-2 right-2 z-20 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/95 p-2 backdrop-blur md:hidden bottom-[max(0.5rem,env(safe-area-inset-bottom))]">
                <button
                    onClick={() =>
                        router.push("/dashboard/accounts/open")
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--foreground)]"
                >
                    <Plus size={16} />
                    Open account
                </button>
            </div>
            <div className="px-2 md:px-6 mt-4">
                <TipBanner
                    title="Account limit"
                    message="You can create up to 7 trading accounts in total. If you reach the limit, please contact support to manage or upgrade your accounts."
                />
            </div>
        </div>
    );
}
