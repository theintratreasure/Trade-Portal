import api from "@/api/axios";

export type CurrencyCode = "INR" | "USDT" | "BTC" | "USD" | "AED" | "EUR" | "GBP" | "LOCAL";

export type ConvertPayload = {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: "USDT";
};

export type ConvertResponse = {
  success: boolean;
  data: {
    amount: number;
    fromCurrency: CurrencyCode;
    toCurrency: "USDT";
    convertedAmount: number;
    intermediateUsdt?: number;
    rates: {
      usdtInr: number;
      btcUsdt: number;
      updatedAt: string;
    };
  };
};

export type ConversionRatesResponse = {
  success: boolean;
  data: {
    usdtInr: number;
    btcUsdt: number;
    updatedAt: string;
  };
};

export const convertAmount = async (payload: ConvertPayload) => {
  const { data } = await api.post<ConvertResponse>("/conversion/convert", payload);
  return data;
};

export const getConversionRates = async () => {
  const { data } = await api.get<ConversionRatesResponse>("/conversion/rates");
  return data;
};
