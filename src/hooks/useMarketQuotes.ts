"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarketSocket } from "@/services/marketSocket.service";
import { WatchlistItem } from "@/services/watchlist.service";
import { QuoteLiveState } from "@/types/market";
import { useWatchlist } from "./watchlist/useWatchlist";

type QuoteMap = Record<string, QuoteLiveState | undefined>;
type QuoteListener = (quotes: QuoteMap) => void;

function normalizeSymbol(value: string): string {
  return String(value ?? "").trim().toUpperCase();
}

function compactSymbol(value: string): string {
  const compact = normalizeSymbol(value).replace(/[^A-Z0-9]/g, "");
  return compact.replace(/^XBT/, "BTC");
}

function buildSymbolAliases(symbol: string): string[] {
  const normalized = normalizeSymbol(symbol);
  const aliases = new Set<string>([normalized]);
  if (normalized.startsWith("BTC")) {
    aliases.add(`XBT${normalized.slice(3)}`);
  } else if (normalized.startsWith("XBT")) {
    aliases.add(`BTC${normalized.slice(3)}`);
  }
  return Array.from(aliases);
}

const shared = {
  socket: null as MarketSocket | null,
  token: null as string | null,
  accountId: null as string | null,
  buffer: {} as QuoteMap,
  cache: {} as QuoteMap,
  listeners: new Set<QuoteListener>(),
  symbolRefCounts: new Map<string, number>(),
  symbolAliases: new Map<string, string[]>(),
  lastTickAt: new Map<string, number>(),
  flushTimer: null as number | null,
};

const QUOTES_FAST_FLUSH_INTERVAL_MS = 20;
const QUOTES_STALE_RESUBSCRIBE_MS = 12000;
const QUOTES_HEALTHCHECK_MS = 4000;

function getNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function getPlaceholder(symbol: string): QuoteLiveState {
  const normalized = normalizeSymbol(symbol);
  return {
    symbol: normalized,
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
      const sym = normalizeSymbol(payload.symbol);
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

      shared.buffer[sym] = {
        ...cur,
        high: dayHigh ?? cur.high,
        low: dayLow ?? cur.low,
        dayOpen: dayOpen ?? cur.dayOpen,
        dayClose: dayCloseNum ?? cur.dayClose,
        // Keep bid/ask untouched on subscribe ack. Real tradable prices must come
        // from orderbook ticks; using dayClose here causes brief PnL spikes.
        bid: cur.bid,
        ask: cur.ask,
        bidDir: "same",
        askDir: "same",
      };
      shared.cache[sym] = shared.buffer[sym];
      scheduleEmit();
      return;
    }

    if (
      payload.type === "orderbook" &&
      nestedData &&
      typeof nestedData.code === "string"
    ) {
      const symbol = normalizeSymbol(nestedData.code);
      const symbolCompact = compactSymbol(symbol);
      const aliasKeys = new Set<string>();
      for (const key of Object.keys(shared.buffer)) {
        if (compactSymbol(key) === symbolCompact) aliasKeys.add(key);
      }
      for (const key of shared.symbolRefCounts.keys()) {
        if (compactSymbol(key) === symbolCompact) aliasKeys.add(key);
      }
      if (aliasKeys.size === 0) {
        aliasKeys.add(symbol);
      }

      const bids = Array.isArray(nestedData.bids)
        ? (nestedData.bids as Array<Record<string, unknown>>)
        : [];
      const asks = Array.isArray(nestedData.asks)
        ? (nestedData.asks as Array<Record<string, unknown>>)
        : [];
      const bid = bids[0];
      const ask = asks[0];

      if (!bid || !ask || Number(bid.price) <= 0 || Number(ask.price) <= 0) return;

      for (const key of aliasKeys) {
        if (!shared.buffer[key]) {
          shared.buffer[key] = getPlaceholder(key);
        }
      }

      const baseKey = [...aliasKeys][0];
      const old = (shared.buffer[baseKey] ?? getPlaceholder(baseKey)) as QuoteLiveState;
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

      const nextBid = String(bid.price);
      const nextAsk = String(ask.price);
      const nextBidVolume = String(bid.volume ?? "--");
      const nextAskVolume = String(ask.volume ?? "--");
      const nextBidDir =
        old.bid === "--"
          ? "same"
          : currentPrice > Number(old.bid)
          ? "up"
          : currentPrice < Number(old.bid)
          ? "down"
          : old.bidDir;
      const nextAskDir =
        old.ask === "--"
          ? "same"
          : Number(ask.price) > Number(old.ask)
          ? "up"
          : Number(ask.price) < Number(old.ask)
          ? "down"
          : old.askDir;

      for (const key of aliasKeys) {
        shared.buffer[key] = {
          ...(shared.buffer[key] as QuoteLiveState),
          symbol: key,
          bid: nextBid,
          ask: nextAsk,
          bidVolume: nextBidVolume,
          askVolume: nextAskVolume,
          tickTime,
          change,
          changePercent,
          high: nextHigh,
          low: nextLow,
          dayClose: dayClose > 0 ? dayClose : undefined,
          bidDir: nextBidDir,
          askDir: nextAskDir,
        } as QuoteLiveState;
        shared.cache[key] = shared.buffer[key];
        shared.lastTickAt.set(key, Date.now());
      }

      scheduleEmit();
    }
  } catch (error) {
    console.warn("[useMarketQuotes] message handler error", error);
  }
}

function ensureSocket(token: string, accountId: string) {
  const normalizedAccountId = accountId || null;
  if (shared.socket && shared.token === token) {
    shared.accountId = normalizedAccountId;
    shared.socket.setAccountId(accountId || undefined);
    return;
  }

  if (shared.socket) {
    shared.socket.close();
    shared.socket = null;
  }

  const sameSession =
    shared.token === token && shared.accountId === normalizedAccountId;
  shared.token = token;
  shared.accountId = normalizedAccountId;
  if (!sameSession) {
    // Prevent cross-session stale prices.
    shared.buffer = {};
    shared.cache = {};
  }

  for (const [symbol, count] of shared.symbolRefCounts) {
    if (count > 0) {
      shared.buffer[symbol] =
        shared.cache[symbol] ?? shared.buffer[symbol] ?? getPlaceholder(symbol);
      const aliases = shared.symbolAliases.get(symbol) ?? buildSymbolAliases(symbol);
      shared.symbolAliases.set(symbol, aliases);
    }
  }

  const socket = new MarketSocket();
  shared.socket = socket;
  socket.connect(token, handleIncomingQuote, accountId || undefined);

  for (const [symbol, count] of shared.symbolRefCounts) {
    if (count > 0) {
      const aliases = shared.symbolAliases.get(symbol) ?? buildSymbolAliases(symbol);
      shared.symbolAliases.set(symbol, aliases);
      aliases.forEach((alias) => socket.subscribe(alias));
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
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return;
  const currentCount = shared.symbolRefCounts.get(normalized) ?? 0;
  shared.symbolRefCounts.set(normalized, currentCount + 1);

  if (currentCount === 0) {
    shared.buffer[normalized] =
      shared.cache[normalized] ?? shared.buffer[normalized] ?? getPlaceholder(normalized);
    const aliases = buildSymbolAliases(normalized);
    shared.symbolAliases.set(normalized, aliases);
    aliases.forEach((alias) => shared.socket?.subscribe(alias));
    scheduleEmit();
  }
}

function unsubscribeSymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return;
  const currentCount = shared.symbolRefCounts.get(normalized) ?? 0;
  if (currentCount <= 1) {
    shared.symbolRefCounts.delete(normalized);
    const aliases = shared.symbolAliases.get(normalized) ?? buildSymbolAliases(normalized);
    aliases.forEach((alias) => shared.socket?.unsubscribe(alias));
    shared.symbolAliases.delete(normalized);
    shared.lastTickAt.delete(normalized);
    delete shared.buffer[normalized];
    scheduleEmit();
    return;
  }
  shared.symbolRefCounts.set(normalized, currentCount - 1);
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
    return Array.from(new Set([...watchlistSymbols, ...manualSymbols].map((s) => normalizeSymbol(s)).filter(Boolean)));
}, [extraSymbols, watchlist]);

  useEffect(() => {
    const syncAccountId = () => {
      const next = getEffectiveAccountId();
      setAccountId((prev) => (prev === next ? prev : next));
    };

    const handleVisibleOrResume = () => {
      if (document.visibilityState && document.visibilityState !== "visible") return;
      const next = getEffectiveAccountId();
      setAccountId((prev) => (prev === next ? prev : next));
      if (!token) return;
      ensureSocket(token, next);
      for (const symbol of ownedSymbolsRef.current) {
        const aliases = shared.symbolAliases.get(symbol) ?? buildSymbolAliases(symbol);
        aliases.forEach((alias) => {
          shared.socket?.unsubscribe(alias);
          shared.socket?.subscribe(alias);
        });
        shared.lastTickAt.set(symbol, Date.now());
      }
    };

    syncAccountId();
    window.addEventListener("focus", syncAccountId);
    window.addEventListener("pageshow", handleVisibleOrResume);
    window.addEventListener("online", handleVisibleOrResume);
    document.addEventListener("visibilitychange", handleVisibleOrResume);
    window.addEventListener("trade-account-change", syncAccountId);
    return () => {
      window.removeEventListener("focus", syncAccountId);
      window.removeEventListener("pageshow", handleVisibleOrResume);
      window.removeEventListener("online", handleVisibleOrResume);
      document.removeEventListener("visibilitychange", handleVisibleOrResume);
      window.removeEventListener("trade-account-change", syncAccountId);
    };
  }, [token]);

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

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => {
      if (!shared.socket?.isOpen()) return;
      const now = Date.now();
      for (const symbol of ownedSymbolsRef.current) {
        const last = shared.lastTickAt.get(symbol) ?? 0;
        if (!last || now - last < QUOTES_STALE_RESUBSCRIBE_MS) continue;
        const aliases = shared.symbolAliases.get(symbol) ?? buildSymbolAliases(symbol);
        aliases.forEach((alias) => {
          shared.socket?.unsubscribe(alias);
          shared.socket?.subscribe(alias);
        });
        shared.lastTickAt.set(symbol, now);
      }
    }, QUOTES_HEALTHCHECK_MS);

    return () => window.clearInterval(timer);
  }, [token]);

  return token ? quotes : {};
}
