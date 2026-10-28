import api from "@/api/axios";

export type WithdrawMethodField = {
  key: string;
  label: string;
  required: boolean;
};

export type EnabledWithdrawMethod = {
  code: string;
  label: string;
  description?: string;
  fields: WithdrawMethodField[];
};

export async function getEnabledWithdrawMethods() {
  try {
    const { data } = await api.get<{
      success: boolean;
      message?: string;
      data: { brokerId: string | null; enabledMethods: EnabledWithdrawMethod[] };
    }>("/withdraw-methods");
    if (!data?.success) {
      throw new Error(data?.message || "Failed to load withdrawal methods");
    }
    return data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load withdrawal methods";
    throw new Error(message);
  }
}
