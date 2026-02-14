"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import Select from "@/app/components/ui/Select";
import Pagination from "@/app/components/ui/pagination";

const typeOptions = [
  { label: "All", value: "" },
  { label: "Deposit", value: "DEPOSIT" },
  { label: "Withdrawal", value: "WITHDRAWAL" },
  { label: "Transfer In", value: "INTERNAL_TRANSFER_IN" },
  { label: "Transfer Out", value: "INTERNAL_TRANSFER_OUT" },
  { label: "Trade Profit", value: "TRADE_PROFIT" },
  { label: "Trade Loss", value: "TRADE_LOSS" },
];

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [type, setType] = useState("");
  const [fromDate, setFromDate] = useState("");

  const { data, isLoading } = useTransactions({
    page,
    limit,
    type: type || undefined,
    fromDate: fromDate || undefined,
  });

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-6">

      {/* HEADER + FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-main)]">
          Transaction History
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

          <div className="w-full sm:w-44">
            <Select
              options={typeOptions}
              value={type}
              onChange={(v) => {
                setPage(1);
                setType(v);
              }}
            />
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPage(1);
              setFromDate(e.target.value);
            }}
            className="
              rounded-xl
              border border-[var(--border-soft)]
              bg-[var(--bg-card)]
              px-4 py-2 text-sm
              text-[var(--text-main)]
              focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
              transition
            "
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="
        rounded-2xl
        border border-[var(--border-soft)]
        bg-[var(--bg-card)]
        shadow-[0_10px_30px_rgba(0,0,0,0.05)]
        overflow-hidden
      ">
        <div className="hidden md:block overflow-x-auto">

          <table className="min-w-[700px] w-full text-xs md:text-sm">

            <thead className="bg-[var(--bg-glass)] text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-3 text-left">Type</th>
                <th className="px-3 py-3 text-left">Amount No</th>
                <th className="px-3 py-3 text-left">Amount</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Balance</th>
                <th className="px-3 py-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                    Loading...
                  </td>
                </tr>
              )}

              {data?.data.map((tx) => (
                <tr
                  key={tx._id}
                  className="border-t border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition"
                >
                  <td className="px-3 py-3 font-medium text-[var(--text-main)] whitespace-nowrap">
                    {tx.type}
                  </td>
                  <td className="px-3 py-3 font-medium text-[var(--text-main)] whitespace-nowrap">
                    {tx.accountNumber}
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    $ {tx.amount.toLocaleString()}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`
                        px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold
                        ${
                          tx.status === "SUCCESS"
                            ? "text-[var(--success)] bg-[var(--success)]/10"
                            : tx.status === "FAILED"
                            ? "text-[var(--error)] bg-[var(--error)]/10"
                            : "text-[var(--warning)] bg-[var(--warning)]/10"
                        }
                      `}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    $ {tx.balanceAfter.toLocaleString()}
                  </td>

                  <td className="px-3 py-3 text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        <div className="md:hidden space-y-2 p-2">
          {isLoading && (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-3 text-sm text-[var(--text-muted)] text-center">
              Loading...
            </div>
          )}

          {!isLoading && data?.data?.map((tx) => (
            <div
              key={tx._id}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{tx.type}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{tx.accountNumber}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    tx.status === "SUCCESS"
                      ? "text-[var(--success)] bg-[var(--success)]/10"
                      : tx.status === "FAILED"
                      ? "text-[var(--error)] bg-[var(--error)]/10"
                      : "text-[var(--warning)] bg-[var(--warning)]/10"
                  }`}
                >
                  {tx.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[var(--text-muted)]">Amount</p>
                  <p className="font-semibold">$ {tx.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Balance</p>
                  <p className="font-semibold">$ {tx.balanceAfter.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[var(--text-muted)]">Date</p>
                  <p className="font-medium">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {data && (
          <div className="p-3 md:p-4 border-t border-[var(--border-soft)]">
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(val) => {
                setPage(1);
                setLimit(val);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
