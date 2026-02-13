import { useInfiniteQuery } from "@tanstack/react-query";
import { getTradeDeals } from "@/services/trade.service";
import type { TradeHistoryFilters } from "@/services/trade.service";

export const useTradeDeals = (options?: TradeHistoryFilters) => {
  return useInfiniteQuery({
    queryKey: ["trade-deals", "history-filter-v2", options ?? null],
    queryFn: ({ pageParam }) =>
      getTradeDeals({ pageParam, ...(options ?? {}) }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 15000,
  });
};
