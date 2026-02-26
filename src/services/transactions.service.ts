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
  const isSwap = (tx: Transaction) => String(tx?.type || "").toUpperCase() === "SWAP";
  const baseParams: { type?: string; fromDate?: string } = {};
  if (type) baseParams.type = type;
  if (fromDate) baseParams.fromDate = fromDate;

  // Keep each UI page filled with `limit` rows even after hiding SWAP transactions.
  const targetStart = Math.max(0, (page - 1) * limit);
  const targetEnd = targetStart + limit;
  const apiLimit = Math.max(50, limit);

  let apiPage = 1;
  let rawTotal = Number.POSITIVE_INFINITY;
  let rawTotalPages = Number.POSITIVE_INFINITY;
  let safeLoop = 0;
  const nonSwapRows: Transaction[] = [];
  let firstPagination: { page: number; limit: number; total: number; totalPages: number } | null = null;

  while (nonSwapRows.length < targetEnd && safeLoop < 200 && apiPage <= rawTotalPages) {
    const params = { page: apiPage, limit: apiLimit, ...baseParams };
    const res = await api.get("/transactions", { params });
    const rows = Array.isArray(res.data?.data) ? (res.data.data as Transaction[]) : [];

    if (typeof res.data?.pagination?.total === "number") {
      rawTotal = res.data.pagination.total;
    }
    if (typeof res.data?.pagination?.totalPages === "number") {
      rawTotalPages = res.data.pagination.totalPages;
    } else if (Number.isFinite(rawTotal)) {
      rawTotalPages = Math.max(1, Math.ceil(rawTotal / apiLimit));
    }
    if (!firstPagination && res.data?.pagination) {
      firstPagination = res.data.pagination;
    }

    nonSwapRows.push(...rows.filter((tx) => !isSwap(tx)));

    if (rows.length === 0) break;
    apiPage += 1;
    safeLoop += 1;
  }

  const pageRows = nonSwapRows.slice(targetStart, targetEnd);

  return {
    data: pageRows,
    pagination: firstPagination ?? {
      page,
      limit,
      total: pageRows.length,
      totalPages: 1,
    },
  };
};
