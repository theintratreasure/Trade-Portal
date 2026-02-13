import { useQuery } from "@tanstack/react-query";
import { getMyAccounts } from "@/services/accounts.service";

export const useMyAccounts = () =>
  useQuery({
    queryKey: ["my-accounts"],
    queryFn: getMyAccounts,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
