import api from "@/api/axios";

export interface Transaction {
  _id: string;
  type: string;
  amount: number;
  account: string;
  accountNumber: string;
  balanceAfter: number;
  status: string;
  createdAt: string;
  remark: string;
}

export interface TransactionResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchTransactions = async ({
  page = 1,
  limit = 10,
  type,
  fromDate,
}: {
  page?: number;
  limit?: number;
  type?: string;
  fromDate?: string;
}): Promise<TransactionResponse> => {
  const params: any = { page, limit };

  if (type) params.type = type;
  if (fromDate) params.fromDate = fromDate;

  const res = await api.get("/transactions", { params });

  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};
