const API_PATH = "/api/v1";
const DEFAULT_API_BASE_URL = "https://backend.alstrades.com/api/v1";

export function normalizeApiBaseUrl(input?: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return DEFAULT_API_BASE_URL;

  const withoutTrailingSlash = raw.replace(/\/+$/, "");

  if (
    withoutTrailingSlash.endsWith("/api") ||
    withoutTrailingSlash.endsWith("/api/v1")
  ) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}${API_PATH}`;
}
