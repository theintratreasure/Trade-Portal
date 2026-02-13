// services/marketSocket.service.ts
import { buildSocketUrl, getSocketBaseUrl } from "@/lib/socketUrl";

export class MarketSocket {
  private socket: WebSocket | null = null;
  private pendingSubscriptions: Set<string> = new Set();
  private urlBase: string;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private onMessageCb: ((m: unknown) => void) | null = null;
  private tokenInUrl: string | null = null;
  private shouldReconnect = false;

  constructor() {
    this.urlBase = getSocketBaseUrl();
  }

  connect(token: string, onMessage: (msg: unknown) => void) {
    this.onMessageCb = onMessage;
    this.tokenInUrl = token;
    this.shouldReconnect = true;

    // close existing socket first (safe)
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = null;
    }

    const encoded = encodeURIComponent(token);
    const base = this.urlBase || getSocketBaseUrl();
    const url = `${buildSocketUrl("/market")}?token=${encoded}`;

    try {
      this.socket = new WebSocket(url || `${base}/market?token=${encoded}`);
    } catch (e) {
      console.warn("[MarketSocket] websocket creation failed", e);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      // flush pending subs
      this.pendingSubscriptions.forEach((symbol) => {
        this.sendSubscribe(symbol);
      });
      console.debug("[MarketSocket] connected, flushed subscriptions:", Array.from(this.pendingSubscriptions));
    };

    this.socket.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (this.onMessageCb) this.onMessageCb(parsed);
      } catch (err) {
        console.warn("[MarketSocket] failed to parse message", err);
      }
    };

    this.socket.onclose = (ev) => {
      console.warn("[MarketSocket] closed", ev);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (ev) => {
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

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({
          type: "unsubscribe",
          market: "crypto",
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
      this.socket?.send(JSON.stringify({
        type: "subscribe",
        market: "crypto",
        symbol,
        depth: 1,
      }));
    } catch (e) {
      console.warn("[MarketSocket] sendSubscribe failed, queuing", symbol, e);
      this.pendingSubscriptions.add(symbol);
    }
  }

  close() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
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
      this.connect(this.tokenInUrl, this.onMessageCb);
    }, delay);
  }

  // helper: check open state
  isOpen() {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}
