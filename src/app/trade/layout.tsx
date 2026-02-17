"use client";

import { ReactNode, useEffect, useState } from "react";
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
                router.replace("/trade-login");
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
                <div className="flex flex-col min-h-screen">
                    <div id="trade-topbar-slot" />

                    <main className="flex-1 overflow-y-auto pb-[64px] mt-14">
                        {children}
                    </main>

                    <TradeBottomNav />
                    <TradeSidebar />
                </div>
            ) : (
                <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-plan)]">
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

                    <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-card)]">
                        {children}
                    </main>
                </div>
            )}

        </div>
    );
}
