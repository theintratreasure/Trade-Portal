import api from "@/api/axios";

export interface PaymentMethod {
  _id: string;
  type: "UPI" | "BANK" | "CRYPTO" | "INTERNATIONAL";
  title: string;
  upi_id?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  ifsc?: string;
  swift_code?: string;
  crypto_network?: string;
  crypto_address?: string;
  international_name?: string;
  international_email?: string;
  image_url?: string;
}

export const getActivePaymentMethods = async (): Promise<PaymentMethod[]> => {
  const res = await api.get("/payment-methods/active");
  return res.data.data;
};
