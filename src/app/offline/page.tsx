"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] p-4">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-glass)] text-[var(--primary)]">
            <WifiOff size={24} />
          </div>
          <h1 className="text-base font-semibold text-[var(--text-main)]">
            No Internet Connection
          </h1>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Please connect to Wi-Fi or mobile data.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--text-invert)]"
          >
            Retry
          </button>
        </section>
      </div>
    </main>
  );
}
