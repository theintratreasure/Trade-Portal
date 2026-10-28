"use client";

import { useQuery } from "@tanstack/react-query";
import { getEnabledWithdrawMethods } from "@/services/withdrawMethods.service";

export const useWithdrawMethods = () =>
  useQuery({
    queryKey: ["withdraw-methods"],
    queryFn: getEnabledWithdrawMethods,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
