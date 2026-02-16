import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReferralRewards,
  getReferralSummary,
  requestReferralReward,
} from "@/services/referral.service";

export const useReferralSummary = () =>
  useQuery({
    queryKey: ["referral-summary"],
    queryFn: getReferralSummary,
    staleTime: 1000 * 60 * 2,
  });

export const useReferralRewards = () =>
  useQuery({
    queryKey: ["referral-rewards"],
    queryFn: getReferralRewards,
  });

export const useRequestReferralReward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestReferralReward,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-summary"] });
      qc.invalidateQueries({ queryKey: ["referral-rewards"] });
    },
  });
};
