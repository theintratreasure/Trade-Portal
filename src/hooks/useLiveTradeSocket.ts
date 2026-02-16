"use client";

import { useEffect, useRef, useState } from "react";
import tradeApi from "@/api/tradeApi";
import { buildSocketUrl } from "@/lib/socketUrl";

const LIVE_SOCKET_FLUSH_INTERVAL_MS = 40;
const LIVE_SOCKET_IDLE_CLOSE_MS = 15000;
const LIVE_SOCKET_RECONNECT_MAX_MS = 5000;
const LIVE_RECONCILE_INTERVAL_MS = 3000;

type LiveAccount = {
  accountId?: string;
  balance: number;
  equity: number;
  bonusBalance?: number;
  bonusLive?: number;
  bonusPercent?: number;
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
  reconcileTimer: null as number | null,
  reconcileInFlight: false,
};

export function removeLivePositionFromCache(positionId: string) {
  if (!positionId) return;
  if (shared.positionsMap[positionId]) {
    delete shared.positionsMap[positionId];
    scheduleEmit();
  }
}

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

function normalizeLiveAccount(data: unknown): LiveAccount | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const nestedData =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : null;
  const source = nestedData ?? row;

  const balance = Number(source.balance ?? 0);
  const equity = Number(source.equity ?? 0);
  const usedMargin = Number(source.usedMargin ?? source.margin ?? 0);
  const freeMargin = Number(source.freeMargin ?? 0);

  return {
    accountId: source.accountId ? String(source.accountId) : undefined,
    balance: Number.isFinite(balance) ? balance : 0,
    equity: Number.isFinite(equity) ? equity : 0,
    bonusBalance: toNumberOrUndefined(source.bonusBalance ?? source.bonus_balance),
    bonusLive: toNumberOrUndefined(source.bonusLive ?? source.bonus_live),
    bonusPercent: toNumberOrUndefined(source.bonusPercent ?? source.bonus_percent),
    usedMargin: Number.isFinite(usedMargin) ? usedMargin : 0,
    freeMargin: Number.isFinite(freeMargin) ? freeMargin : 0,
  };
}

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

function normalizePosition(data: unknown): LivePosition | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const id = row.positionId ?? row.id ?? row._id;
  if (!id) return null;

  return {
    accountId: String(row.accountId ?? ""),
    positionId: String(id),
    symbol: String(row.symbol ?? row.pair ?? row.instrument ?? "-"),
    side: String(row.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
    volume: Number(row.volume ?? row.lot ?? 0),
    openPrice: Number(row.openPrice ?? row.entryPrice ?? row.price ?? 0),
    currentPrice: Number(row.currentPrice ?? row.current_price ?? row.ltp ?? row.lastPrice ?? 0),
    floatingPnL: Number(row.floatingPnL ?? row.pnl ?? row.profit ?? 0),
    stopLoss: (row.stopLoss ?? row.stop_loss ?? null) as number | null,
    takeProfit: (row.takeProfit ?? row.take_profit ?? null) as number | null,
    swap: Number(row.swap ?? 0),
    commission: Number(row.commission ?? 0),
    openTime: row.openTime
      ? String(row.openTime)
      : row.open_time
      ? String(row.open_time)
      : undefined,
  };
}

function isPendingActive(status: unknown): boolean {
  const s = String(status ?? "PENDING").toUpperCase();
  return s === "PENDING" || s === "PLACED" || s === "OPEN";
}

function isPositionActive(status: unknown): boolean {
  const s = String(status ?? "OPEN").toUpperCase();
  return !(s === "CLOSED" || s === "CLOSE" || s === "DELETED");
}

function hasPositionClosedMarkers(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const row = data as Record<string, unknown>;
  const status = String(
    row.status ?? row.state ?? row.positionStatus ?? row.position_status ?? ""
  ).toUpperCase();
  if (status && !isPositionActive(status)) return true;

  if (row.isClosed === true) return true;
  if (row.closed === true) return true;
  if (row.closeTime || row.close_time || row.closedAt || row.closed_at) return true;
  if (String(row.action ?? "").toUpperCase() === "CLOSE") return true;
  return false;
}

function parsePositionsFromUnknown(data: unknown): LivePosition[] {
  if (Array.isArray(data)) {
    return data
      .map((item) => normalizePosition(item))
      .filter((item): item is LivePosition => Boolean(item));
  }
  if (!data || typeof data !== "object") return [];
  const row = data as Record<string, unknown>;
  const candidates = [
    row.positions,
    row.openPositions,
    row.open_positions,
    row.livePositions,
    row.live_positions,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => normalizePosition(item))
        .filter((item): item is LivePosition => Boolean(item));
    }
  }
  return [];
}

function parsePendingsFromUnknown(data: unknown): LivePending[] {
  if (Array.isArray(data)) {
    return data
      .map((item) => normalizePendingOrder(item))
      .filter((item): item is LivePending => Boolean(item));
  }
  if (!data || typeof data !== "object") return [];
  const row = data as Record<string, unknown>;
  const candidates = [
    row.pending,
    row.pendings,
    row.pendingOrders,
    row.pending_orders,
    row.orders,
    row.liveOrders,
    row.live_orders,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => normalizePendingOrder(item))
        .filter((item): item is LivePending => Boolean(item));
    }
  }
  return [];
}

function applyPositionMerge(items: LivePosition[]) {
  if (items.length === 0) return;
  const next: Record<string, LivePosition> = { ...shared.positionsMap };
  for (const item of items) {
    next[item.positionId] = item;
  }
  shared.positionsMap = next;
  scheduleEmit();
}

function applyPendingSnapshot(items: LivePending[]) {
  const next: Record<string, LivePending> = {};
  for (const item of items) {
    if (isPendingActive(item.status)) {
      next[item.orderId] = item;
    }
  }
  shared.pendingMap = next;
  scheduleEmit();
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
  if (shared.reconcileTimer) {
    window.clearInterval(shared.reconcileTimer);
    shared.reconcileTimer = null;
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

async function reconcileFromRest() {
  if (!shared.accountId || shared.reconcileInFlight || shared.listeners.size === 0) return;
  shared.reconcileInFlight = true;
  try {
    const { data } = await tradeApi.get("/trade/positions", {
      params: { page: 1, limit: 200 },
    });
    const rows = Array.isArray(data?.positions)
      ? data.positions
      : Array.isArray(data?.data?.positions)
      ? data.data.positions
      : [];

    if (!Array.isArray(rows)) return;
    const next: Record<string, LivePosition> = {};
    for (const row of rows) {
      const pos = normalizePosition(row);
      if (!pos) continue;
      next[pos.positionId] = pos;
    }
    const currentSize = Object.keys(shared.positionsMap).length;
    const nextSize = Object.keys(next).length;
    // If REST returns a partial list, avoid shrinking visible positions abruptly.
    if (currentSize > nextSize && nextSize > 0) {
      shared.positionsMap = { ...shared.positionsMap, ...next };
    } else {
      shared.positionsMap = next;
    }
    scheduleEmit();
  } catch {
    // ignore reconcile errors; websocket remains primary source
  } finally {
    shared.reconcileInFlight = false;
  }
}

function ensureReconcileLoop() {
  if (shared.reconcileTimer) return;
  shared.reconcileTimer = window.setInterval(() => {
    void reconcileFromRest();
  }, LIVE_RECONCILE_INTERVAL_MS);
  void reconcileFromRest();
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
      const messageType = String(message.type ?? "").toLowerCase();
      const payload =
        message.data && typeof message.data === "object"
          ? (message.data as Record<string, unknown>)
          : null;

      // Defensive close handling: if any message carries positionId + close marker,
      // remove immediately even when backend uses an unexpected message type.
      if (payload && payload.positionId) {
        const pid = String(payload.positionId);
        const likelyCloseEvent = messageType.includes("close") || messageType.includes("closed");
        if (likelyCloseEvent || hasPositionClosedMarkers(payload)) {
          delete shared.positionsMap[pid];
          scheduleEmit();
          return;
        }
      }

      if (message.type === "live_account" && message.data && typeof message.data === "object") {
        const account = normalizeLiveAccount(message.data);
        if (account) shared.account = account;
        const positions = parsePositionsFromUnknown(message.data);
        if (positions.length > 0) {
          applyPositionMerge(positions);
        }
        const pendings = parsePendingsFromUnknown(message.data);
        if (pendings.length > 0) {
          applyPendingSnapshot(pendings);
        }
        scheduleEmit();
        return;
      }

      // Generic snapshots fallback for unknown message types.
      if (payload) {
        const positions = parsePositionsFromUnknown(payload);
        if (positions.length > 0) {
          // Unknown message types may send partial arrays; merge to avoid flicker.
          applyPositionMerge(positions);
          return;
        }
        const pendings = parsePendingsFromUnknown(payload);
        if (pendings.length > 0) {
          applyPendingSnapshot(pendings);
          return;
        }
      }

      if (
        (message.type === "live_accounts" || message.type === "account_snapshot") &&
        message.data &&
        typeof message.data === "object"
      ) {
        const account = normalizeLiveAccount(message.data);
        if (account) shared.account = account;
        scheduleEmit();
        return;
      }

      if (message.type === "live_position" && message.data && typeof message.data === "object") {
        const row = normalizePosition(message.data);
        if (!row || hasPositionClosedMarkers(message.data)) {
          const id = (message.data as Record<string, unknown>)?.positionId;
          if (id) delete shared.positionsMap[String(id)];
          scheduleEmit();
          return;
        }
        shared.positionsMap[row.positionId] = row;
        scheduleEmit();
        return;
      }

      if (
        (message.type === "position_closed" ||
          message.type === "live_position_closed" ||
          message.type === "close_position") &&
        message.data &&
        typeof message.data === "object"
      ) {
        const id = (message.data as Record<string, unknown>)?.positionId;
        if (id) {
          delete shared.positionsMap[String(id)];
          scheduleEmit();
        }
        return;
      }

      if (
        (message.type === "live_positions" || message.type === "positions_snapshot") &&
        message.data
      ) {
        const positions = parsePositionsFromUnknown(message.data);
        // In practice these events can be partial batches, so merge to avoid
        // shrinking UI list to a single position intermittently.
        applyPositionMerge(positions);
        return;
      }

      if (message.type === "live_pending") {
        const pending = normalizePendingOrder(message.data);
        if (!pending) return;
        if (!isPendingActive(pending.status)) {
          delete shared.pendingMap[pending.orderId];
          scheduleEmit();
          return;
        }
        shared.pendingMap[pending.orderId] = pending;
        scheduleEmit();
        return;
      }

      if (
        (message.type === "live_pendings" ||
          message.type === "pending_snapshot" ||
          message.type === "live_orders") &&
        message.data
      ) {
        const pendings = parsePendingsFromUnknown(message.data);
        applyPendingSnapshot(pendings);
        return;
      }

      if (
        message.type === "account_snapshot" &&
        message.data &&
        typeof message.data === "object"
      ) {
        const row = message.data as Record<string, unknown>;
        if (row.account && typeof row.account === "object") {
          const account = normalizeLiveAccount(row.account);
          if (account) shared.account = account;
        } else {
          const account = normalizeLiveAccount(message.data);
          if (account) shared.account = account;
        }
        const positions = parsePositionsFromUnknown(message.data);
        if (positions.length > 0) {
          applyPositionMerge(positions);
        }
        const pendings = parsePendingsFromUnknown(message.data);
        if (pendings.length > 0) {
          applyPendingSnapshot(pendings);
        }
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

  const socketUrl = buildSocketUrl("/account");
  if (!socketUrl) {
    scheduleReconnect();
    return;
  }

  let socket: WebSocket;
  try {
    socket = new WebSocket(socketUrl);
  } catch {
    scheduleReconnect();
    return;
  }
  shared.socket = socket;
  bindSocket(socket, accountId);
  ensureReconcileLoop();
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
