import { setTradeTokenCookie } from "./tradeToken";

export const setTradeSession = (data: {
  tradeToken: string;
  sessionType: string;
  account_number: string;
  accountId?: string;
}) => {
  setTradeTokenCookie(data.tradeToken, 900);
  document.cookie = `tradeSessionType=${data.sessionType}; path=/; max-age=900`;
  document.cookie = `tradeAccount=${data.account_number}; path=/; max-age=900`;
};
