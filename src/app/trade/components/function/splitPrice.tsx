import { getTradeTokenFromStorageSync as readTradeToken } from "@/lib/tradeToken";

export type SplitPrice = {
  int: string;
  normal: string;
  big: string;
  small?: string;
};

export function splitPrice(price?: string): SplitPrice {
  if (!price || isNaN(Number(price))) {
    return { int: "0", normal: "", big: "00" };
  }

  const [intPart, decimalRaw = ""] = price.split(".");
  const decimals = decimalRaw;

  if (decimals.length === 0) {
    return { int: intPart, normal: "", big: "" };
  }

  if (decimals.length === 2) {
    return { int: intPart, normal: "", big: decimals };
  }

  if (decimals.length >= 3) {
    return {
      int: intPart,
      normal: decimals.slice(0, decimals.length - 3),
      big: decimals.slice(decimals.length - 3, decimals.length - 1),
      small: decimals.slice(-1),
    };
  }

  return { int: intPart, normal: decimals, big: "" };
}
export function getTradeTokenFromStorageSync(): string {
  return readTradeToken();
}
