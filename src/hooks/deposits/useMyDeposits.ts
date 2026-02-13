import { useQuery } from "@tanstack/react-query";
import { getMyDeposits } from "@/services/deposits.service";

export const useMyDeposits = (page: number, limit = 10) =>
  useQuery({
    queryKey: ["my-deposits", page, limit],
    queryFn: () => getMyDeposits({ page, limit }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
