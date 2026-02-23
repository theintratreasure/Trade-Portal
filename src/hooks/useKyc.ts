import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submitKyc, getMyKyc } from "@/services/kyc.service";
import { SubmitKycPayload, KycResponse } from "@/types/kyc";

export const useMyKyc = () =>
  useQuery<KycResponse>({
    queryKey: ["my-kyc"],
    queryFn: getMyKyc,
    retry: false,
  });

export const useSubmitKyc = () => {
  const queryClient = useQueryClient();

  return useMutation<KycResponse, Error, SubmitKycPayload>({
    mutationFn: submitKyc,
    onSuccess: (data) => {
      queryClient.setQueryData(["my-kyc"], data);
      queryClient.invalidateQueries({ queryKey: ["my-kyc"] });
    },
  });
};
