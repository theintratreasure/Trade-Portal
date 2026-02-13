"use client";

import { useEffect, useRef, useState } from "react";

const LIVE_SOCKET_FLUSH_INTERVAL_MS = 90;
const LIVE_SOCKET_IDLE_CLOSE_MS = 15000;
const LIVE_SOCKET_RECONNECT_MAX_MS = 5000;

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
  volume: number;
  openPrice: number;
  currentPrice: number;
  floatingPnL: number;
  stopLoss: number | null;
  takeProfit: number | null;
  swap: number;
  commission: number;
  openTime?: string;
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

type Snapshot = {
  account: LiveAccount | null;
  positions: LivePosition[];
  pending: LivePending[];
};

type Listener = (snapshot: Snapshot) => void;

type SocketMessage = {
  type?: string;
  data?: unknown;
};

const shared = {
  socket: null as WebSocket | null,
  accountId: null as string | null,
  listeners: new Set<Listener>(),
  reconnectTimer: null as number | null,
  idleCloseTimer: null as number | null,
  flushTimer: null as number | null,
  reconnectAttempts: 0,
  shouldReconnect: false,
  account: null as LiveAccount | null,
  positionsMap: {} as Record<string, LivePosition>,
  pendingMap: {} as Record<string, LivePending>,
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

function normalizePendingOrder(data: unknown): LivePending | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (!row.orderId) return null;

  const statusRaw = row.status ?? row.orderStatus ?? row.state ?? row.order_state;
  const currentPriceRaw =
    row.currentPrice ?? row.current_price ?? row.ltp ?? row.lastPrice;

  return {
    orderId: String(row.orderId),
    symbol: String(row.symbol ?? "-"),
    side: String(row.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
    orderType: String(row.orderType ?? row.order_type ?? "-"),
    price: Number(row.price ?? 0),
    volume: Number(row.volume ?? 0),
    stopLoss: (row.stopLoss ?? row.stop_loss ?? null) as number | null,
    takeProfit: (row.takeProfit ?? row.take_profit ?? null) as number | null,
    createdAt: Number(row.createdAt ?? row.created_at ?? Date.now()),
    currentPrice: toNumberOrUndefined(currentPriceRaw),
    status: String(statusRaw ?? "PENDING"),
  };
}

function snapshot(): Snapshot {
  return {
    account: shared.account,
    positions: Object.values(shared.positionsMap),
    pending: Object.values(shared.pendingMap),
  };
}

function emit() {
  const next = snapshot();
  shared.listeners.forEach((listener) => listener(next));
}

function scheduleEmit() {
  if (shared.flushTimer) return;
  shared.flushTimer = window.setTimeout(() => {
    shared.flushTimer = null;
    emit();
  }, LIVE_SOCKET_FLUSH_INTERVAL_MS);
}

function clearTimers() {
  if (shared.reconnectTimer) {
    window.clearTimeout(shared.reconnectTimer);
    shared.reconnectTimer = null;
  }
  if (shared.idleCloseTimer) {
    window.clearTimeout(shared.idleCloseTimer);
    shared.idleCloseTimer = null;
  }
}

function closeSocket() {
  shared.shouldReconnect = false;
  clearTimers();
  if (shared.socket) {
    try {
      shared.socket.close();
    } catch {
      // ignore close errors
    }
  }
  shared.socket = null;
  shared.reconnectAttempts = 0;
}

function scheduleReconnect() {
  if (!shared.shouldReconnect || !shared.accountId || shared.reconnectTimer) return;
  shared.reconnectAttempts = Math.min(shared.reconnectAttempts + 1, 8);
  const delay = Math.min(
    LIVE_SOCKET_RECONNECT_MAX_MS,
    250 * Math.pow(1.7, shared.reconnectAttempts)
  );
  shared.reconnectTimer = window.setTimeout(() => {
    shared.reconnectTimer = null;
    if (!shared.shouldReconnect || !shared.accountId) return;
    ensureConnected(shared.accountId);
  }, delay);
}

function bindSocket(socket: WebSocket, accountId: string) {
  socket.onopen = () => {
    shared.reconnectAttempts = 0;
    socket.send(
      JSON.stringify({
        type: "identify",
        accountId,
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as SocketMessage;

      if (message.type === "live_account" && message.data && typeof message.data === "object") {
        shared.account = message.data as LiveAccount;
        scheduleEmit();
        return;
      }

      if (message.type === "live_position" && message.data && typeof message.data === "object") {
        const row = message.data as LivePosition;
        if (!row.positionId) return;
        shared.positionsMap[row.positionId] = row;
        scheduleEmit();
        return;
      }

      if (message.type === "live_pending") {
        const pending = normalizePendingOrder(message.data);
        if (!pending) return;
        shared.pendingMap[pending.orderId] = pending;
        scheduleEmit();
      }
    } catch (error) {
      console.warn("[useLiveTradeSocket] parse error", error);
    }
  };

  socket.onclose = () => {
    if (shared.socket === socket) {
      shared.socket = null;
    }
    if (shared.shouldReconnect) {
      scheduleReconnect();
    }
  };

  socket.onerror = () => {
    // onclose handles reconnect
  };
}

function ensureConnected(accountId: string) {
  clearTimers();

  if (
    shared.socket &&
    shared.accountId === accountId &&
    (shared.socket.readyState === WebSocket.OPEN ||
      shared.socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  if (shared.accountId !== accountId) {
    shared.account = null;
    shared.positionsMap = {};
    shared.pendingMap = {};
    scheduleEmit();
  }

  shared.accountId = accountId;
  shared.shouldReconnect = true;

  if (shared.socket) {
    try {
      shared.socket.close();
    } catch {
      // ignore
    }
    shared.socket = null;
  }

  const base = process.env.NEXT_PUBLIC_SOKETAPIBASE_URL || "";
  const socket = new WebSocket(`${base}/account`);
  shared.socket = socket;
  bindSocket(socket, accountId);
}

function subscribe(listener: Listener) {
  shared.listeners.add(listener);
  if (shared.idleCloseTimer) {
    window.clearTimeout(shared.idleCloseTimer);
    shared.idleCloseTimer = null;
  }
  listener(snapshot());
}

function unsubscribe(listener: Listener) {
  shared.listeners.delete(listener);
  if (shared.listeners.size > 0) return;

  shared.idleCloseTimer = window.setTimeout(() => {
    if (shared.listeners.size === 0) {
      closeSocket();
    }
  }, LIVE_SOCKET_IDLE_CLOSE_MS);
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

function getEffectiveAccountId(accountId?: string): string {
  if (accountId && accountId.length > 0) return accountId;
  const cookieId = getCookieValue("accountId");
  if (cookieId) return cookieId;
  if (typeof window !== "undefined") {
    return localStorage.getItem("tradeAccountId") ?? "";
  }
  return "";
}

export const useLiveTradeSocket = (accountId?: string) => {
  const [effectiveAccountId, setEffectiveAccountId] = useState<string>(() =>
    getEffectiveAccountId(accountId)
  );
  const [state, setState] = useState<Snapshot>(() => snapshot());
  const listenerRef = useRef<Listener>((next) => setState(next));

  useEffect(() => {
    const listener = listenerRef.current;
    subscribe(listener);
    return () => {
      unsubscribe(listener);
    };
  }, []);

  useEffect(() => {
    setEffectiveAccountId(getEffectiveAccountId(accountId));
  }, [accountId]);

  useEffect(() => {
    const syncAccountId = () => {
      const next = getEffectiveAccountId(accountId);
      if (!next || next === effectiveAccountId) return;
      setEffectiveAccountId(next);
      ensureConnected(next);
    };

    window.addEventListener("focus", syncAccountId);
    window.addEventListener("trade-account-change", syncAccountId);
    return () => {
      window.removeEventListener("focus", syncAccountId);
      window.removeEventListener("trade-account-change", syncAccountId);
    };
  }, [accountId, effectiveAccountId]);

  useEffect(() => {
    if (!effectiveAccountId) return;
    ensureConnected(effectiveAccountId);
  }, [effectiveAccountId]);

  return state;
};
