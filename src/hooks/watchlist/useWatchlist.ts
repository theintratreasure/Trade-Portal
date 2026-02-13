import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWatchlist,
  searchInstruments,
  fetchBySegment,
  addToWatchlist,
  removeFromWatchlist,
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

  const add = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const remove = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  return { add, remove };
}
