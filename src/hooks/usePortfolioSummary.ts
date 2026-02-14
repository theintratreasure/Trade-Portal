import { useQuery } from "@tanstack/react-query";
import { fetchPortfolioSummary } from "@/services/portfolioSummary.service";

export const usePortfolioSummary = () =>
  useQuery({
    queryKey: ["portfolio-summary"],
    queryFn: fetchPortfolioSummary,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  });

