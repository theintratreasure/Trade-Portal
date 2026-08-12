import { ClosePositionPayload, closePositionService } from "@/services/trade/closePosition.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useClosePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClosePositionPayload) =>
      closePositionService(payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["livePositions"] }),
        queryClient.invalidateQueries({ queryKey: ["account"] }),
        queryClient.invalidateQueries({ queryKey: ["trade-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["trade-deals"] }),
        queryClient.invalidateQueries({ queryKey: ["trade-positions"] }),
        queryClient.invalidateQueries({ queryKey: ["trade-orders"] }),
      ]);
    },
  });
};
