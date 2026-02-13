import { useQuery } from "@tanstack/react-query";
import { internalTransferService } from "@/services/internalTransfer.service";

export const useInternalTransferHistory = (
  page: number,
  limit: number
) => {
  return useQuery({
    queryKey: ["internal-transfer-history", page, limit],
    queryFn: () =>
      internalTransferService.getTransferHistory({ page, limit }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
};
