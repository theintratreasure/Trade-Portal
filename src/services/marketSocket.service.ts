// services/marketSocket.service.ts
import { buildSocketUrl, getSocketBaseUrl } from "@/lib/socketUrl";

export class MarketSocket {
  private socket: WebSocket | null = null;
  private pendingSubscriptions: Set<string> = new Set();
  private sentSubscriptions: Set<string> = new Set();
  private urlBase: string;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private onMessageCb: ((m: unknown) => void) | null = null;
  private tokenInUrl: string | null = null;
  private shouldReconnect = false;
  private accountId: string | null = null;

  constructor() {
    this.urlBase = getSocketBaseUrl();
  }

  connect(token: string, onMessage: (msg: unknown) => void, accountId?: string) {
    this.onMessageCb = onMessage;
    this.tokenInUrl = token;
    this.shouldReconnect = true;
    this.accountId = accountId && accountId.length > 0 ? accountId : null;

    // close existing socket first (safe)
    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.close();
      } catch {}
      this.socket = null;
    }

    const encoded = encodeURIComponent(token);
    const base = this.urlBase || getSocketBaseUrl();
    const url = `${buildSocketUrl("/market")}?token=${encoded}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url || `${base}/market?token=${encoded}`);
    } catch (e) {
      console.warn("[MarketSocket] websocket creation failed", e);
      this.scheduleReconnect();
      return;
    }
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      this.reconnectAttempts = 0;
      this.sentSubscriptions.clear();
      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.sendJoinMarket();
      // flush pending subs
      this.pendingSubscriptions.forEach((symbol) => {
        this.sendSubscribe(symbol);
      });
      console.debug("[MarketSocket] connected, flushed subscriptions:", Array.from(this.pendingSubscriptions));
    };

    ws.onmessage = (ev) => {
      if (this.socket !== ws) return;
      try {
        const parsed = JSON.parse(ev.data);
        if (this.onMessageCb) this.onMessageCb(parsed);
      } catch (err) {
        console.warn("[MarketSocket] failed to parse message", err);
      }
    };

    ws.onclose = (ev) => {
      if (this.socket !== ws) return;
      console.warn("[MarketSocket] closed", ev);
      this.socket = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = (ev) => {
      if (this.socket !== ws) return;
      console.warn("[MarketSocket] error", ev);
      // allow onclose to handle reconnect/backoff
    };
  }

  subscribe(symbol: string) {
    this.pendingSubscriptions.add(symbol);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendSubscribe(symbol);
    } else {
      console.debug("[MarketSocket] queued subscribe", symbol);
    }
  }

  unsubscribe(symbol: string) {
    this.pendingSubscriptions.delete(symbol);
    this.sentSubscriptions.delete(symbol);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({
          type: "unsubscribe",
          market: getMarketBySymbol(symbol),
          symbol,
        }));
      } catch (e) {
        console.warn("[MarketSocket] unsubscribe send failed", e);
      }
    } else {
      console.debug("[MarketSocket] unsubscribed from pending", symbol);
    }
  }

  private sendSubscribe(symbol: string) {
    try {
      if (this.sentSubscriptions.has(symbol)) return;
      const market = getMarketBySymbol(symbol);
      const payload: {
        type: "subscribe";
        market: string;
        symbol: string;
        depth: number;
        accountId?: string;
      } = {
        type: "subscribe",
        market,
        symbol,
        depth: 1,
      };

      if (this.accountId) {
        payload.accountId = this.accountId;
      }

      this.socket?.send(JSON.stringify(payload));
      this.sentSubscriptions.add(symbol);
    } catch (e) {
      console.warn("[MarketSocket] sendSubscribe failed, queuing", symbol, e);
      this.pendingSubscriptions.add(symbol);
    }
  }

  setAccountId(accountId?: string) {
    const normalized = accountId && accountId.length > 0 ? accountId : null;
    if (normalized === this.accountId) return;
    this.accountId = normalized;
    // Re-subscribe all tracked symbols so backend rebinds spread to this account.
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sentSubscriptions.clear();
      this.pendingSubscriptions.forEach((symbol) => {
        this.sendSubscribe(symbol);
      });
    }
  }

  private sendJoinMarket() {
    try {
      this.socket?.send(
        JSON.stringify({
          type: "join",
          route: "market",
        })
      );
    } catch (e) {
      console.warn("[MarketSocket] join market failed", e);
    }
  }

  close() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      if (this.socket) {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
      }
      this.socket?.close();
    } catch {}
    this.socket = null;
  }

  private scheduleReconnect() {
    this.reconnectAttempts = Math.min(10, this.reconnectAttempts + 1);
    const delay = Math.min(30000, 500 * Math.pow(1.6, this.reconnectAttempts));
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.tokenInUrl || !this.onMessageCb) return;
      console.debug("[MarketSocket] attempting reconnect, attempt", this.reconnectAttempts);
      this.connect(this.tokenInUrl, this.onMessageCb, this.accountId || undefined);
    }, delay);
  }

  // helper: check open state
  isOpen() {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export function getMarketBySymbol(symbol: string): string {
  const normalized = String(symbol ?? "").trim().toUpperCase();
  if (!normalized) return "crypto";

  if (
    normalized.startsWith("XAU") ||
    normalized.startsWith("XAG") ||
    normalized.startsWith("XPT") ||
    normalized.startsWith("XPD") ||
    normalized === "GOLD" ||
    normalized === "SILVER"
  ) {
    return "metal";
  }

  if (normalized.endsWith("USDT")) return "crypto";

  if (
    normalized.endsWith("USD") ||
    normalized.endsWith("JPY") ||
    normalized.endsWith("EUR") ||
    normalized.endsWith("GBP") ||
    normalized.endsWith("AUD") ||
    normalized.endsWith("CAD") ||
    normalized.endsWith("CHF") ||
    normalized.endsWith("NZD")
  ) {
    return "forex";
  }

  return "crypto";
}
