function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function shouldUseSecureCookie(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function setClientCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const secure = shouldUseSecureCookie() ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax${secure}`;
}

export function clearClientCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const row = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!row) return null;

  const raw = row.slice(prefix.length);
  if (!raw) return null;

  return safeDecode(raw);
}

export function getTradeTokenFromStorageSync(): string {
  if (typeof window === "undefined") return "";

  // Trade APIs must prefer the dedicated trade cookie token.
  const cookieToken = getCookieValue("tradeToken");
  if (cookieToken) return cookieToken;

  const localTradeToken = localStorage.getItem("tradeToken");
  if (localTradeToken) return localTradeToken;

  // Legacy fallback for older builds that stored trade token in accessToken.
  const legacy = localStorage.getItem("accessToken");
  if (legacy) return legacy;
  return "";
}

export function setTradeTokenCookie(token: string, maxAgeSeconds = 43200) {
  if (typeof document === "undefined") return;
  setClientCookie("tradeToken", token, maxAgeSeconds);
  if (typeof window !== "undefined") {
    localStorage.setItem("tradeToken", token);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("trade-token-change"));
  }
}

export function clearTradeTokenCookie(options?: { silent?: boolean }) {
  if (typeof document === "undefined") return;
  clearClientCookie("tradeToken");
  if (typeof window !== "undefined") {
    localStorage.removeItem("tradeToken");
    if (!options?.silent) {
      window.dispatchEvent(new Event("trade-token-change"));
    }
  }
}
