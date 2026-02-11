"use client";

import { useMemo } from "react";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import { useRouter } from "next/navigation";
import TipBanner from "@/app/components/ui/TipBanner";

export default function AssetsPage() {
    const { data, isLoading } = useMyAccounts();
    
    const router = useRouter();

    const totalBalance = useMemo(() => {
        if (!data) return 0;
        return data
            .filter((acc: any) => acc.account_type === "live")
            .reduce((sum: number, acc: any) => sum + acc.balance, 0);
    }, [data]);


    if (isLoading) {
        return (
            <div className="p-6">
                <GlobalLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-4 md:p-6 space-y-6">

            {/* ================= HEADER ================= */}
            <h1 className="text-2xl font-semibold">Assets</h1>

            {/* ================= TOTAL ASSETS CARD ================= */}
            <div className="card p-6 rounded-2xl space-y-6">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    {/* LEFT SIDE */}
                    <div>
                        <p className="text-sm text-[var(--text-muted)]">
                            Total assets
                        </p>

                        <h2 className="text-4xl font-bold mt-2">
                            $ {totalBalance.toFixed(2)}
                        </h2>
                    </div>

                    {/* RIGHT SIDE BUTTONS */}
                    <div className="flex gap-3">

                        <button
                            onClick={() => router.push("/dashboard/payments/deposit")}
                            className="px-5 py-2 rounded-xl text-sm font-medium bg-[var(--primary)] text-[var(--text-invert)] transition hover:opacity-90"
                        >
                            Deposit
                        </button>

                        <button
                            onClick={() => router.push("/dashboard/payments/withdraw")}
                            className="px-5 py-2 rounded-xl text-sm font-medium border border-[var(--border-soft)] bg-[var(--bg-glass)] text-[var(--text-main)] transition hover:bg-[var(--bg-glass)]"
                        >
                            Withdraw
                        </button>

                    </div>
                </div>

                {/* ACCOUNT SUMMARY GRID */}
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-4">
                    {data?.map((acc: any) => {
                        const isLive = acc.account_type === "live";

                        return (
                            <div
                                key={acc._id}
                                onClick={() => router.push(`/trade/${acc.account_number}`)}
                                className={`rounded-xl border p-4 cursor-pointer transition relative overflow-hidden
          ${isLive
                                        ? "border-[var(--primary)] bg-[var(--bg-glass)] hover:shadow-lg"
                                        : "border-[var(--border-soft)] bg-[var(--bg-main)] opacity-80"
                                    }
        `}
                            >
                                {/* ACCOUNT TYPE BADGE */}
                                <span
                                    className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full font-medium
            ${isLive
                                            ? "bg-[var(--primary)] text-[var(--text-invert)]"
                                            : "bg-[var(--bg-glass)] text-[var(--text-muted)]"
                                        }
          `}
                                >
                                    {isLive ? "LIVE" : "DEMO"}
                                </span>

                                {/* PLAN NAME */}
                                <p className="text-xs text-[var(--text-muted)] pr-14">
                                    {acc.plan_name}{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/trade-login?account=${encodeURIComponent(acc.account_number)}`);
                                        }}
                                        className="mt-1 ml-0 block w-full break-all text-[var(--primary)] hover:underline"
                                    >
                                        {acc.account_number}
                                    </button>
                                </p>

                                {/* BALANCE */}
                                <p className="text-xl font-semibold mt-2 break-words">
                                    $ {acc.balance.toFixed(2)}
                                </p>

                                {/* ACCOUNT LABEL */}
                                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                                    {isLive ? "Real trading account" : "Practice trading account"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================= FAQ / TIPS ================= */}
            
            <div className="space-y-3 mb-6">
                    <TipBanner
                      title="How are total assets calculated?"
                      message="Total assets are calculated by summing the balances of all your
                        trading accounts including all live accounts."
                    />
                  
                    <TipBanner
                      title="Why does my balance change?"
                      message="Your balance updates in real-time based on deposits, withdrawals,
                        and active trading positions."
                    />
                  
                    <TipBanner
                      title="How can I increase my assets?"
                      message=" You can increase your assets by depositing funds or generating
                        profits through trading strategies."
                    />
                  </div>

        </div>
    );
}
