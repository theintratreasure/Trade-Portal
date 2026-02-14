import api from "@/api/axios";

export type DepositMethod = "UPI" | "BANK" | "CRYPTO" | "USDT";

export interface DepositPayload {
  account: string;
  amount: number;
  method: DepositMethod;
  proof: {
    image_url: string;
    image_public_id: string;
  };
   ipAddress: string; 
}

/* Create deposit */
export const createDeposit = async (payload: DepositPayload) => {
  const res = await api.post("/deposits", payload);
  return res.data;
};

/* My deposits (paginated) */
export const getMyDeposits = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const res = await api.get("/deposits/my", {
    params: { page, limit },
  });

  return {
    items: res.data.data,
    pagination: res.data.pagination,
  };
};


/* Single deposit status */
export const getDepositStatus = async (id: string) => {
  const res = await api.get(`/deposits/${id}/status`);
  return res.data.data;
};
