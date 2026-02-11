"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Eye, EyeOff, Home } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTradeLogin } from "@/hooks/trade/useTradeLogin";
import BackButton from "../components/ui/BackButton";
import {
    clearDefaultRememberedTradeLogin,
    getDefaultRememberedTradeLogin,
    getSavedTradeAccount,
    removeTradeAccount,
    saveTradeAccount,
    setDefaultRememberedTradeLogin,
} from "@/lib/tradeLoginAccounts";

export default function TradeLogin() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const tradeLogin = useTradeLogin();
    const accountParam = searchParams.get("account") || "";
    const prefetchedAccount = accountParam ? getSavedTradeAccount(accountParam) : null;
    const rememberedDefault = getDefaultRememberedTradeLogin();

    const [form, setForm] = useState(() => ({
        account_number: accountParam || rememberedDefault?.account_number || "",
        password:
            prefetchedAccount?.password ||
            rememberedDefault?.password ||
            "",
    }));
    const [savePassword, setSavePassword] = useState(
        Boolean(prefetchedAccount?.password || rememberedDefault?.password)
    );
    const [showPassword, setShowPassword] = useState(false);

    const [toast, setToast] = useState<string | null>(null);

    const updateForm = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const loginWithCredentials = useCallback((accountNumber: string, password: string) => {
        if (!accountNumber || !password) {
            setToast("All fields are required");
            return;
        }

        tradeLogin.mutate(
            {
                account_number: accountNumber,
                password,
            },
            {
                onSuccess: (res) => {
                    const { tradeToken, accountId } = res;
                    console.log("LOGIN RESPONSE:", res);
                    document.cookie = `tradeToken=${tradeToken}; path=/; max-age=43200`;
                    document.cookie = `sessionType=${res.sessionType}; path=/; max-age=43200`;
                    document.cookie = `accountId=${accountId}; path=/; max-age=43200`;
                    if (typeof window !== "undefined") {
                        if (savePassword) {
                            saveTradeAccount(accountNumber, password);
                            setDefaultRememberedTradeLogin(accountNumber, password);
                        } else {
                            removeTradeAccount(accountNumber);
                            clearDefaultRememberedTradeLogin();
                        }
                    }

                    queryClient.removeQueries({ queryKey: ["trade-account"] });
                    queryClient.invalidateQueries({ queryKey: ["trade-account"] });
                    router.push("/trade");
                },

                onError: () => {
                    setToast("Invalid account credentials");
                },
            }
        );
    }, [queryClient, router, savePassword, tradeLogin]);

    const handleTradeLogin = () => {
        const accountNumber = form.account_number || accountParam || rememberedDefault?.account_number || "";
        const password = form.password || prefetchedAccount?.password || rememberedDefault?.password || "";
        loginWithCredentials(accountNumber, password);
    };

    return (
        <>
        <div className="min-h-screen bg-[var(--bg-plan)] md:bg-[var(--bg-main)] text-[var(--text-main)] px-4 flex items-center justify-center">
            <div className="w-full max-w-md md:max-w-3xl py-10">
                 <div className="flex gap-2">
               
                         <BackButton to="/" />
                         <button
                           onClick={() => router.push("/")}
                           className="inline-flex items-center gap-2 px-3 py-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] text-sm"
                         >
                           <Home size={18} />
                         </button>
                       </div>

                <div className="text-center font-semibold text-[18px] md:text-[20px] md:hidden">
                    Login to an existing account
                </div>

                <div className="mt-6 border border-[var(--border-soft)] rounded-2xl md:rounded-xl bg-[var(--bg-plan)] md:bg-[var(--bg-card)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                    <div className="hidden md:flex items-center justify-between px-6 py-3 bg-[var(--primary)] text-white">
                        <span className="text-sm font-medium">Trading accounts ALS Forex.</span>
                    </div>

                    <div className="md:flex">
                        <div className="md:w-full md:p-7 md:bg-[var(--bg-glass)]">
                            <div className="hidden md:block text-[16px] font-semibold text-[var(--text-main)] mb-4">
                                Connect to account
                            </div>

                    <div className="px-4 py-4 border-b border-[var(--border-soft)] md:px-0 md:py-0 md:border-b-0 md:grid md:grid-cols-[110px_1fr] md:items-center md:gap-4">
                        <label className="block text-[13px] text-[var(--text-muted)] mb-1">
                            Login
                        </label>
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-[var(--text-muted)]" />
                            <input
                                value={form.account_number}
                                onChange={(e) => updateForm("account_number", e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleTradeLogin();
                                }}
                                placeholder="Enter login"
                                className="trade-auth-input w-full bg-transparent outline-none text-[15px] py-2 border-b border-[var(--border-soft)] focus:border-[var(--primary)] md:bg-[var(--bg-card)] md:px-3 md:rounded-md md:border md:h-10"
                            />
                        </div>
                    </div>

                    <div className="px-4 py-4 border-b border-[var(--border-soft)] md:px-0 md:pt-4 md:pb-3 md:border-b-0 md:grid md:grid-cols-[110px_1fr] md:items-center md:gap-4">
                        <label className="block text-[13px] text-[var(--text-muted)] mb-1">
                            Password
                        </label>
                        <div className="flex items-center gap-2">
                            <Lock size={16} className="text-[var(--text-muted)]" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={(e) => updateForm("password", e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleTradeLogin();
                                }}
                                placeholder="Enter password"
                                className="trade-auth-input w-full bg-transparent outline-none text-[15px] py-2 border-b border-[var(--border-soft)] focus:border-[var(--primary)] md:bg-[var(--bg-card)] md:px-3 md:rounded-md md:border md:h-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="px-4 py-4 flex items-center justify-between bg-[var(--bg-plan)] md:bg-transparent rounded-b-2xl md:px-0 md:pt-3 md:pb-0 md:rounded-b-none">
                        <span className="text-[13px] text-[var(--text-muted)]">
                            Save password
                        </span>
                        <button
                            onClick={() =>
                                setSavePassword((prev) => {
                                    const next = !prev;
                                    if (!next && typeof window !== "undefined") {
                                        removeTradeAccount(form.account_number);
                                        clearDefaultRememberedTradeLogin();
                                    }
                                    return next;
                                })
                            }
                            aria-pressed={savePassword}
                            className={`h-6 w-6 rounded-md border flex items-center justify-center transition ${
                                savePassword
                                    ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                    : "border-[var(--border-soft)] text-[var(--text-muted)] bg-[var(--bg-card)]"
                            }`}
                        >
                            ✓
                        </button>
                    </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleTradeLogin}
                    disabled={tradeLogin.isPending}
                    className="mt-6 w-full rounded-full py-3 font-semibold tracking-wide bg-[var(--primary)] text-white shadow-sm disabled:opacity-60 md:rounded-md md:py-2.5 md:w-[220px] md:ml-auto md:block"
                >
                    {tradeLogin.isPending ? "Signing in..." : "LOGIN"}
                </button>
            </div>

            {toast && (
                <div className="fixed bottom-4 right-4 rounded-lg bg-[var(--primary)] text-[var(--text-main)] px-4 py-2 shadow-xl">
                    {toast}
                </div>
            )}
        </div>
        </>
    );
}
