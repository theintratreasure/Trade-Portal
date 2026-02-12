"use client";

import { ReactNode } from "react";
import { TradeSidebarProvider } from "./components/layout/TradeSidebarContext";
import TradeBottomNav from "./components/layout/TradeBottomNav";
import TradeSidebar from "./components/layout/TradeSidebar";
import { TradeDesktopProvider, useTradeDesktop } from "./components/desktop/TradeDesktopContext";
import TradeDesktopSidebar from "./components/desktop/TradeDesktopSidebar";
import TradeQuotesPanel from "./components/desktop/TradeQuotesPanel";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { LanguageProvider } from "./components/LanguageProvider";

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
    const { quotesOpen } = useTradeDesktop();
    const { data: account } = useTradeAccount();// comes from global state

    return (
        <div className="min-h-screen mt-font mt-numbers bg-[var(--bg-plan)] md:bg-[var(--bg-card)]">

            {/* ============ MOBILE / TABLET ============ */}
            <div className="md:hidden flex flex-col min-h-screen">
                <div id="trade-topbar-slot" />

                <main className="flex-1 overflow-y-auto pb-[64px] md:pb-0 mt-14">
                    {children}
                </main>

                <TradeBottomNav />

                <TradeSidebar />

            </div>

            {/* ============ DESKTOP ============ */}
<div className="hidden md:flex h-screen w-full overflow-hidden bg-[var(--bg-plan)]">

  {/* Sidebar */}
  <div className="w-[68px] shrink-0 border-r border-[var(--border-soft)]">
    <TradeDesktopSidebar />
  </div>

  {/* Quotes Panel */}
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

  {/* Main Content */}
  <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-card)]">
    {children}
  </main>

</div>

        </div>
    );
}
