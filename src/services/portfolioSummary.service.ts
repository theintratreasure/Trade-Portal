import api from "@/api/axios";

export type PortfolioOverview = {
  totalPortfolioValue: number;
  todayChangePercent: number;
  walletBalance: number;
  openProfit: number;
  drawdownPercent: number;
  activeTrades: number;
  totalAccounts: number;
  activeAccounts: number;
  totalEquity: number;
  totalHoldBalance: number;
  currency: string;
};

export type PerformanceSnapshot = {
  winRate: number;
  avgTradeDuration: string;
  avgTradeDurationMs: number;
  bestTrade: number;
  worstTrade: number;
  totalClosedTrades: number;
};

export type PortfolioSummary = {
  overview: PortfolioOverview;
  performanceSnapshot: PerformanceSnapshot;
};

export async function fetchPortfolioSummary(): Promise<PortfolioSummary | null> {
  const res = await api.get("/trade/portfolio-summary");
  return res.data?.data ?? null;
}

