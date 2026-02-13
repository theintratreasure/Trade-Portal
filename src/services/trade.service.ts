import tradeApi from "@/api/tradeApi";

export type HistoryFilterType = "all" | "today" | "lastweek" | "last3month" | "custom";

export type TradeHistoryFilters = {
  symbol?: string | null;
  side?: "BUY" | "SELL" | null;
  filter?: HistoryFilterType | null;
  from?: string | null;
  to?: string | null;
};

export const getTradeSummary = async () => {
  const { data } = await tradeApi.get("/trade/summary");
  return data?.summary ?? data?.data?.summary ?? null;
};

export const getTradePositions = async ({
  pageParam = 1,
  symbol,
  side,
  filter,
  from,
  to,
}: { pageParam?: number } & TradeHistoryFilters = {}) => {
  const { data } = await tradeApi.get("/trade/positions", {
    params: {
      page: pageParam,
      limit: 20,
      ...(symbol ? { symbol } : {}),
      ...(side ? { side } : {}),
      ...(filter ? { filter } : {}),
      ...(filter === "custom" && from ? { from } : {}),
      ...(filter === "custom" && to ? { to } : {}),
    },
  });

  return {
    positions: data?.positions ?? data?.data?.positions ?? [],
    nextPage:
      pageParam < (data?.pagination?.totalPages ?? data?.data?.pagination?.totalPages ?? pageParam)
        ? pageParam + 1
        : undefined,
  };
};

export const getTradeOrders = async ({
  pageParam = 1,
  symbol,
  side,
  filter,
  from,
  to,
}: {
  pageParam?: number;
} & TradeHistoryFilters = {}) => {
  const { data } = await tradeApi.get("/trade/orders", {
    params: {
      page: pageParam,
      limit: 20,
      ...(symbol ? { symbol } : {}),
      ...(side ? { side } : {}),
      ...(filter ? { filter } : {}),
      ...(filter === "custom" && from ? { from } : {}),
      ...(filter === "custom" && to ? { to } : {}),
    },
  });

  return {
    orders: data?.orders ?? data?.data?.orders ?? [],
    summary: data?.summary ?? data?.data?.summary ?? null,
    nextPage:
      pageParam < (data?.pagination?.totalPages ?? data?.data?.pagination?.totalPages ?? pageParam)
        ? pageParam + 1
        : undefined,
  };
};


export const getTradeDeals = async ({
  pageParam = 1,
  symbol,
  side,
  filter,
  from,
  to,
}: { pageParam?: number } & TradeHistoryFilters = {}) => {
  const { data } = await tradeApi.get("/trade/deals", {
    params: {
      page: pageParam,
      limit: 20,
      ...(symbol ? { symbols: symbol } : {}),
      ...(side ? { side } : {}),
      ...(filter ? { filter } : {}),
      ...(filter === "custom" && from ? { from } : {}),
      ...(filter === "custom" && to ? { to } : {}),
    },
  });

  return {
    deals: data?.deals ?? data?.data?.deals ?? [],
    nextPage:
      pageParam < (data?.pagination?.totalPages ?? data?.data?.pagination?.totalPages ?? pageParam)
        ? pageParam + 1
        : undefined,
  };
};
