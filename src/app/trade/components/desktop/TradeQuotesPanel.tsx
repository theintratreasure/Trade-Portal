"use client";

import { useTradeDesktop } from "./TradeDesktopContext";
import QuotesUI from "../quotes/QuotesUI";

export default function TradeQuotesPanel() {
  const { quotesOpen } = useTradeDesktop();

  return (
    <aside
      className={`
        hidden md:flex relative z-10 flex-col
        transition-all duration-300 ease-in-out
        h-[calc(100dvh)]
        ${quotesOpen ? "w-[340px] opacity-100 pointer-events-auto" : "w-0 opacity-0 pointer-events-none"}
      `}
      style={{
        background: "var(--bg-card)",
        overflow: "hidden",
        border: "1px solid var(--border-soft)",
        borderRadius: "16px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
      }}
    >
      {quotesOpen && (
        <div className="w-full h-full flex flex-col">
          {/* PANEL HEADER */}
          <div
            className="px-4 py- flex items-center justify-between"
            style={{
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
          </div>

          {/* PANEL CONTENT */}
          <div className="flex-1 overflow-y-auto px-2 ">
            <QuotesUI showTopBar />
          </div>
        </div>
      )}
    </aside>
  );
}
