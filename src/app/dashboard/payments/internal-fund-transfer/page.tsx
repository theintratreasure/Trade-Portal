"use client";

import { useMemo, useState } from "react";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import { useInternalTransfer } from "@/hooks/internalTransfer/useInternalTransfer";
import { useInternalTransferHistory } from "@/hooks/internalTransfer/useInternalTransferHistory";
import Select from "@/app/components/ui/Select";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import Pagination from "@/app/components/ui/pagination";
import MobileBottomBar from "../../components/payments/MobileBottomBar";

export default function InternalFundTransfer() {
  const { data: accounts, isLoading } = useMyAccounts();

  const {
    mutate,
    isPending,
    error: transferError,
    isSuccess,
  } = useInternalTransfer();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useInternalTransferHistory(page, limit);

  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");

  const liveAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter((acc: any) => acc.account_type === "live");
  }, [accounts]);

  const accountOptions = liveAccounts.map((acc: any) => ({
    label: `${acc.plan_name} - $${acc.balance.toFixed(2)}`,
    value: acc._id,
  }));

  const selectedFromAccount = liveAccounts.find(
    (acc: any) => acc._id === fromAccount
  );

  const handleTransfer = () => {
    setFormError("");

    if (!fromAccount || !toAccount || !amount) {
      setFormError("All fields are required.");
      return;
    }

    if (fromAccount === toAccount) {
      setFormError("From and To accounts cannot be the same.");
      return;
    }

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    if (
      selectedFromAccount &&
      numericAmount > selectedFromAccount.balance
    ) {
      setFormError("Insufficient balance.");
      return;
    }

    mutate(
      { fromAccount, toAccount, amount: numericAmount },
      {
        onSuccess: () => {
          setAmount("");
          setFormError("");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-2 md:p-6 space-y-4 md:space-y-6">

      <h1 className="text-2xl font-semibold">
        Internal Fund Transfer
      </h1>
      {isLoading && (
        <div className="text-xs text-[var(--text-muted)]">
          Loading accounts...
        </div>
      )}

      {/* TRANSFER CARD */}
      <div className="card p-3 md:p-6 rounded-2xl space-y-4 md:space-y-6">

        <div className="grid md:grid-cols-3 gap-3 md:gap-4 items-end">

          <Select
            label="From Account"
            options={accountOptions}
            value={fromAccount}
            onChange={setFromAccount}
          />

          <Select
            label="To Account"
            options={accountOptions.filter(
              (opt) => opt.value !== fromAccount
            )}
            value={toAccount}
            onChange={setToAccount}
          />

          <div>
            <p className="text-xs mb-2 text-[var(--text-muted)]">
              Amount
            </p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        {formError && (
          <p className="text-sm text-red-500">{formError}</p>
        )}

        {transferError && (
          <p className="text-sm text-red-500">
            {(transferError as any)?.response?.data?.message ||
              "Transfer failed. Please try again."}
          </p>
        )}

        {isSuccess && (
          <p className="text-sm text-green-500">
            Transfer completed successfully.
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleTransfer}
            disabled={isPending || isLoading}
            className="px-6 py-3 rounded-xl text-sm font-medium bg-[var(--primary)] text-[var(--text-invert)] transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Transfer Funds"}
          </button>
        </div>
      </div>

     {/* HISTORY CARD */}
<div className="card p-3 md:p-6 rounded-2xl space-y-4 md:space-y-6">

  <h2 className="text-lg font-semibold">
    Transfer History
  </h2>

  {historyLoading && <GlobalLoader />}

  {historyError && (
    <p className="text-sm text-red-500">
      Failed to load transfer history.
    </p>
  )}

  {!historyLoading && !historyError && (
    <>
      {(!history?.data || history.data.length === 0) && (
        <p className="text-sm text-[var(--text-muted)]">
          No transfer history found.
        </p>
      )}

      <div className="space-y-4">
        {history?.data?.map((item: any) => {
          const isCredit =
            item.type === "INTERNAL_TRANSFER_IN";

          return (
            <div
              key={item._id}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-4 space-y-3"
            >
              {/* TOP ROW */}
              <div className="flex flex-row justify-between gap-2">

                <div>
                  <p className="text-sm font-semibold">
                    {isCredit ? "Transfer In" : "Transfer Out"}
                  </p>

                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      isCredit
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {isCredit ? "+" : "-"}$
                    {item.amount.toLocaleString()}
                  </p>

                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    {item.status}
                  </span>
                </div>
              </div>

              {/* DETAILS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-[var(--text-muted)]">

                <div>
                  <span className="block">Account Type</span>
                  <span className="font-medium capitalize text-[var(--text-main)]">
                    {item.account?.account_type}
                  </span>
                </div>

                <div>
                  <span className="block">Account Status</span>
                  <span className="font-medium text-[var(--text-main)]">
                    {item.account?.status}
                  </span>
                </div>
                <div>
                  <span className="block">Account Number</span>
                  <span className="font-medium text-[var(--text-main)]">
                    {item.account?.account_number}
                  </span>
                </div>

                <div>
                  <span className="block">Balance After</span>
                  <span className="font-medium text-[var(--text-main)]">
                    ${item.balanceAfter?.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="block">Reference ID</span>
                  <span className="font-mono text-[var(--text-main)] break-all">
                    {item.referenceId}
                  </span>
                </div>
              </div>

              {item.remark && (
                <div className="text-xs text-[var(--text-muted)] border-t border-[var(--border-soft)] pt-2">
                  Remark: {item.remark}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <Pagination
        page={page}
        totalPages={history?.pagination?.totalPages || 1}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </>
  )}
</div>


       <MobileBottomBar />
    </div>
  );
}
