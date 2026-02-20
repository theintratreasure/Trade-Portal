// components/quotes/QuotesList.tsx
"use client";

import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import QuoteRow from "./QuoteRow";
import { QuoteLiveState } from "@/types/market";
import { useEffect, useMemo, useState } from "react";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";
import { useWatchlist } from "@/hooks/watchlist/useWatchlist";

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
  const { data: watchlist } = useWatchlist();

  const normalize = (value: string) => String(value ?? "").trim().toUpperCase();
  const hasValidBidAsk = (q: QuoteLiveState | undefined): q is QuoteLiveState => {
    if (!q) return false;
    const bid = Number(q.bid);
    const ask = Number(q.ask);
    return Number.isFinite(bid) && bid > 0 && Number.isFinite(ask) && ask > 0;
  };

  const watchlistSymbols = useMemo(
    () =>
      (watchlist ?? [])
        .map((item) => normalize(item.code))
        .filter((symbol) => symbol.length > 0),
    [watchlist]
  );

  const quoteMap = useMemo(() => {
    const next = new Map<string, QuoteLiveState>();
    for (const q of Object.values(liveQuotes)) {
      if (!q || typeof q.symbol !== "string") continue;
      const symbol = normalize(q.symbol);
      if (!symbol) continue;
      if (!hasValidBidAsk(q)) continue;
      next.set(symbol, q);
    }
    return next;
  }, [liveQuotes]);

  const rows = useMemo(() => {
    const watchlistReady =
      watchlistSymbols.length === 0 || watchlistSymbols.every((symbol) => quoteMap.has(symbol));
    if (!watchlistReady) {
      return [];
    }

    const output: QuoteLiveState[] = [];
    const seen = new Set<string>();

    for (const symbol of watchlistSymbols) {
      const q = quoteMap.get(symbol);
      if (!q) continue;
      output.push(q);
      seen.add(symbol);
    }

    for (const [symbol, q] of quoteMap.entries()) {
      if (seen.has(symbol)) continue;
      output.push(q);
      seen.add(symbol);
    }

    return output;
  }, [quoteMap, watchlistSymbols]);

  return (
    <div className="pb-[64px] overflow-x-hidden">
      {viewMode === "simple" && (
        <div className="px-2 md:px-0 pt-2 pb-1 border-b border-[var(--border-soft)]">
          <div className="grid grid-cols-[minmax(72px,1fr)_minmax(82px,auto)_minmax(82px,auto)] items-center gap-2 text-[11px] max-[360px]:text-[10px] text-[var(--text-muted)] uppercase">
            <div className="truncate">Symbol</div>
            <div className="text-right">Bid</div>
            <div className="text-right">Ask</div>
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
