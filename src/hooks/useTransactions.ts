import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "@/services/transactions.service";

export const useTransactions = (params: {
  page: number;
  limit: number;
  type?: string;
  fromDate?: string;
}) => {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactions(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
};
