"use client";

import { useMemo, useState } from "react";
import { Copy, Gift, HandCoins, Link as LinkIcon, Users } from "lucide-react";
import Select from "@/app/components/ui/Select";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import { Toast } from "@/app/components/ui/Toast";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import {
  useReferralRewards,
  useReferralSummary,
  useRequestReferralReward,
} from "@/hooks/useReferral";
import type { ReferralReward } from "@/services/referral.service";

type ToastState = { message: string; type: "success" | "error" } | null;
type AccountItem = { _id: string; account_type?: string; account_number?: string; balance?: number };

function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const row = error as { response?: { data?: { message?: string } }; message?: string };
    return row.response?.data?.message || row.message || "Request failed.";
  }
  return "Request failed.";
}

function isClaimable(reward: ReferralReward): boolean {
  const status = String(reward.status || "").toUpperCase();
  if (!status) return true;
  if (["CLAIMED", "PAID", "COMPLETED", "SUCCESS"].includes(status)) return false;
  if (["REQUESTED", "PROCESSING", "IN_REVIEW"].includes(status)) {
    return false;
  }
  return true;
}

export default function ReferralPage() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useReferralSummary();
  const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useReferralRewards();
  const { data: accounts } = useMyAccounts();
  const requestReward = useRequestReferralReward();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [claimingRewardId, setClaimingRewardId] = useState("");

  const liveAccounts = useMemo(
    () => ((accounts as AccountItem[] | undefined) ?? []).filter((a) => a.account_type === "live"),
    [accounts]
  );

  const accountOptions = useMemo(
    () =>
      liveAccounts.map((acc) => ({
        value: acc._id,
        label: `${acc.account_number || "Live account"} | $${Number(acc.balance || 0).toFixed(2)}`,
      })),
    [liveAccounts]
  );

  const referralLink = useMemo(() => {
    if (!summary?.referralCode) return "";
    return `https://user.alstrades.com/signup/?ref=${summary.referralCode}`;
  }, [summary?.referralCode]);

  const copyText = async (value: string, label: string) => {
    if (!value) {
      setToast({ message: `${label} not available`, type: "error" });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setToast({ message: `${label} copied`, type: "success" });
    } catch {
      setToast({ message: `Failed to copy ${label.toLowerCase()}`, type: "error" });
    }
  };

  const handleClaim = async (rewardId: string) => {
    if (!selectedAccountId) {
      setToast({ message: "Please select a live account first.", type: "error" });
      return;
    }

    try {
      setClaimingRewardId(rewardId);
      await requestReward.mutateAsync({ rewardId, accountId: selectedAccountId });
      setToast({ message: "Reward claim request submitted.", type: "success" });
    } catch (error: unknown) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setClaimingRewardId("");
    }
  };

  const hasError = Boolean(summaryError) || Boolean(rewardsError);

  if (summaryLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] p-6">
        <GlobalLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-2 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Referral Center</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Track referrals, review rewards and claim referral earnings to a live account.
        </p>
      </div>

      {hasError && (
        <div className="rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]">
          Failed to load referral data. Please refresh.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Referral Balance" value={`$ ${formatMoney(summary?.referralBalance || 0)}`} icon={<Gift size={18} />} />
        <StatCard title="Total Earned" value={`$ ${formatMoney(summary?.totalEarned || 0)}`} icon={<HandCoins size={18} />} />
        <StatCard title="Total Referrals" value={String(summary?.totalReferrals || 0)} icon={<Users size={18} />} />
        <StatCard title="Pending Rewards" value={`${summary?.pendingCount || 0} ($${formatMoney(summary?.pendingAmount || 0)})`} icon={<Gift size={18} />} />
      </div>

      <div className="card p-3 md:p-5 space-y-3">
        <div className="text-sm font-medium">Your Referral Details</div>
        <div className="grid gap-3 lg:grid-cols-2">
          <CopyRow
            title="Referral Code"
            value={summary?.referralCode || "-"}
            onCopy={() => copyText(summary?.referralCode || "", "Referral code")}
          />
          <CopyRow
            title="Referral Link"
            value={referralLink || "-"}
            onCopy={() => copyText(referralLink, "Referral link")}
            icon={<LinkIcon size={15} />}
          />
        </div>
      </div>

      <div className="card p-3 md:p-5 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Referral Rewards</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Select a live account, then claim available rewards.
            </p>
          </div>
          <div className="w-full md:w-[320px]">
            <Select
              label="Claim to Live Account"
              options={accountOptions}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
            />
          </div>
        </div>

        {liveAccounts.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border-soft)] p-3 text-sm text-[var(--text-muted)]">
            No live accounts found. Please create a live account to claim rewards.
          </div>
        )}

        {!rewards || rewards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-soft)] p-4 text-sm text-[var(--text-muted)]">
            No referral rewards found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => {
              const claimable = isClaimable(reward) && !!reward.rewardId;
              const status = reward.status || "PENDING";
              const date = reward.createdAt
                ? new Date(reward.createdAt).toLocaleString()
                : "N/A";

              return (
                <div
                  key={reward.rewardId || `${status}-${date}-${reward.amount}`}
                  className="rounded-xl border border-[var(--border-soft)] p-3 md:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">$ {formatMoney(reward.amount)}</div>
                    <div className="text-xs text-[var(--text-muted)]">Reward ID: {reward.rewardId || "-"}</div>
                    <div className="text-xs text-[var(--text-muted)]">Status: {status}</div>
                    <div className="text-xs text-[var(--text-muted)]">Date: {date}</div>
                    {reward.referredUser && (
                      <div className="text-xs text-[var(--text-muted)]">Referral: {reward.referredUser}</div>
                    )}
                  </div>

                  <button
                    disabled={!claimable || !selectedAccountId || requestReward.isPending}
                    onClick={() => handleClaim(reward.rewardId)}
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--text-invert)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {claimingRewardId === reward.rewardId ? "Claiming..." : claimable ? "Claim Reward" : "Not Claimable"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-3 md:p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">{title}</span>
        <span className="text-[var(--primary)]">{icon}</span>
      </div>
      <div className="text-xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function CopyRow({
  title,
  value,
  onCopy,
  icon,
}: {
  title: string;
  value: string;
  onCopy: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{title}</p>
        <p className="text-sm font-medium break-all">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="h-9 w-9 rounded-md bg-[var(--bg-glass)] grid place-items-center shrink-0"
      >
        {icon || <Copy size={15} />}
      </button>
    </div>
  );
}
