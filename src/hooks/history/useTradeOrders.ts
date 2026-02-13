import { useInfiniteQuery } from "@tanstack/react-query";
import { getTradeOrders } from "@/services/trade.service";
import type { TradeHistoryFilters } from "@/services/trade.service";

export const useTradeOrders = (options?: TradeHistoryFilters) => {
  return useInfiniteQuery({
    queryKey: ["trade-orders", "history-filter-v2", options ?? null],
    queryFn: ({ pageParam }) =>
      getTradeOrders({ pageParam, ...(options ?? {}) }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 15000,
  });
};
