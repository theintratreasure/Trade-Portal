import { useQuery } from "@tanstack/react-query";
import { fetchTradeAccount, getAccountById } from "@/services/accounts.service";
import { setClientCookie } from "@/lib/tradeToken";
import { useEffect, useMemo } from "react";

function getStatusFromError(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const maybeError = error as { status?: number; response?: { status?: number } };
  return maybeError.status ?? maybeError.response?.status;
}

export const useAccountById = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ["account", id],
    queryFn: () => getAccountById(id),
    enabled,                 // 👈 ONLY when expanded
    staleTime: 60_000,
  });
export const useTradeAccount = () => {
  const query = useQuery({
    queryKey: ["trade-account"],
    queryFn: fetchTradeAccount,
    staleTime: 15_000,
    gcTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      const status = getStatusFromError(error);
      if (status === 404) return false;
      return failureCount < 1;
    },
  });

  const accountId = useMemo(() => {
    const payload = query.data as Record<string, unknown> | null | undefined;
    const raw = payload?.accountId ?? payload?._id ?? payload?.id;
    return raw ? String(raw) : "";
  }, [query.data]);

  useEffect(() => {
    if (!accountId || typeof window === "undefined") return;
    const prev = localStorage.getItem("tradeAccountId");
    setClientCookie("accountId", accountId, 43200);
    localStorage.setItem("tradeAccountId", accountId);
    if (prev !== accountId) {
      window.dispatchEvent(new Event("trade-account-change"));
    }
  }, [accountId]);

  return query;
};
