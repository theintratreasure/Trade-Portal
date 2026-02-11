// components/quotes/QuotesList.tsx
"use client";

import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import QuoteRow from "./QuoteRow";
import { QuoteLiveState } from "@/types/market";
import { useMemo } from "react";

type Props = {
  onSelect: (symbol: string) => void;
  viewMode: "advanced" | "simple";
};

function getTradeTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const local = localStorage.getItem("accessToken");
  if (local) return local;
  const cookie = document.cookie
    .split("; ")
    .find((r) => r.trim().startsWith("tradeToken="));
  return cookie ? cookie.split("=")[1] : null;
}

export default function QuotesList({ onSelect, viewMode }: Props) {
  const token = useMemo(() => getTradeTokenFromStorage() ?? undefined, []);
  const liveQuotes = useMarketQuotes(token);

  // filter out undefined entries (TypeScript-safe)
  const rows = useMemo(
    () =>
      Object.values(liveQuotes).filter(
        (q): q is QuoteLiveState =>
          Boolean(q && typeof q.symbol === "string" && q.symbol.length > 0)
      ),
    [liveQuotes]
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
        <div
          key={q.symbol}
          onClick={() => onSelect(q.symbol)}
          className="cursor-pointer"
        >
          <QuoteRow live={q} viewMode={viewMode} />
        </div>
      ))}
    </div>
  );
}
