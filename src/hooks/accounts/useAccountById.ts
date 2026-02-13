import { useQuery } from "@tanstack/react-query";
import { fetchTradeAccount, getAccountById } from "@/services/accounts.service";
import { setClientCookie } from "@/lib/tradeToken";

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
export const useTradeAccount = () =>
  useQuery({
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
    select: (payload: unknown) => {
      const row =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : null;
      const accountId = row?.accountId ?? row?._id ?? row?.id;
      if (accountId && typeof window !== "undefined") {
        const id = String(accountId);
        const prev = localStorage.getItem("tradeAccountId");
        setClientCookie("accountId", id, 43200);
        localStorage.setItem("tradeAccountId", id);
        if (prev !== id) {
          window.dispatchEvent(new Event("trade-account-change"));
        }
      }
      return payload;
    },
  });
