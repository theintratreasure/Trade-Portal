"use client";

import { useEffect, useRef, useState } from "react";
const LIVE_SOCKET_FLUSH_INTERVAL_MS = 120;

type LiveAccount = {
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
};

export type LivePosition = {
  accountId: string;

  positionId: string;
  symbol: string;

  side: "BUY" | "SELL";

  volume: number;            // lot size
  openPrice: number;
  currentPrice: number;

  floatingPnL: number;

  stopLoss: number | null;
  takeProfit: number | null;

  swap: number;
  commission: number;

  openTime?: string;         // optional (if socket doesn’t send)
};
export type LivePending = {
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: string;
  price: number;
  volume: number;
  stopLoss: number | null;
  takeProfit: number | null;
  createdAt: number;
  currentPrice?: number;
  status: string;
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizePendingOrder = (data: any): LivePending | null => {
  if (!data?.orderId) return null;

  const statusRaw = data.status ?? data.orderStatus ?? data.state ?? data.order_state;
  const currentPriceRaw =
    data.currentPrice ?? data.current_price ?? data.ltp ?? data.lastPrice;

  return {
    orderId: String(data.orderId),
    symbol: String(data.symbol ?? "-"),
    side: String(data.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
    orderType: String(data.orderType ?? data.order_type ?? "-"),
    price: Number(data.price ?? 0),
    volume: Number(data.volume ?? 0),
    stopLoss: data.stopLoss ?? data.stop_loss ?? null,
    takeProfit: data.takeProfit ?? data.take_profit ?? null,
    createdAt: Number(data.createdAt ?? data.created_at ?? Date.now()),
    currentPrice: toNumberOrUndefined(currentPriceRaw),
    status: String(statusRaw ?? "PENDING"),
  };
};


export const useLiveTradeSocket = (accountId?: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const accountBufferRef = useRef<LiveAccount | null>(null);
  const positionsBufferRef = useRef<Record<string, LivePosition>>({});
  const pendingBufferRef = useRef<Record<string, LivePending>>({});

  const [account, setAccount] = useState<LiveAccount | null>(null);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [pendingOrders, setPendingOrders] = useState<LivePending[]>([]);

  const scheduleFlush = () => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      setAccount(accountBufferRef.current);
      setPositions(Object.values(positionsBufferRef.current));
      setPendingOrders(Object.values(pendingBufferRef.current));
    }, LIVE_SOCKET_FLUSH_INTERVAL_MS);
  };


  useEffect(() => {
    if (!accountId) {
      accountBufferRef.current = null;
      positionsBufferRef.current = {};
      pendingBufferRef.current = {};
      queueMicrotask(() => {
        setAccount(null);
        setPositions([]);
        setPendingOrders([]);
      });
      return;
    }

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_SOKETAPIBASE_URL}/account`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "identify",
          accountId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "live_account") {
          accountBufferRef.current = message.data;
          scheduleFlush();
        }

        if (message.type === "live_position") {
          positionsBufferRef.current[message.data.positionId] = message.data;
          scheduleFlush();
        }
        if (message.type === "live_pending") {
          const normalized = normalizePendingOrder(message.data);
          if (!normalized) return;

          pendingBufferRef.current[normalized.orderId] = normalized;
          scheduleFlush();
        }

      } catch (err) {
        console.error("Socket parse error", err);
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        wsRef.current = null;
      }, 2000);
    };

    return () => {
      ws.close();
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [accountId]);

  return {
    account,
    positions,
    pending: pendingOrders,
  };
};
