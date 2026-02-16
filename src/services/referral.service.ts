import api from "@/api/axios";

export interface ReferralSummary {
  referralCode: string;
  totalReferrals: number;
  referralBalance: number;
  totalEarned: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface ReferralReward {
  rewardId: string;
  amount: number;
  status: string;
  createdAt?: string;
  referredUser?: string;
  raw: Record<string, unknown>;
}

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type UnknownRecord = Record<string, unknown>;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function extractRewardsArray(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.map(asRecord);
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const candidates: unknown[] = [
    root.rewards,
    root.items,
    data.rewards,
    data.items,
    data.list,
    data.results,
    data,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item.map(asRecord);
  }
  return [];
}

export const getReferralSummary = async (): Promise<ReferralSummary> => {
  const res = await api.get<ApiEnvelope<UnknownRecord>>("/referrals/summary");
  const data = asRecord(res.data?.data);
  return {
    referralCode: toString(data.referralCode),
    totalReferrals: toNumber(data.totalReferrals),
    referralBalance: toNumber(data.referralBalance),
    totalEarned: toNumber(data.totalEarned),
    pendingCount: toNumber(data.pendingCount),
    pendingAmount: toNumber(data.pendingAmount),
  };
};

export const getReferralRewards = async (): Promise<ReferralReward[]> => {
  const res = await api.get("/referrals/rewards");
  const rows = extractRewardsArray(res.data);

  return rows.map((row) => ({
    rewardId: toString(row.rewardId || row._id || row.id),
    amount: toNumber(row.amount || row.rewardAmount || row.pendingAmount),
    status: toString(row.status || row.claimStatus || row.state, "PENDING"),
    createdAt: toString(row.createdAt || row.updatedAt || row.date, ""),
    referredUser: toString(
      row.referredUserName || row.referredUser || row.referralUser || row.email,
      ""
    ),
    raw: row,
  }));
};

export const requestReferralReward = async (payload: {
  rewardId: string;
  accountId: string;
}) => {
  const res = await api.post<ApiEnvelope<UnknownRecord>>("/referrals/request", payload);
  return res.data;
};
