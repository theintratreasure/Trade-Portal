import { useMutation, useQuery } from "@tanstack/react-query";
import { submitKyc, getMyKyc } from "@/services/kyc.service";
import { SubmitKycPayload, KycResponse } from "@/types/kyc";

export const useMyKyc = () =>
  useQuery<KycResponse>({
    queryKey: ["my-kyc"],
    queryFn: getMyKyc,
    retry: false,
  });

export const useSubmitKyc = () =>
  useMutation<KycResponse, Error, SubmitKycPayload>({
    mutationFn: submitKyc,
  });
