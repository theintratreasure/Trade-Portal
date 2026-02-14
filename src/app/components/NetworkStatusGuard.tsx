"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatusGuard() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--bg-main)]/95 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 text-center shadow-2xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-glass)] text-[var(--primary)]">
            <WifiOff size={24} />
          </div>

          <h2 className="text-base font-semibold text-[var(--text-main)]">
            No Internet Connection
          </h2>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Please connect to Wi-Fi or mobile data to continue.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--text-invert)]"
          >
            <RefreshCw size={14} />
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
}

