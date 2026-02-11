"use client";

import { useEffect, useRef, useState } from "react";
import { MarketSocket } from "@/services/marketSocket.service";
import { QuoteLiveState } from "@/types/market";
import { useWatchlist } from "./watchlist/useWatchlist";

type QuoteMap = Record<string, QuoteLiveState | undefined>;

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
  const rafRef = useRef<number | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());

  const [quotes, setQuotes] = useState<QuoteMap>({});
  const { data: watchlist } = useWatchlist();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      subscribedRef.current.clear();
      bufferRef.current = {};
      setQuotes({});
      return;
    }

    if (socketRef.current) return;

    const socket = new MarketSocket();
    socketRef.current = socket;

    socket.connect(token, (msg: any) => {
      try {

        /* ===================== SUBSCRIBED MESSAGE ===================== */
        if (msg.status === "subscribed" && msg.symbol) {
          const sym = msg.symbol;
          const cur = bufferRef.current[sym];

          if (cur) {
            const dayHigh = getNumber(
              msg.dayHigh,
              msg.day_high,
              msg.high,
              msg.h,
              msg.data?.dayHigh,
              msg.data?.day_high,
              msg.data?.high,
              msg.data?.h
            );
            const dayLow = getNumber(
              msg.dayLow,
              msg.day_low,
              msg.low,
              msg.l,
              msg.data?.dayLow,
              msg.data?.day_low,
              msg.data?.low,
              msg.data?.l
            );
            const dayOpen = getNumber(msg.dayOpen, msg.day_open, msg.data?.dayOpen, msg.data?.day_open);
            const dayCloseNum = getNumber(
              msg.dayClose,
              msg.day_close,
              msg.data?.dayClose,
              msg.data?.day_close
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
        if (msg.type === "orderbook" && msg.data?.code) {
          const s = msg.data.code;
          const bid = msg.data.bids?.[0];
          const ask = msg.data.asks?.[0];

          // Convert tick_time
          const tickTime = msg.data.tick_time
            ? new Date(Number(msg.data.tick_time)).toLocaleTimeString("en-US", {
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

          const old = bufferRef.current[s] as any;

          if (
            bid &&
            ask &&
            Number(bid.price) > 0 &&
            Number(ask.price) > 0
          ) {

            const currentPrice = Number(bid.price);
            const dayClose = old.dayClose ?? 0;
            const dayHigh = getNumber(
              msg.data?.dayHigh,
              msg.data?.day_high,
              msg.data?.high,
              msg.data?.h,
              msg.dayHigh,
              msg.day_high,
              msg.high,
              msg.h
            );
            const dayLow = getNumber(
              msg.data?.dayLow,
              msg.data?.day_low,
              msg.data?.low,
              msg.data?.l,
              msg.dayLow,
              msg.day_low,
              msg.low,
              msg.l
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
            } as unknown as QuoteLiveState;

            scheduleFlush();
          }
        }

      } catch (err) {
        console.warn("[useMarketQuotes] message handler error", err);
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
      subscribedRef.current.clear();
      bufferRef.current = {};
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setQuotes({});
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const watchlistSymbols = (watchlist ?? [])
      .map((w: any) => w?.code)
      .filter((code: unknown): code is string => typeof code === "string" && code.length > 0);
    const manualSymbols = (extraSymbols ?? [])
      .filter((code): code is string => typeof code === "string" && code.length > 0);
    const desired = new Set([...watchlistSymbols, ...manualSymbols]);

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
  }, [watchlist, extraSymbols]);

  function scheduleFlush() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setQuotes({ ...bufferRef.current });
    });
  }

  return quotes;
}
