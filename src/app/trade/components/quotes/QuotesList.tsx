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

const normalizeSymbol = (value: string) => String(value ?? "").trim().toUpperCase();
const compactSymbol = (value: string) =>
  normalizeSymbol(value)
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^XBT/, "BTC");

const hasValidBidAsk = (q: QuoteLiveState | undefined): q is QuoteLiveState => {
  if (!q) return false;
  const bid = Number(q.bid);
  const ask = Number(q.ask);
  return Number.isFinite(bid) && bid > 0 && Number.isFinite(ask) && ask > 0;
};

const getFallbackPrice = (q: QuoteLiveState): number | undefined => {
  const dayClose = Number(q.dayClose);
  if (Number.isFinite(dayClose) && dayClose > 0) return dayClose;
  const high = Number(q.high);
  if (Number.isFinite(high) && high > 0) return high;
  const low = Number(q.low);
  if (Number.isFinite(low) && low > 0) return low;
  return undefined;
};

const normalizeForDisplay = (q: QuoteLiveState): QuoteLiveState => {
  if (hasValidBidAsk(q)) return q;
  const fallback = getFallbackPrice(q);
  if (!fallback) return q;
  const next = { ...q };
  const fallbackText = String(fallback);
  if (!Number.isFinite(Number(next.bid)) || Number(next.bid) <= 0) next.bid = fallbackText;
  if (!Number.isFinite(Number(next.ask)) || Number(next.ask) <= 0) next.ask = fallbackText;
  if (typeof next.high !== "number") next.high = fallback;
  if (typeof next.low !== "number") next.low = fallback;
  return next;
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

  const watchlistSymbols = useMemo(
    () =>
      (watchlist ?? [])
        .map((item) => normalizeSymbol(item.code))
        .filter((symbol) => symbol.length > 0),
    [watchlist]
  );

  const quoteMap = useMemo(() => {
    const next = new Map<string, QuoteLiveState>();
    for (const q of Object.values(liveQuotes)) {
      if (!q || typeof q.symbol !== "string") continue;
      const symbol = normalizeSymbol(q.symbol);
      if (!symbol) continue;
      next.set(symbol, normalizeForDisplay(q));
    }
    return next;
  }, [liveQuotes]);

  const rows = useMemo(() => {
    const output: QuoteLiveState[] = [];
    const seen = new Set<string>();
    const compactLookup = new Map<string, QuoteLiveState>();

    for (const [symbol, q] of quoteMap.entries()) {
      const key = compactSymbol(symbol);
      if (!compactLookup.has(key)) {
        compactLookup.set(key, q);
      }
    }

    for (const symbol of watchlistSymbols) {
      const q =
        quoteMap.get(symbol) ??
        compactLookup.get(compactSymbol(symbol)) ??
        ({
          symbol,
          bid: "--",
          ask: "--",
          bidVolume: "--",
          askVolume: "--",
          bidDir: "same",
          askDir: "same",
        } as QuoteLiveState);
      const normalizedQSymbol = normalizeSymbol(q.symbol);
      if (seen.has(normalizedQSymbol)) continue;
      output.push(q);
      seen.add(normalizedQSymbol);
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
