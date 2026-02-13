import { getActivePaymentMethods } from "@/services/paymentMethods.service";
import { useQuery } from "@tanstack/react-query";

export const useActivePaymentMethods = () =>
  useQuery({
    queryKey: ["active-payment-methods"],
    queryFn: getActivePaymentMethods,
    staleTime: 5 * 60 * 1000,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
