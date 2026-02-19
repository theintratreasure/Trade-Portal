"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TradeSidebarProvider } from "./components/layout/TradeSidebarContext";
import TradeBottomNav from "./components/layout/TradeBottomNav";
import TradeSidebar from "./components/layout/TradeSidebar";
import { TradeDesktopProvider, useTradeDesktop } from "./components/desktop/TradeDesktopContext";
import TradeDesktopSidebar from "./components/desktop/TradeDesktopSidebar";
import TradeQuotesPanel from "./components/desktop/TradeQuotesPanel";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { LanguageProvider } from "./components/LanguageProvider";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";
import GlobalLoader from "../components/ui/GlobalLoader";

const TRADE_AUTH_STATE_KEY = "trade-auth-state";
const TRADE_AUTH_LOGGED_OUT = "trade-logged-out";

export default function TradeLayoutClient({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <LanguageProvider>

            <TradeSidebarProvider>
                <TradeDesktopProvider>
                    <TradeLayoutInner>
                        {children}
                    </TradeLayoutInner>
                </TradeDesktopProvider>
            </TradeSidebarProvider>
        </LanguageProvider>
    );
}

function TradeLayoutInner({
    children,
}: {
    children: ReactNode;
}) {
    const router = useRouter();
    const { quotesOpen } = useTradeDesktop();
    useTradeAccount();// keep trade account cache warm globally
    const [isDesktop, setIsDesktop] = useState<boolean>(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasTradeToken, setHasTradeToken] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const ignoreNextPopRef = useRef(false);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const apply = () => setIsDesktop(mq.matches);
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, []);

    useEffect(() => {
        const syncAuth = () => {
            const token = getTradeTokenFromStorageSync();
            const isAuthed = Boolean(token);
            setHasTradeToken(isAuthed);
            setAuthChecked(true);
            if (!isAuthed) {
                if (typeof window !== "undefined") {
                    const tradeAuthState = localStorage.getItem(TRADE_AUTH_STATE_KEY);
                    router.replace(
                        tradeAuthState === TRADE_AUTH_LOGGED_OUT ? "/" : "/trade-login"
                    );
                } else {
                    router.replace("/trade-login");
                }
                return;
            }
        };

        syncAuth();
        window.addEventListener("focus", syncAuth);
        window.addEventListener("trade-token-change", syncAuth);
        return () => {
            window.removeEventListener("focus", syncAuth);
            window.removeEventListener("trade-token-change", syncAuth);
        };
    }, [router]);

    useEffect(() => {
        if (typeof window === "undefined" || !hasTradeToken) return;

        const onPopState = () => {
            if (ignoreNextPopRef.current) {
                ignoreNextPopRef.current = false;
                return;
            }

            const nextPath = window.location.pathname;
            if (nextPath.startsWith("/trade")) {
                return;
            }

            ignoreNextPopRef.current = true;
            window.history.go(1);
            setShowExitConfirm(true);
        };

        window.addEventListener("popstate", onPopState);
        return () => {
            window.removeEventListener("popstate", onPopState);
        };
    }, [hasTradeToken]);

    const stayInTradePanel = () => {
        setShowExitConfirm(false);
    };

    const closeTradePanel = () => {
        setShowExitConfirm(false);
        ignoreNextPopRef.current = true;
        window.history.back();
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const refreshAfterResume = () => {
            if (document.visibilityState === "hidden") return;

            const scrollers = document.querySelectorAll<HTMLElement>(".ios-momentum-scroll");
            scrollers.forEach((el) => {
                const top = el.scrollTop;
                el.style.setProperty("-webkit-overflow-scrolling", "auto");
                // Force reflow to fix iOS frozen scroll containers after app resume.
                void el.offsetHeight;
                el.style.setProperty("-webkit-overflow-scrolling", "touch");
                el.scrollTop = top;
            });

            window.requestAnimationFrame(() => {
                window.dispatchEvent(new Event("resize"));
            });
        };

        window.addEventListener("pageshow", refreshAfterResume);
        window.addEventListener("focus", refreshAfterResume);
        document.addEventListener("visibilitychange", refreshAfterResume);

        return () => {
            window.removeEventListener("pageshow", refreshAfterResume);
            window.removeEventListener("focus", refreshAfterResume);
            document.removeEventListener("visibilitychange", refreshAfterResume);
        };
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const html = document.documentElement;
        const body = document.body;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;

        // Keep a single scroll container inside trade layout to avoid double scrollbars.
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
        };
    }, []);

    if (!authChecked || !hasTradeToken) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-plan)]">
                <GlobalLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen mt-font mt-numbers bg-[var(--bg-plan)] md:bg-[var(--bg-card)]">
            {!isDesktop ? (
                <div className="flex h-[100dvh] min-h-0 flex-col">
                    <div id="trade-topbar-slot" />

                    <main
                        data-trade-main-scroll
                        className="mt-14 min-h-0 flex-1 overflow-y-auto ios-momentum-scroll hide-scrollbar pb-[64px]"
                    >
                        {children}
                    </main>

                    <TradeBottomNav />
                    <TradeSidebar />
                </div>
            ) : (
                <div className="flex h-screen min-h-0 w-full overflow-hidden bg-[var(--bg-plan)]">
                    <div className="w-[68px] shrink-0 border-r border-[var(--border-soft)]">
                        <TradeDesktopSidebar />
                    </div>

                    <div
                        className={`
                          transition-all duration-300 ease-in-out
                          ${quotesOpen ? "w-[340px]" : "w-0"}
                          shrink-0 overflow-hidden
                          ${quotesOpen ? "border-r border-[var(--border-soft)]" : ""}
                        `}
                    >
                        {quotesOpen && <TradeQuotesPanel />}
                    </div>

                    <main
                        data-trade-main-scroll
                        className="min-h-0 flex-1 min-w-0 overflow-y-auto ios-momentum-scroll bg-[var(--bg-card)]"
                    >
                        {children}
                    </main>
                </div>
            )}

            {showExitConfirm && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-plan)] p-5 shadow-[0_18px_46px_rgba(15,23,42,0.35)] md:bg-[var(--bg-card)]">
                        <h3 className="text-base font-semibold text-[var(--text-main)]">
                            Close Trade Panel?
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                            Are you sure you want to close the trade panel and go back?
                        </p>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={stayInTradePanel}
                                className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:opacity-90"
                            >
                                Stay
                            </button>
                            <button
                                onClick={closeTradePanel}
                                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-90"
                            >
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
