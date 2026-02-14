import { useMutation, useQuery } from "@tanstack/react-query";
import {
  convertAmount,
  ConvertPayload,
  getConversionRates,
} from "@/services/conversion.service";

export const useConvertAmount = () =>
  useMutation({
    mutationFn: (payload: ConvertPayload) => convertAmount(payload),
  });

export const useConversionRates = () =>
  useQuery({
    queryKey: ["conversion-rates"],
    queryFn: getConversionRates,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

