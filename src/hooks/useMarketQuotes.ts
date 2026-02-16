"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarketSocket } from "@/services/marketSocket.service";
import { WatchlistItem } from "@/services/watchlist.service";
import { QuoteLiveState } from "@/types/market";
import { useWatchlist } from "./watchlist/useWatchlist";

type QuoteMap = Record<string, QuoteLiveState | undefined>;
type QuoteListener = (quotes: QuoteMap) => void;

const shared = {
  socket: null as MarketSocket | null,
  token: null as string | null,
  accountId: null as string | null,
  buffer: {} as QuoteMap,
  listeners: new Set<QuoteListener>(),
  symbolRefCounts: new Map<string, number>(),
  flushTimer: null as number | null,
};

const QUOTES_FAST_FLUSH_INTERVAL_MS = 50;

function getNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function getPlaceholder(symbol: string): QuoteLiveState {
  return {
    symbol,
    bid: "--",
    ask: "--",
    bidVolume: "--",
    askVolume: "--",
    bidDir: "same",
    askDir: "same",
  } as unknown as QuoteLiveState;
}

function emitQuotes() {
  const snapshot = { ...shared.buffer };
  shared.listeners.forEach((listener) => listener(snapshot));
}

function scheduleEmit() {
  if (shared.flushTimer) return;
  shared.flushTimer = window.setTimeout(() => {
    shared.flushTimer = null;
    emitQuotes();
  }, QUOTES_FAST_FLUSH_INTERVAL_MS);
}

function handleIncomingQuote(msg: unknown) {
  try {
    const payload = (msg ?? {}) as Record<string, unknown>;
    const nestedData =
      payload.data && typeof payload.data === "object"
        ? (payload.data as Record<string, unknown>)
        : undefined;

    if (payload.status === "subscribed" && typeof payload.symbol === "string") {
      const sym = payload.symbol;
      const cur = shared.buffer[sym];
      if (!cur) return;

      const dayHigh = getNumber(
        payload.dayHigh,
        payload.day_high,
        payload.high,
        payload.h,
        nestedData?.dayHigh,
        nestedData?.day_high,
        nestedData?.high,
        nestedData?.h
      );
      const dayLow = getNumber(
        payload.dayLow,
        payload.day_low,
        payload.low,
        payload.l,
        nestedData?.dayLow,
        nestedData?.day_low,
        nestedData?.low,
        nestedData?.l
      );
      const dayOpen = getNumber(
        payload.dayOpen,
        payload.day_open,
        nestedData?.dayOpen,
        nestedData?.day_open
      );
      const dayCloseNum = getNumber(
        payload.dayClose,
        payload.day_close,
        nestedData?.dayClose,
        nestedData?.day_close
      );
      const dayClose = dayCloseNum !== undefined ? String(dayCloseNum) : cur.bid;

      shared.buffer[sym] = {
        ...cur,
        high: dayHigh ?? cur.high,
        low: dayLow ?? cur.low,
        dayOpen: dayOpen ?? cur.dayOpen,
        dayClose: dayCloseNum ?? cur.dayClose,
        bid: dayClose,
        ask: dayClose,
        bidDir: "same",
        askDir: "same",
      };
      scheduleEmit();
      return;
    }

    if (
      payload.type === "orderbook" &&
      nestedData &&
      typeof nestedData.code === "string"
    ) {
      const symbol = nestedData.code;
      const bids = Array.isArray(nestedData.bids)
        ? (nestedData.bids as Array<Record<string, unknown>>)
        : [];
      const asks = Array.isArray(nestedData.asks)
        ? (nestedData.asks as Array<Record<string, unknown>>)
        : [];
      const bid = bids[0];
      const ask = asks[0];

      if (!bid || !ask || Number(bid.price) <= 0 || Number(ask.price) <= 0) return;

      if (!shared.buffer[symbol]) {
        shared.buffer[symbol] = getPlaceholder(symbol);
      }

      const old = shared.buffer[symbol] as QuoteLiveState;
      const currentPrice = Number(bid.price);
      const dayClose = typeof old.dayClose === "number" ? old.dayClose : 0;

      const dayHigh = getNumber(
        nestedData.dayHigh,
        nestedData.day_high,
        nestedData.high,
        nestedData.h,
        payload.dayHigh,
        payload.day_high,
        payload.high,
        payload.h
      );
      const dayLow = getNumber(
        nestedData.dayLow,
        nestedData.day_low,
        nestedData.low,
        nestedData.l,
        payload.dayLow,
        payload.day_low,
        payload.low,
        payload.l
      );

      const nextHigh =
        dayHigh ?? (typeof old.high === "number" ? Math.max(old.high, currentPrice) : currentPrice);
      const nextLow =
        dayLow ?? (typeof old.low === "number" ? Math.min(old.low, currentPrice) : currentPrice);

      const tickTime = nestedData.tick_time
        ? new Date(Number(nestedData.tick_time)).toLocaleTimeString("en-US", {
            hour12: false,
          })
        : undefined;

      let change = 0;
      let changePercent = 0;
      if (dayClose > 0) {
        change = currentPrice - dayClose;
        changePercent = (change / dayClose) * 100;
      }

      shared.buffer[symbol] = {
        ...old,
        bid: String(bid.price),
        ask: String(ask.price),
        bidVolume: String(bid.volume ?? "--"),
        askVolume: String(ask.volume ?? "--"),
        tickTime,
        change,
        changePercent,
        high: nextHigh,
        low: nextLow,
        bidDir:
          old.bid === "--"
            ? "same"
            : currentPrice > Number(old.bid)
            ? "up"
            : currentPrice < Number(old.bid)
            ? "down"
            : old.bidDir,
        askDir:
          old.ask === "--"
            ? "same"
            : Number(ask.price) > Number(old.ask)
            ? "up"
            : Number(ask.price) < Number(old.ask)
            ? "down"
            : old.askDir,
      } as QuoteLiveState;

      scheduleEmit();
    }
  } catch (error) {
    console.warn("[useMarketQuotes] message handler error", error);
  }
}

function ensureSocket(token: string, accountId: string) {
  if (shared.socket && shared.token === token) {
    shared.accountId = accountId || null;
    shared.socket.setAccountId(accountId || undefined);
    return;
  }

  if (shared.socket) {
    shared.socket.close();
    shared.socket = null;
  }

  shared.token = token;
  shared.accountId = accountId || null;
  shared.buffer = {};

  for (const [symbol, count] of shared.symbolRefCounts) {
    if (count > 0) {
      shared.buffer[symbol] = getPlaceholder(symbol);
    }
  }

  const socket = new MarketSocket();
  shared.socket = socket;
  socket.connect(token, handleIncomingQuote, accountId || undefined);

  for (const [symbol, count] of shared.symbolRefCounts) {
    if (count > 0) {
      socket.subscribe(symbol);
    }
  }

  scheduleEmit();
}

function getCookieValue(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const token = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return token ? decodeURIComponent(token.slice(prefix.length)) : "";
}

function getEffectiveAccountId(): string {
  const fromCookie = getCookieValue("accountId");
  if (fromCookie) return fromCookie;
  if (typeof window !== "undefined") {
    return localStorage.getItem("tradeAccountId") ?? "";
  }
  return "";
}

function subscribeSymbol(symbol: string) {
  const currentCount = shared.symbolRefCounts.get(symbol) ?? 0;
  shared.symbolRefCounts.set(symbol, currentCount + 1);

  if (currentCount === 0) {
    shared.buffer[symbol] = shared.buffer[symbol] ?? getPlaceholder(symbol);
    shared.socket?.subscribe(symbol);
    scheduleEmit();
  }
}

function unsubscribeSymbol(symbol: string) {
  const currentCount = shared.symbolRefCounts.get(symbol) ?? 0;
  if (currentCount <= 1) {
    shared.symbolRefCounts.delete(symbol);
    shared.socket?.unsubscribe(symbol);
    delete shared.buffer[symbol];
    scheduleEmit();
    return;
  }
  shared.symbolRefCounts.set(symbol, currentCount - 1);
}

function addListener(listener: QuoteListener) {
  shared.listeners.add(listener);
  listener({ ...shared.buffer });
}

function removeListener(listener: QuoteListener) {
  shared.listeners.delete(listener);
  if (shared.listeners.size === 0 && shared.symbolRefCounts.size === 0) {
    shared.socket?.close();
    shared.socket = null;
    shared.token = null;
    shared.buffer = {};
  }
}

export function useMarketQuotes(token?: string, extraSymbols: string[] = []) {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [accountId, setAccountId] = useState<string>(() => getEffectiveAccountId());
  const { data: watchlist } = useWatchlist();
  const ownedSymbolsRef = useRef<Set<string>>(new Set());
  const listenerRef = useRef<QuoteListener>((snapshot) => setQuotes(snapshot));

  const desiredSymbols = useMemo(() => {
    const watchlistSymbols = (watchlist ?? [])
      .map((w: WatchlistItem) => w?.code)
      .filter((code): code is string => typeof code === "string" && code.length > 0);
    const manualSymbols = (extraSymbols ?? []).filter(
      (code): code is string => typeof code === "string" && code.length > 0
    );
    return Array.from(new Set([...watchlistSymbols, ...manualSymbols]));
  }, [extraSymbols, watchlist]);

  useEffect(() => {
    const syncAccountId = () => {
      const next = getEffectiveAccountId();
      setAccountId((prev) => (prev === next ? prev : next));
    };

    syncAccountId();
    window.addEventListener("focus", syncAccountId);
    window.addEventListener("trade-account-change", syncAccountId);
    return () => {
      window.removeEventListener("focus", syncAccountId);
      window.removeEventListener("trade-account-change", syncAccountId);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setQuotes({}));
      return;
    }

    ensureSocket(token, accountId);
    const listener = listenerRef.current;
    addListener(listener);

    return () => {
      removeListener(listener);
    };
  }, [accountId, token]);

  useEffect(() => {
    if (!token) {
      for (const symbol of ownedSymbolsRef.current) {
        unsubscribeSymbol(symbol);
      }
      ownedSymbolsRef.current.clear();
      return;
    }

    const nextSet = new Set(desiredSymbols);
    const prevSet = ownedSymbolsRef.current;

    for (const symbol of nextSet) {
      if (!prevSet.has(symbol)) {
        subscribeSymbol(symbol);
      }
    }

    for (const symbol of prevSet) {
      if (!nextSet.has(symbol)) {
        unsubscribeSymbol(symbol);
      }
    }

    ownedSymbolsRef.current = nextSet;
  }, [desiredSymbols, token]);

  useEffect(() => {
    return () => {
      for (const symbol of ownedSymbolsRef.current) {
        unsubscribeSymbol(symbol);
      }
      ownedSymbolsRef.current.clear();
    };
  }, []);

  return token ? quotes : {};
}
