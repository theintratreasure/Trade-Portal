import { useQuery } from "@tanstack/react-query";
import { getTradeSummary } from "@/services/trade.service";

export const useTradeSummary = () => {
  return useQuery({
    queryKey: ["trade-summary"],
    queryFn: getTradeSummary,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};
