"use client";

import { useEffect, useRef, useState } from "react";
import tradeApi from "@/api/tradeApi";
import { buildSocketUrl } from "@/lib/socketUrl";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";

const LIVE_SOCKET_FLUSH_INTERVAL_MS = 40;
const LIVE_SOCKET_IDLE_CLOSE_MS = 15000;
const LIVE_SOCKET_RECONNECT_MAX_MS = 5000;
const LIVE_RECONCILE_INTERVAL_MS = 3000;
const LIVE_SOCKET_STALE_MS = 30000;
const LIVE_SOCKET_HEALTHCHECK_MS = 5000;
const LIVE_SOCKET_DEBUG = process.env.NEXT_PUBLIC_DEBUG_LIVE_SOCKET === "1";

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
  healthcheckTimer: null as number | null,
  lastMessageAt: 0,
  resumeGuardUntil: 0,
};

function debugLog(message: string, data?: unknown) {
  if (!LIVE_SOCKET_DEBUG) return;
  if (data === undefined) {
    console.debug(`[useLiveTradeSocket] ${message}`);
    return;
  }
  console.debug(`[useLiveTradeSocket] ${message}`, data);
}

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
  const nestedData =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : null;
  const hasRowOrderKeys =
    row.orderId != null ||
    row.order_id != null ||
    row.pendingOrderId != null ||
    row.symbol != null;
  const source =
    nestedData &&
    !hasRowOrderKeys &&
    (nestedData.orderId != null ||
      nestedData.order_id != null ||
      nestedData.pendingOrderId != null ||
      nestedData.symbol != null)
      ? nestedData
      : row;
  const orderId = source.orderId ?? source.order_id ?? source.pendingOrderId ?? source.id ?? source._id;
  if (!orderId) return null;

  const statusRaw = source.status ?? source.orderStatus ?? source.state ?? source.order_state;
  const currentPriceRaw =
    source.currentPrice ?? source.current_price ?? source.ltp ?? source.lastPrice;

  return {
    orderId: String(orderId),
    symbol: String(source.symbol ?? "-"),
    side: String(source.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
    orderType: String(source.orderType ?? source.order_type ?? "-"),
    price: Number(source.price ?? 0),
    volume: Number(source.volume ?? source.qty ?? 0),
    stopLoss: (source.stopLoss ?? source.stop_loss ?? null) as number | null,
    takeProfit: (source.takeProfit ?? source.take_profit ?? null) as number | null,
    createdAt: Number(source.createdAt ?? source.created_at ?? Date.now()),
    currentPrice: toNumberOrUndefined(currentPriceRaw),
    status: String(statusRaw ?? "PENDING"),
  };
}

function normalizePosition(data: unknown): LivePosition | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const nestedData =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : null;
  const hasRowPositionKeys =
    row.positionId != null ||
    row.position_id != null ||
    row.orderId != null ||
    row.symbol != null ||
    row.pair != null ||
    row.instrument != null ||
    row.openPrice != null ||
    row.open_price != null ||
    row.currentPrice != null ||
    row.current_price != null ||
    row.floatingPnL != null ||
    row.floating_pnl != null ||
    row.profitLoss != null ||
    row.profit_loss != null ||
    row.unrealizedPnL != null ||
    row.unrealized_pnl != null ||
    row.unrealisedPnL != null ||
    row.unrealised_pnl != null ||
    row.pnl != null;
  const source =
    nestedData &&
    !hasRowPositionKeys &&
    (nestedData.positionId != null ||
      nestedData.position_id != null ||
      nestedData.orderId != null ||
      nestedData.symbol != null ||
      nestedData.pair != null ||
      nestedData.instrument != null ||
      nestedData.openPrice != null ||
      nestedData.open_price != null ||
      nestedData.currentPrice != null ||
      nestedData.current_price != null ||
      nestedData.floatingPnL != null ||
      nestedData.floating_pnl != null ||
      nestedData.profitLoss != null ||
      nestedData.profit_loss != null ||
      nestedData.unrealizedPnL != null ||
      nestedData.unrealized_pnl != null ||
      nestedData.unrealisedPnL != null ||
      nestedData.unrealised_pnl != null ||
      nestedData.pnl != null)
      ? nestedData
      : row;
  const id =
    source.positionId ??
    source.position_id ??
    source.id ??
    source._id ??
    source.orderId;
  if (!id) return null;
  const hasTradeShape =
    source.positionId != null ||
    source.position_id != null ||
    source.orderId != null ||
    source.symbol != null ||
    source.pair != null ||
    source.instrument != null ||
    source.openPrice != null ||
    source.open_price != null ||
    source.currentPrice != null ||
    source.current_price != null ||
    source.floatingPnL != null ||
    source.floating_pnl != null ||
    source.profitLoss != null ||
    source.profit_loss != null ||
    source.unrealizedPnL != null ||
    source.unrealized_pnl != null ||
    source.unrealisedPnL != null ||
    source.unrealised_pnl != null ||
    source.pnl != null;
  if (!hasTradeShape) return null;

  const rawOpenPrice = toNumberOrUndefined(
    source.openPrice ??
      source.open_price ??
      source.entryPrice ??
      source.entry_price ??
      source.price
  );
  const rawCurrentPrice = toNumberOrUndefined(
    source.currentPrice ??
      source.current_price ??
      source.closePrice ??
      source.close_price ??
      source.marketPrice ??
      source.market_price ??
      source.markPrice ??
      source.mark_price ??
      source.ltp ??
      source.lastPrice ??
      source.last_price ??
      source.bid ??
      source.ask
  );
  const rawFloatingPnL = toNumberOrUndefined(
    source.floatingPnL ??
      source.floating_pnl ??
      source.floatingProfit ??
      source.floating_profit ??
      source.profitLoss ??
      source.profit_loss ??
      source.unrealizedPnL ??
      source.unrealisedPnL ??
      source.unrealized_pnl ??
      source.unrealised_pnl ??
      source.pnl ??
      source.profit ??
      source.pl ??
      source.profitUsd ??
      source.profit_usd
  );

  return {
    accountId: String(source.accountId ?? source.account_id ?? ""),
    positionId: String(id),
    symbol: String(source.symbol ?? source.pair ?? source.instrument ?? source.code ?? "-"),
    side: String(source.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
    volume: Number(source.volume ?? source.lot ?? source.qty ?? source.lots ?? source.size ?? 0),
    openPrice: rawOpenPrice ?? 0,
    currentPrice: rawCurrentPrice ?? rawOpenPrice ?? 0,
    floatingPnL: rawFloatingPnL ?? Number.NaN,
    stopLoss: (source.stopLoss ?? source.stop_loss ?? null) as number | null,
    takeProfit: (source.takeProfit ?? source.take_profit ?? null) as number | null,
    swap: Number(source.swap ?? 0),
    commission: Number(source.commission ?? 0),
    openTime: source.openTime
      ? String(source.openTime)
      : source.open_time
      ? String(source.open_time)
      : undefined,
  };
}

function getPositionIdFromUnknown(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const id = row.positionId ?? row.position_id ?? row.id ?? row._id ?? row.orderId;
  if (id === null || id === undefined || id === "") return null;
  return String(id);
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isAlmostEqual(a: number, b: number, epsilon = 1e-9): boolean {
  return Math.abs(a - b) <= epsilon;
}

function mergePosition(prev: LivePosition | undefined, next: LivePosition): LivePosition {
  if (!prev) return next;
  const nextOpen = isFinitePositive(next.openPrice) ? next.openPrice : prev.openPrice;
  const nextCurrent = isFinitePositive(next.currentPrice) ? next.currentPrice : prev.currentPrice;
  const nextPnl = Number.isFinite(next.floatingPnL) ? next.floatingPnL : prev.floatingPnL;
  const inResumeGuard = Date.now() < shared.resumeGuardUntil;

  const looksLikeResetTick =
    isFinitePositive(nextOpen) &&
    isFinitePositive(nextCurrent) &&
    isAlmostEqual(nextCurrent, nextOpen) &&
    isFinitePositive(prev.openPrice) &&
    isFinitePositive(prev.currentPrice) &&
    !isAlmostEqual(prev.currentPrice, prev.openPrice) &&
    Number.isFinite(nextPnl) &&
    Math.abs(nextPnl) <= 0.05;

  const ratioVsPrev =
    isFinitePositive(prev.currentPrice) && isFinitePositive(nextCurrent)
      ? nextCurrent / prev.currentPrice
      : 1;
  const looksLikeResumeGlitch =
    inResumeGuard &&
    isFinitePositive(prev.currentPrice) &&
    isFinitePositive(nextCurrent) &&
    Number.isFinite(nextPnl) &&
    Math.abs(nextPnl) <= 0.2 &&
    (ratioVsPrev < 0.5 || ratioVsPrev > 1.5);

  return {
    ...prev,
    ...next,
    accountId: next.accountId || prev.accountId,
    symbol: next.symbol && next.symbol !== "-" ? next.symbol : prev.symbol,
    volume: Number.isFinite(next.volume) && next.volume > 0 ? next.volume : prev.volume,
    openPrice: looksLikeResumeGlitch ? prev.openPrice : nextOpen,
    currentPrice: looksLikeResetTick || looksLikeResumeGlitch ? prev.currentPrice : nextCurrent,
    floatingPnL: looksLikeResetTick || looksLikeResumeGlitch ? prev.floatingPnL : nextPnl,
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
  const nestedData =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : null;
  const candidates = [
    row.positions,
    row.openPositions,
    row.open_positions,
    row.livePositions,
    row.live_positions,
    nestedData?.positions,
    nestedData?.openPositions,
    nestedData?.open_positions,
    nestedData?.livePositions,
    nestedData?.live_positions,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => normalizePosition(item))
        .filter((item): item is LivePosition => Boolean(item));
    }
  }
  if (nestedData) {
    const nestedParsed = parsePositionsFromUnknown(nestedData);
    if (nestedParsed.length > 0) return nestedParsed;
  }
  const single = normalizePosition(data);
  if (single) return [single];
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
  const nestedData =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : null;
  const candidates = [
    row.pending,
    row.pendings,
    row.pendingOrders,
    row.pending_orders,
    row.orders,
    row.liveOrders,
    row.live_orders,
    nestedData?.pending,
    nestedData?.pendings,
    nestedData?.pendingOrders,
    nestedData?.pending_orders,
    nestedData?.orders,
    nestedData?.liveOrders,
    nestedData?.live_orders,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => normalizePendingOrder(item))
        .filter((item): item is LivePending => Boolean(item));
    }
  }
  if (nestedData) {
    const nestedParsed = parsePendingsFromUnknown(nestedData);
    if (nestedParsed.length > 0) return nestedParsed;
  }
  const single = normalizePendingOrder(data);
  if (single) return [single];
  return [];
}

function applyPositionMerge(items: LivePosition[]) {
  if (items.length === 0) return;
  const next: Record<string, LivePosition> = { ...shared.positionsMap };
  for (const item of items) {
    next[item.positionId] = mergePosition(next[item.positionId], item);
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
  if (shared.healthcheckTimer) {
    window.clearInterval(shared.healthcheckTimer);
    shared.healthcheckTimer = null;
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
    debugLog("scheduleReconnect -> ensureConnected", {
      accountId: shared.accountId,
      attempt: shared.reconnectAttempts,
    });
    ensureConnected(shared.accountId);
  }, delay);
}

function ensureHealthcheckLoop() {
  if (shared.healthcheckTimer) return;
  shared.healthcheckTimer = window.setInterval(() => {
    if (!shared.shouldReconnect || !shared.accountId || shared.listeners.size === 0) return;
    if (!shared.socket || shared.socket.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (shared.lastMessageAt > 0 && now - shared.lastMessageAt > LIVE_SOCKET_STALE_MS) {
      try {
        shared.socket.close();
      } catch {
        // ignore; onclose handles reconnect
      }
    }
  }, LIVE_SOCKET_HEALTHCHECK_MS);
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
      if (hasPositionClosedMarkers(row)) continue;
      const pos = normalizePosition(row);
      if (!pos) continue;
      next[pos.positionId] = mergePosition(shared.positionsMap[pos.positionId], pos);
    }
    // REST /trade/positions is authoritative for currently open positions.
    // Replace map with reconciled rows to prune stale/closed ghost positions.
    if (Object.keys(next).length === 0 && Object.keys(shared.positionsMap).length > 0) return;
    shared.positionsMap = next;
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

function applySnapshotLikePayload(data: unknown): boolean {
  const positions = parsePositionsFromUnknown(data);
  if (positions.length > 0) {
    applyPositionMerge(positions);
    return true;
  }

  const pendings = parsePendingsFromUnknown(data);
  if (pendings.length > 0) {
    applyPendingSnapshot(pendings);
    return true;
  }

  return false;
}

function bindSocket(socket: WebSocket, accountId: string) {
  socket.onopen = () => {
    debugLog("socket.onopen", { accountId });
    shared.reconnectAttempts = 0;
    shared.lastMessageAt = Date.now();
    socket.send(
      JSON.stringify({
        type: "identify",
        accountId,
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      let message: SocketMessage;
      if (typeof event.data === "string") {
        message = JSON.parse(event.data) as SocketMessage;
      } else if (event.data && typeof event.data === "object") {
        message = event.data as SocketMessage;
      } else {
        return;
      }
      shared.lastMessageAt = Date.now();
      const messageType = String(message.type ?? "").toLowerCase();
      debugLog("socket.onmessage", { messageType });
      const payload =
        message.data && typeof message.data === "object"
          ? (message.data as Record<string, unknown>)
          : null;

      // Defensive close handling: if any message carries positionId + close marker,
      // remove immediately even when backend uses an unexpected message type.
      if (payload) {
        const pid = getPositionIdFromUnknown(payload);
        const likelyCloseEvent = messageType.includes("close") || messageType.includes("closed");
        if (pid && (likelyCloseEvent || hasPositionClosedMarkers(payload))) {
          delete shared.positionsMap[pid];
          scheduleEmit();
          return;
        }
      }

      if (messageType === "live_account" && message.data && typeof message.data === "object") {
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

      // Generic snapshots fallback for unknown message types / payload shapes.
      if (applySnapshotLikePayload(message.data)) {
        return;
      }
      if (applySnapshotLikePayload(payload)) {
        return;
      }

      if (
        (messageType === "live_accounts" || messageType === "account_snapshot") &&
        message.data &&
        typeof message.data === "object"
      ) {
        const account = normalizeLiveAccount(message.data);
        if (account) shared.account = account;
        scheduleEmit();
        return;
      }

      if (messageType === "live_position" && message.data && typeof message.data === "object") {
        const row = normalizePosition(message.data);
        if (!row || hasPositionClosedMarkers(message.data)) {
          const id = getPositionIdFromUnknown(message.data);
          if (id) delete shared.positionsMap[String(id)];
          scheduleEmit();
          return;
        }
        shared.positionsMap[row.positionId] = mergePosition(
          shared.positionsMap[row.positionId],
          row
        );
        scheduleEmit();
        return;
      }

      if (
        (messageType === "position_closed" ||
          messageType === "live_position_closed" ||
          messageType === "close_position") &&
        message.data &&
        typeof message.data === "object"
      ) {
        const id = getPositionIdFromUnknown(message.data);
        if (id) {
          delete shared.positionsMap[String(id)];
          scheduleEmit();
        }
        return;
      }

      if (
        (messageType === "live_positions" || messageType === "positions_snapshot") &&
        message.data
      ) {
        const positions = parsePositionsFromUnknown(message.data);
        // In practice these events can be partial batches, so merge to avoid
        // shrinking UI list to a single position intermittently.
        applyPositionMerge(positions);
        return;
      }

      if (messageType === "live_pending") {
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
        (messageType === "live_pendings" ||
          messageType === "pending_snapshot" ||
          messageType === "live_orders") &&
        message.data
      ) {
        const pendings = parsePendingsFromUnknown(message.data);
        applyPendingSnapshot(pendings);
        return;
      }

      if (
        messageType === "account_snapshot" &&
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

  socket.onclose = (event) => {
    debugLog("socket.onclose", { code: event.code, reason: event.reason });
    if (shared.socket === socket) {
      shared.socket = null;
    }
    if (shared.shouldReconnect) {
      scheduleReconnect();
    }
  };

  socket.onerror = (error) => {
    debugLog("socket.onerror", error);
    // onclose handles reconnect
  };
}

function ensureConnected(accountId: string, forceReconnect = false) {
  debugLog("ensureConnected called", {
    accountId,
    listeners: shared.listeners.size,
    hasSocket: Boolean(shared.socket),
    readyState: shared.socket?.readyState,
  });
  clearTimers();

  if (
    !forceReconnect &&
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

  const baseSocketUrl = buildSocketUrl("/account");
  const tradeToken = getTradeTokenFromStorageSync();
  const socketUrl =
    baseSocketUrl && tradeToken
      ? `${baseSocketUrl}${baseSocketUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(
          tradeToken
        )}`
      : baseSocketUrl;
  if (!socketUrl) {
    debugLog("ensureConnected aborted: socketUrl missing");
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
  ensureHealthcheckLoop();
}

function subscribe(listener: Listener) {
  shared.listeners.add(listener);
  if (shared.idleCloseTimer) {
    window.clearTimeout(shared.idleCloseTimer);
    shared.idleCloseTimer = null;
  }
  listener(snapshot());
  debugLog("subscribe", { listeners: shared.listeners.size, accountId: shared.accountId });

  const effectiveAccountId = shared.accountId || getEffectiveAccountId();
  if (
    effectiveAccountId &&
    (!shared.socket ||
      (shared.socket.readyState !== WebSocket.OPEN &&
        shared.socket.readyState !== WebSocket.CONNECTING))
  ) {
    ensureConnected(effectiveAccountId);
  }
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

    const handleVisibleOrResume = () => {
      if (document.visibilityState && document.visibilityState !== "visible") return;
      const next = getEffectiveAccountId(accountId);
      if (!next) return;
      shared.resumeGuardUntil = Date.now() + 2200;
      setEffectiveAccountId((prev) => (prev === next ? prev : next));
      ensureConnected(next, true);
      void reconcileFromRest();
    };

    window.addEventListener("focus", syncAccountId);
    window.addEventListener("pageshow", handleVisibleOrResume);
    window.addEventListener("online", handleVisibleOrResume);
    document.addEventListener("visibilitychange", handleVisibleOrResume);
    window.addEventListener("trade-account-change", syncAccountId);
    window.addEventListener("trade-token-change", syncAccountId);
    return () => {
      window.removeEventListener("focus", syncAccountId);
      window.removeEventListener("pageshow", handleVisibleOrResume);
      window.removeEventListener("online", handleVisibleOrResume);
      document.removeEventListener("visibilitychange", handleVisibleOrResume);
      window.removeEventListener("trade-account-change", syncAccountId);
      window.removeEventListener("trade-token-change", syncAccountId);
    };
  }, [accountId, effectiveAccountId]);

  useEffect(() => {
    if (!effectiveAccountId) return;
    ensureConnected(effectiveAccountId);
  }, [effectiveAccountId]);

  return state;
};
