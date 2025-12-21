import api from "@/api/axios";
import { SubmitKycPayload, KycResponse } from "@/types/kyc";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function submitKyc(
  payload: SubmitKycPayload
): Promise<KycResponse> {
  const { data } = await api.post<ApiResponse<KycResponse>>(
    "/kyc",
    payload
  );
  return data.data;
}

export async function getMyKyc(): Promise<KycResponse> {
  const { data } = await api.get<ApiResponse<KycResponse>>(
    "/kyc/me"
  );
  return data.data;
}
