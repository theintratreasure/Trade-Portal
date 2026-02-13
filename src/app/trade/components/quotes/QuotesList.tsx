// components/quotes/QuotesList.tsx
"use client";

import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import QuoteRow from "./QuoteRow";
import { QuoteLiveState } from "@/types/market";
import { useEffect, useMemo, useState } from "react";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";

type Props = {
  onSelect: (symbol: string) => void;
  viewMode: "advanced" | "simple";
};

export default function QuotesList({ onSelect, viewMode }: Props) {
  const [token, setToken] = useState<string | undefined>(() => {
    const next = getTradeTokenFromStorageSync();
    return next || undefined;
  });

  useEffect(() => {
    const syncToken = () => {
      const next = getTradeTokenFromStorageSync();
      setToken(next || undefined);
    };

    syncToken();
    window.addEventListener("focus", syncToken);
    window.addEventListener("trade-token-change", syncToken);
    return () => {
      window.removeEventListener("focus", syncToken);
      window.removeEventListener("trade-token-change", syncToken);
    };
  }, []);

  const liveQuotes = useMarketQuotes(token);

  // filter out undefined entries (TypeScript-safe)
  const rows = useMemo(
    () =>
      Object.values(liveQuotes).filter(
        (q): q is QuoteLiveState =>
          Boolean(
            q &&
              typeof q.symbol === "string" &&
              q.symbol.length > 0 &&
              Number.isFinite(Number(q.bid)) &&
              Number.isFinite(Number(q.ask)) &&
              Number(q.bid) > 0 &&
              Number(q.ask) > 0
          )
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
