"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarketSocket } from "@/services/marketSocket.service";
import { WatchlistItem } from "@/services/watchlist.service";
import { QuoteLiveState } from "@/types/market";
import { useWatchlist } from "./watchlist/useWatchlist";

type QuoteMap = Record<string, QuoteLiveState | undefined>;
const QUOTES_FLUSH_INTERVAL_MS = 120;

function getNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export function useMarketQuotes(token?: string, extraSymbols: string[] = []) {
  const socketRef = useRef<MarketSocket | null>(null);
  const bufferRef = useRef<QuoteMap>({});
  const flushTimerRef = useRef<number | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());

  const [quotes, setQuotes] = useState<QuoteMap>({});
  const { data: watchlist } = useWatchlist();

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      setQuotes({ ...bufferRef.current });
    }, QUOTES_FLUSH_INTERVAL_MS);
  }, []);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      subscribedRef.current.clear();
      bufferRef.current = {};
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      queueMicrotask(() => setQuotes({}));
      return;
    }

    if (socketRef.current) return;

    const socket = new MarketSocket();
    socketRef.current = socket;

    socket.connect(token, (msg: unknown) => {
      try {
        const payload = (msg ?? {}) as Record<string, unknown>;
        const nestedData =
          payload.data && typeof payload.data === "object"
            ? (payload.data as Record<string, unknown>)
            : undefined;

        /* ===================== SUBSCRIBED MESSAGE ===================== */
        if (payload.status === "subscribed" && typeof payload.symbol === "string") {
          const sym = payload.symbol;
          const cur = bufferRef.current[sym];

          if (cur) {
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

            bufferRef.current[sym] = {
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

            scheduleFlush();
          }

          return;
        }

        /* ===================== ORDERBOOK MESSAGE ===================== */
        if (
          payload.type === "orderbook" &&
          nestedData &&
          typeof nestedData.code === "string"
        ) {
          const s = nestedData.code;
          const bids = Array.isArray(nestedData.bids)
            ? (nestedData.bids as Array<Record<string, unknown>>)
            : [];
          const asks = Array.isArray(nestedData.asks)
            ? (nestedData.asks as Array<Record<string, unknown>>)
            : [];
          const bid = bids[0];
          const ask = asks[0];

          // Convert tick_time
          const tickTime = nestedData.tick_time
            ? new Date(Number(nestedData.tick_time)).toLocaleTimeString("en-US", {
                hour12: false,
              })
            : undefined;

          if (!bufferRef.current[s]) {
            bufferRef.current[s] = {
              symbol: s,
              bid: "--",
              ask: "--",
              bidVolume: "--",
              askVolume: "--",
              bidDir: "same",
              askDir: "same",
            } as unknown as QuoteLiveState;
          }

          const old = bufferRef.current[s] as QuoteLiveState;

          if (
            bid &&
            ask &&
            Number(bid.price) > 0 &&
            Number(ask.price) > 0
          ) {

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

            let change = 0;
            let changePercent = 0;

            if (dayClose > 0) {
              change = currentPrice - dayClose;
              changePercent = (change / dayClose) * 100;
            }

            bufferRef.current[s] = {
              ...old,

              bid: bid.price,
              ask: ask.price,
              bidVolume: bid.volume,
              askVolume: ask.volume,
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

            scheduleFlush();
          }
        }

      } catch (err) {
        console.warn("[useMarketQuotes] message handler error", err);
      }
    });
    const subscribedOnConnect = subscribedRef.current;

    return () => {
      socket.close();
      socketRef.current = null;
      subscribedOnConnect.clear();
      bufferRef.current = {};
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      setQuotes({});
    };
  }, [scheduleFlush, token]);

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
    const socket = socketRef.current;
    if (!socket) return;
    const desired = new Set(desiredSymbols);

    for (const code of desired) {
      if (!subscribedRef.current.has(code)) {
        subscribedRef.current.add(code);
        bufferRef.current[code] = {
          symbol: code,
          bid: "--",
          ask: "--",
          bidVolume: "--",
          askVolume: "--",
          bidDir: "same",
          askDir: "same",
        } as unknown as QuoteLiveState;

        socket.subscribe(code);
      }
    }

    for (const code of Array.from(subscribedRef.current)) {
      if (!desired.has(code)) {
        subscribedRef.current.delete(code);
        delete bufferRef.current[code];
        socket.unsubscribe(code);
      }
    }

    scheduleFlush();
  }, [desiredSymbols, scheduleFlush]);

  return token ? quotes : {};
}
