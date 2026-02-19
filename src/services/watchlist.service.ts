import tradeApi from "@/api/tradeApi";

export type WatchlistItem = {
  _id: string;
  code: string;
  name: string;
  isAdded: boolean;
};

export type InstrumentItem = {
  code: string;
  name: string;
  segment: string;
  isAdded?: boolean;
};

const SEGMENT_ALIASES: Record<string, string[]> = {
  INDICES: ["INDICES", "INDEX"],
  INDEX: ["INDEX", "INDICES"],
  METAL: ["METAL", "METALS"],
  METALS: ["METALS", "METAL"],
};

export async function fetchWatchlist(limit = 50, token?: string): Promise<WatchlistItem[]> {
  try {
    const config: Record<string, unknown> = { params: { limit } };

    // If token provided, attach Authorization header (works with bearer tokens).
    // If your API uses cookies/session, token can be omitted.
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    const { data } = await tradeApi.get("/watchlist", config);

    // Defensive: ensure we always return an array
    if (!data || !data.data) {
      console.warn("[fetchWatchlist] unexpected response", data);
      return [];
    }

    return data.data;
  } catch (err) {
    console.error("[fetchWatchlist] error", err);
    // Return empty array rather than throwing, to keep UI stable.
    return [];
  }
}

export async function searchInstruments(query: string, limit = 200) {
  const { data } = await tradeApi.get(
    "/watchlist/search/instruments",
    {
      params: { q: query, limit },
    }
  );

  return data.data;
}

export async function fetchBySegment(
  segment: string,
  limit = 200
) {
  const normalized = String(segment ?? "").trim().toUpperCase();
  const aliases = Array.from(
    new Set([...(SEGMENT_ALIASES[normalized] ?? []), normalized].filter(Boolean))
  );

  const responses = await Promise.allSettled(
    aliases.map((key) =>
      tradeApi.get(`/watchlist/segment/${encodeURIComponent(key)}`, {
        params: { limit },
      })
    )
  );

  const merged = new Map<string, InstrumentItem>();
  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    const list = result.value?.data?.data;
    if (!Array.isArray(list)) continue;
    for (const item of list as InstrumentItem[]) {
      const code = String(item?.code ?? "").trim().toUpperCase();
      if (!code || merged.has(code)) continue;
      merged.set(code, item);
    }
  }

  return Array.from(merged.values());
}

export async function addToWatchlist(code: string) {
  const { data } = await tradeApi.post("/watchlist/add", {
    code,
  });

  return data.data;
}

export async function removeFromWatchlist(code: string) {
  const { data } = await tradeApi.delete(
    `/watchlist/remove/${code}`
  );

  return data.data;
}
