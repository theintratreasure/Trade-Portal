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
import { setClientCookie, setTradeTokenCookie } from "@/lib/tradeToken";

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
    password: prefetchedAccount?.password || rememberedDefault?.password || "",
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
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loginWithCredentials = useCallback(
    (accountNumber: string, password: string) => {
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

            setTradeTokenCookie(tradeToken, 43200);
            setClientCookie("sessionType", String(res.sessionType), 43200);
            setClientCookie("accountId", String(accountId), 43200);
            if (typeof window !== "undefined") {
              localStorage.setItem("tradeAccountId", String(accountId));
              window.dispatchEvent(new Event("trade-account-change"));
            }

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
            router.replace("/trade");
            router.refresh();
          },
          onError: () => {
            setToast("Invalid account credentials");
          },
        }
      );
    },
    [queryClient, router, savePassword, tradeLogin]
  );

  const handleTradeLogin = () => {
    const accountNumber =
      form.account_number || accountParam || rememberedDefault?.account_number || "";
    const password = form.password || prefetchedAccount?.password || rememberedDefault?.password || "";
    loginWithCredentials(accountNumber, password);
  };

  return (
    <>
      <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-4 py-8 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-[var(--primary)] opacity-20 blur-[170px] animate-auth-orb-a" />
        <div className="pointer-events-none absolute bottom-[-220px] right-[-220px] h-[640px] w-[640px] rounded-full bg-[var(--primary)] opacity-12 blur-[190px] animate-auth-orb-b" />

        <div className="w-full max-w-md py-6">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-[0_24px_64px_rgba(15,23,42,0.14)] animate-auth-card-in">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,var(--primary-glow),transparent)] opacity-50" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between gap-2">
                <BackButton  />
                <button
                  onClick={() => router.push("/")}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] h-10 w-10 transition hover:bg-[var(--bg-glass)]"
                  aria-label="Go home"
                >
                  <Home size={18} />
                </button>
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-[26px] leading-tight font-semibold tracking-wide text-[var(--text-main)]">
                  Trade Login
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Connect your trading account securely
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-plan)] px-3 py-3">
                  <label className="block text-[12px] text-[var(--text-muted)] mb-2">Login</label>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-[var(--text-muted)]" />
                    <input
                      value={form.account_number}
                      onChange={(e) => updateForm("account_number", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTradeLogin();
                      }}
                      placeholder="Enter login"
                      className="trade-auth-input w-full bg-transparent outline-none text-[15px]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-plan)] px-3 py-3">
                  <label className="block text-[12px] text-[var(--text-muted)] mb-2">Password</label>
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
                      className="trade-auth-input w-full bg-transparent outline-none text-[15px]"
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

                <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-plan)] px-3 py-2.5">
                  <span className="text-[13px] text-[var(--text-muted)]">Save password</span>
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
                    className={`relative h-6 w-11 rounded-full transition ${
                      savePassword ? "bg-[var(--primary)]" : "bg-[var(--bg-glass)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        savePassword ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={handleTradeLogin}
                disabled={tradeLogin.isPending}
                className="w-full rounded-xl py-3.5 font-semibold tracking-wide bg-[var(--primary)] text-[var(--text-invert)] hover:shadow-[0_0_32px_var(--primary-glow)] transition disabled:opacity-60"
              >
                {tradeLogin.isPending ? "Signing in..." : "LOGIN"}
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-4 right-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] px-4 py-2 shadow-xl">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
