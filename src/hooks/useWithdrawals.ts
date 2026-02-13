import { useQuery } from "@tanstack/react-query";
import { getWithdrawals } from "@/services/withdrawal.service";

export const useWithdrawals = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["withdrawals", page, limit],
    queryFn: () => getWithdrawals(page, limit),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
};
