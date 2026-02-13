import { useInfiniteQuery } from "@tanstack/react-query";
import { getTradePositions } from "@/services/trade.service";
import type { TradeHistoryFilters } from "@/services/trade.service";

export const useTradePositions = (options?: TradeHistoryFilters) => {
  return useInfiniteQuery({
    queryKey: ["trade-positions", "history-filter-v2", options ?? null],
    queryFn: ({ pageParam }) =>
      getTradePositions({ pageParam, ...(options ?? {}) }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 5000,
  });
};
