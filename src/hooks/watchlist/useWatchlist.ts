import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWatchlist,
  searchInstruments,
  fetchBySegment,
  addToWatchlist,
  removeFromWatchlist,
  WatchlistItem,
} from "@/services/watchlist.service";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";

export function useWatchlist() {
  const token = getTradeTokenFromStorageSync();

  return useQuery({
    queryKey: ["watchlist", token || null],
    queryFn: async () => {
      return fetchWatchlist(50, token || undefined);
    },
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });
}

/* SEARCH */
export function useInstrumentSearch(query: string) {
  return useQuery({
    queryKey: ["instrument-search", query],
    queryFn: () => searchInstruments(query),
    enabled: query.length >= 2,
  });
}

/* SEGMENT */
export function useSegmentInstruments(segment: string | null) {
  return useQuery({
    queryKey: ["segment", segment],
    queryFn: () => fetchBySegment(segment!),
    enabled: !!segment,
  });
}

/* ACTIONS */
export function useWatchlistActions() {
  const qc = useQueryClient();
  const token = getTradeTokenFromStorageSync();
  const watchlistQueryKey = ["watchlist", token || null] as const;

  const add = useMutation({
    mutationFn: addToWatchlist,
    onMutate: async (code) => {
      await qc.cancelQueries({ queryKey: watchlistQueryKey });
      const previous = qc.getQueryData<WatchlistItem[]>(watchlistQueryKey) ?? [];

      qc.setQueryData<WatchlistItem[]>(watchlistQueryKey, (current = []) => {
        if (current.some((item) => item.code === code)) return current;
        return [
          ...current,
          {
            _id: `optimistic-${code}`,
            code,
            name: code,
            isAdded: true,
          },
        ];
      });

      return { previous };
    },
    onError: (_error, _code, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(watchlistQueryKey, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: watchlistQueryKey });
    },
  });

  const remove = useMutation({
    mutationFn: removeFromWatchlist,
    onMutate: async (code) => {
      await qc.cancelQueries({ queryKey: watchlistQueryKey });
      const previous = qc.getQueryData<WatchlistItem[]>(watchlistQueryKey) ?? [];

      qc.setQueryData<WatchlistItem[]>(
        watchlistQueryKey,
        (current = []) => current.filter((item) => item.code !== code)
      );

      return { previous };
    },
    onError: (_error, _code, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(watchlistQueryKey, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: watchlistQueryKey });
    },
  });

  return { add, remove };
}
