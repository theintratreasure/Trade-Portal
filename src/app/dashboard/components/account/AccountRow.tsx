"use client";

import { useState, useEffect, useRef } from "react";
import {
    ChevronDown,
    ArrowDownCircle,
    ArrowUpCircle,
    BarChart3,
    RefreshCw,
} from "lucide-react";
import { useAccountById } from "@/hooks/accounts/useAccountById";
import AccountDetails from "./AccountDetails";
import { useRouter } from "next/navigation";
import { Toast } from "@/app/components/ui/Toast";
import { useResetDemoAccount } from "@/hooks/useResetDemoAccount";
import { useResetTradePassword } from "@/hooks/trade/useResetTradePassword";
import { useResetWatchPassword } from "@/hooks/trade/useResetWatchPassword";
import ConfirmModal from "@/app/components/ui/ConfirmModal";

export default function AccountRow({
    account,
}: {
    account: {
        _id: string;
        account_number: string;
        plan_name: string;
        balance: number;
        currency: string;
        account_type: string;
    };
}) {
    const [open, setOpen] = useState(false);
    const { data, isLoading } = useAccountById(account._id, open);
    const router = useRouter();
    const resetDemo = useResetDemoAccount();
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const isDemo = account.account_type === "demo";
    const [passwordModal, setPasswordModal] = useState<{
        type: "trade" | "watch" | null;
    }>({ type: null });
    const [newPassword, setNewPassword] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const resetTrade = useResetTradePassword();
    const resetWatch = useResetWatchPassword();
    const [showActions, setShowActions] = useState(false);
    const actionsWrapRef = useRef<HTMLDivElement | null>(null);
    const secondaryBtnClass =
        "h-10 min-w-[92px] rounded-md bg-[var(--bg-glass)] px-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card)]";
    const tradeBtnClass =
        "h-10 min-w-[78px] rounded-md bg-yellow-400 px-3 text-sm font-semibold text-black transition hover:brightness-95";

    const handleSubmitPassword = () => {
        if (!newPassword.trim()) {
            setToast({ message: "Please enter new password", type: "error" });
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmReset = async () => {
        try {
            if (passwordModal.type === "trade") {
                await resetTrade.mutateAsync({
                    accountId: account._id,
                    newPassword,
                });
            } else if (passwordModal.type === "watch") {
                await resetWatch.mutateAsync({
                    accountId: account._id,
                    newPassword,
                });
            }

            setToast({ message: "Email will be sent to you", type: "success" });
            setPasswordModal({ type: null });
            setShowConfirm(false);
            setNewPassword("");
        } catch (err: unknown) {
            const error = err as {
                response?: { data?: { message?: string } };
            };
            setShowConfirm(false);
            setToast({
                message:
                    error?.response?.data?.message || "Failed to reset password",
                type: "error",
            });
        }
    };


    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (!showActions) return;
            const target = event.target as Node;
            if (actionsWrapRef.current && !actionsWrapRef.current.contains(target)) {
                setShowActions(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [showActions]);

    const handleResetDemo = async () => {
        try {
            await resetDemo.mutateAsync(account._id);
            setToast({ message: "Demo balance reset successfully", type: "success" });
        } catch (err: unknown) {
            const error = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to reset demo balance";
            setToast({ message, type: "error" });
        }
    };

    return (
        <div className="card">
            {/* ================= MOBILE VIEW ================= */}
            <div className="lg:hidden p-2 md:p-4 space-y-3">
                {/* HEADER */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                        <span className="rounded bg-[var(--bg-glass)] text-[var(--success)] px-1.5 py-0.5">
                            {account.account_type === "live" ? "Live" : "Demo"}
                        </span>
                        <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] break-words leading-tight">
                            {account.plan_name}
                        </div>
                    </div>

                    <button onClick={() => setOpen(!open)}>
                        <ChevronDown
                            size={18}
                            className={`transition ${open ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* ACCOUNT NUMBER */}
                <div className="text-sm font-semibold break-all leading-tight">
                    {account.account_number}
                </div>

                {/* BALANCE */}
                <div className="text-lg sm:text-xl font-semibold leading-tight">
                    {account.balance.toFixed(2)}{" "}
                    <span className="text-xs font-normal">
                        {account.currency}
                    </span>
                </div>

                {/* ACTIONS */}
                <div
                    className={`grid gap-2 text-center ${isDemo ? "grid-cols-4" : "grid-cols-5"
                        }`}
                >
                    <Action
                        icon={<BarChart3 />}
                        label="Trade"
                        active
                        onClick={() =>
                            router.push(
                                `/trade-login?account=${encodeURIComponent(account.account_number)}`
                            )
                        }
                    />

                    {isDemo ? (
                        <>
                            <Action
                                icon={<RefreshCw />}
                                label={resetDemo.isPending ? "Resetting..." : "Reset Demo"}
                                onClick={handleResetDemo}
                                disabled={resetDemo.isPending}
                            />
                            <Action
                                icon={<RefreshCw />}
                                label="Reset Trade"
                                onClick={() => setPasswordModal({ type: "trade" })}
                            />

                            <Action
                                icon={<RefreshCw />}
                                label="Reset Investor"
                                onClick={() => setPasswordModal({ type: "watch" })}
                            />
                        </>

                    ) : (
                        <>
                            <Action
                                icon={<ArrowDownCircle />}
                                label="Deposit"
                                onClick={() =>
                                    router.push(`/dashboard/payments/deposit?account=${account._id}`)
                                }
                            />
                            <Action
                                icon={<ArrowUpCircle />}
                                label="Withdraw"
                                onClick={() =>
                                    router.push(`/dashboard/payments/withdraw?account=${account._id}`)
                                }
                            />
                            <Action
                                icon={<RefreshCw />}
                                label="Reset Trade"
                                onClick={() => setPasswordModal({ type: "trade" })}
                            />

                            <Action
                                icon={<RefreshCw />}
                                label="Reset Investor"
                                onClick={() => setPasswordModal({ type: "watch" })}
                            />
                        </>
                    )}
                </div>

                {/* DETAILS */}
                {open && (
                    <div className="mt-3">
                        {isLoading ? (
                            <div className="text-xs text-[var(--text-muted)]">
                                Loading account details…
                            </div>
                        ) : (
                            data && (
                                <div className="rounded-xl bg-[var(--bg-glass)] p-2.5">
                                    <AccountDetails data={data} />
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* ================= DESKTOP VIEW ================= */}
            <div className="hidden lg:block px-6 py-5">
                <div className="flex flex-wrap items-center gap-4">
                    {/* LEFT */}
                    <div className="min-w-[260px] flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap rounded bg-[var(--bg-glass)] px-2 py-1 text-xs text-[var(--success)]">
                                {account.account_type === "live" ? "Live" : "Demo"}
                            </span>
                            <span className="text-sm uppercase tracking-wide text-[var(--text-muted)] leading-tight">
                                {account.plan_name}
                            </span>
                        </div>
                        <div className="text-base lg:text-lg font-semibold leading-tight whitespace-nowrap">
                            {account.account_number}
                        </div>
                    </div>

                    {/* CENTER */}
                    <div className="w-[220px] shrink-0 text-left xl:text-center text-lg font-semibold lg:text-xl whitespace-nowrap">
                        $ {account.balance.toFixed(2)}{" "}
                        <span className="text-sm font-normal">
                            {account.currency}
                        </span>
                    </div>

                    {/* RIGHT */}
                    <div
                        ref={actionsWrapRef}
                        className="relative ml-auto flex flex-wrap xl:flex-nowrap items-center justify-end gap-2"
                    >
                        <button
                            onClick={() =>
                                router.push(
                                    `/trade-login?account=${encodeURIComponent(account.account_number)}`
                                )
                            }
                            className={tradeBtnClass}
                        >
                            Trade
                        </button>

                        {!isDemo && (
                            <>
                                <button
                                    onClick={() =>
                                        router.push(`/dashboard/payments/deposit?account=${account._id}`)
                                    }
                                    className={secondaryBtnClass}
                                >
                                    Deposit
                                </button>

                                <button
                                    onClick={() =>
                                        router.push(`/dashboard/payments/withdraw?account=${account._id}`)
                                    }
                                    className={secondaryBtnClass}
                                >
                                    Withdraw
                                </button>
                                 <div className="relative">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className={secondaryBtnClass}
                                >
                                    More
                                </button>

                                {showActions && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[var(--bg-card)] shadow-lg border border-[var(--border-soft)] z-[999]">
                                        <button
                                            onClick={() => {
                                                setPasswordModal({ type: "trade" });
                                                setShowActions(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-glass)]"
                                        >
                                            Reset Trade Password
                                        </button>

                                        <button
                                            onClick={() => {
                                                setPasswordModal({ type: "watch" });
                                                setShowActions(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-glass)]"
                                        >
                                            Reset Investor Password
                                        </button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}

                        {/* More Actions */}
                        {isDemo && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className={secondaryBtnClass}
                                >
                                    More
                                </button>

                                {showActions && (
                                    <div className="absolute right-0 mt-2 w-48 z-[99] rounded-lg bg-[var(--bg-card)] shadow-lg border border-[var(--border-soft)]">
                                        <button
                                            onClick={() => {
                                                setPasswordModal({ type: "trade" });
                                                setShowActions(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-glass)]"
                                        >
                                            Reset Trade Password
                                        </button>

                                        <button
                                            onClick={() => {
                                                setPasswordModal({ type: "watch" });
                                                setShowActions(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-glass)]"
                                        >
                                            Reset Investor Password
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setOpen(!open)}
                            className="grid h-10 w-10 place-items-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
                        >
                            <ChevronDown
                                size={18}
                                className={`transition ${open ? "rotate-180" : ""}`}
                            />
                        </button>
                    </div>

                </div>

                {open && (
                    <div className="animate-dropdown mt-4">
                        {isLoading ? (
                            <div className="text-sm text-[var(--text-muted)]">
                                Loading account details…
                            </div>
                        ) : (
                            data && <AccountDetails data={data} />
                        )}
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {passwordModal.type && (
                <div
                    className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40"
                    onClick={() => {
                        setPasswordModal({ type: null });
                        setNewPassword("");
                    }}
                >
                    <div
                        className="w-[90%] max-w-sm rounded-xl bg-[var(--bg-card)] p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold">
                            Reset {passwordModal.type === "trade" ? "Trade" : "Investor"} Password
                        </h2>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="mt-4 w-full rounded-md bg-[var(--bg-glass)] px-3 py-2 text-sm outline-none"
                        />

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setPasswordModal({ type: null });
                                    setNewPassword("");
                                }}
                                className="rounded-md px-4 py-2 text-sm bg-[var(--bg-glass)]"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSubmitPassword}
                                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--text-main)]"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showConfirm && (
                <ConfirmModal
                    title="Confirm Reset"
                    description="Are you sure you want to reset this password?"
                    loading={
                        resetTrade.isPending || resetWatch.isPending
                    }
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={handleConfirmReset}
                />
            )}

        </div>
    );
}

/* ================= HELPERS ================= */

function Action({
    icon,
    label,
    active,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <div
            onClick={disabled ? undefined : onClick}
            className={`flex flex-col items-center gap-1 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
        >
            <div
                className={`flex h-9 w-9 items-center justify-center rounded-full [&_svg]:h-4 [&_svg]:w-4 ${active
                    ? "bg-yellow-400 text-black"
                    : "bg-[var(--bg-glass)]"
                    }`}
            >
                {icon}
            </div>
            <span className="text-[10px] leading-tight">{label}</span>
        </div>
    );
}
