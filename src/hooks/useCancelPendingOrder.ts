import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelPendingOrder } from "@/services/trade/cancelPendingOrder.service";

export const useCancelPendingOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      cancelPendingOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-live-fallback"] });
      queryClient.invalidateQueries({ queryKey: ["trade-orders"] });
    },
  });
};
