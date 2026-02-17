import api from "@/api/axios";
import tradeApi from "@/api/tradeApi";

export type AccountType = "live" | "demo";

export interface AccountPlan {
  _id: string;
  name: string;
  guidance: string;
  minDeposit: number;
  spreadPips: number;
  max_leverage: number;
  spread_type: "FLOATING" | "FIXED";
  commission_per_lot: number;
  is_demo_allowed: boolean;
  swap_enabled: boolean;
}


export interface Account {
  _id: string;
  account_number: string;
  balance: number;
  equity: number;
  account_type: AccountType;
  status: string;
}

/* Active plans */
export const getActiveAccountPlans = async (): Promise<AccountPlan[]> => {
  const res = await api.get("/account-plans/active");
  return res.data.data;
};

/* Create account */
export const createAccount = async (payload: {
  account_plan_id: string;
  account_type: AccountType;
  opening_balance?: number;
}) => {
  const res = await api.post("/accounts", payload);
  return res.data;
};

/* My accounts */
export const getMyAccounts = async (): Promise<Account[]> => {
  const res = await api.get("/accounts");
  return res.data.data;
};

/* Single account */
export const getAccountById = async (id: string) => {
  const res = await api.get(`/accounts/single/${id}`);
  return res.data.data;
};

/* Reset demo account balance */
export const resetDemoAccount = async (id: string) => {
  const res = await api.post(`/accounts/${id}/reset-demo`);
  return res.data;
};

export async function fetchTradeAccount() {
  const { data } = await tradeApi.get("/trade/account");
  return data?.data ?? data?.account ?? data?.tradeAccount ?? data ?? null;
}
