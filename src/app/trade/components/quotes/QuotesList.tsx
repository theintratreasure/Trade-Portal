// components/quotes/QuotesList.tsx
"use client";

import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import QuoteRow from "./QuoteRow";
import { QuoteLiveState } from "@/types/market";
import { useEffect, useState } from "react";

type Props = {
  onSelect: (symbol: string) => void;
  viewMode: "advanced" | "simple";
};

function getTradeTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const local = localStorage.getItem("accessToken");
  if (local) return local;
  const cookie = document.cookie.split("; ").find((r) => r.trim().startsWith("tradeToken="));
  return cookie ? cookie.split("=")[1] : null;
}

export default function QuotesList({ onSelect, }:Props) {
  const token = getTradeTokenFromStorage() ?? undefined;
  const liveQuotes = useMarketQuotes(token);
const [viewMode, setViewMode] = useState<"simple" | "advanced">("simple");

useEffect(() => {
  const saved = localStorage.getItem("trade-quote-view");
  if (saved === "simple" || saved === "advanced") {
    setViewMode(saved);
  }

  const handler = (e: any) => {
    setViewMode(e.detail);
  };

  window.addEventListener("trade-quote-view-change", handler);
  return () =>
    window.removeEventListener("trade-quote-view-change", handler);
}, []);

  // filter out undefined entries (TypeScript-safe)
  const rows = Object.values(liveQuotes).filter(
    (q): q is QuoteLiveState => !!q && !!(q as any).symbol
  );

  return (
    <div className="pb-[64px]">
      {viewMode === "simple" && (
        <div className="px-2 md:px-0 pt-2 pb-1 border-b border-[var(--border-soft)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] uppercase">
            <div>Symbol</div>
            <div className="flex gap-10">
              <div className="text-right min-w-[80px]">Bid</div>
              <div className="text-right min-w-[80px]">Ask</div>
            </div>
          </div>
        </div>
      )}
      {rows.map((q) => (
        <div key={q.symbol} onClick={() => onSelect(q.symbol)} className="cursor-pointer">
          
          <QuoteRow live={q} viewMode={viewMode} />
        </div>
      ))}
    </div>
  );
}
