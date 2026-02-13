import { normalizeApiBaseUrl } from "@/api/baseUrl";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function removeApiSuffix(pathname: string): string {
  return pathname.replace(/\/api(?:\/v1)?\/?$/i, "");
}

function resolveWebSocketProtocol(protocol: string): "ws:" | "wss:" {
  if (protocol === "https:" || protocol === "wss:") return "wss:";
  return "ws:";
}

function parseUrlOrNull(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function buildSocketBaseFromApiUrl(apiUrl: string): string | null {
  const parsed = parseUrlOrNull(apiUrl);
  if (!parsed) return null;
  parsed.protocol = resolveWebSocketProtocol(parsed.protocol);
  parsed.pathname = `${removeApiSuffix(parsed.pathname)}/ws`;
  parsed.search = "";
  parsed.hash = "";
  return trimTrailingSlash(parsed.toString());
}

export function getSocketBaseUrl(): string {
  const rawSocketBase = (process.env.NEXT_PUBLIC_SOKETAPIBASE_URL ?? "").trim();
  if (rawSocketBase) {
    const parsedSocket = parseUrlOrNull(rawSocketBase);
    if (parsedSocket) {
      const pageProtocol =
        typeof window !== "undefined" ? window.location.protocol : parsedSocket.protocol;
      parsedSocket.protocol = resolveWebSocketProtocol(pageProtocol);
      return trimTrailingSlash(parsedSocket.toString());
    }
    return trimTrailingSlash(rawSocketBase);
  }

  const normalizedApiBase = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const fromApi = buildSocketBaseFromApiUrl(normalizedApiBase);
  if (fromApi) return fromApi;

  if (typeof window !== "undefined") {
    const protocol = resolveWebSocketProtocol(window.location.protocol);
    return `${protocol}//${window.location.host}/ws`;
  }

  return "";
}

export function buildSocketUrl(pathname: string): string {
  const base = getSocketBaseUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${normalizedPath}`;
}
