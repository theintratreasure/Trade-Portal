"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Pagination from "@/app/components/ui/pagination";
import BackButton from "@/app/components/ui/BackButton";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useNotifications(page, limit);

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
        <div className="md:hidden">
            <BackButton />
        </div>
      <h1 className="text-2xl font-bold">All Notifications</h1>

      <div className="space-y-4">
        {data?.data?.map((n) => (
          <div
            key={n.id}
            className="p-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold">{n.title}</p>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {n.message}
            </p>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={data?.totalPages || 1}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setPage(1);
          setLimit(newLimit);
        }}
      />
    </div>
  );
}
