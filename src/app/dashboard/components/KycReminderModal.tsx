"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, XCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  kycStatus?: string;
};

export default function KycReminderModal({ kycStatus }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const showModal =
    kycStatus?.toUpperCase() === "NOT_STARTED" ||
    kycStatus?.toUpperCase() === "REJECTED";

  useEffect(() => {
    if (!showModal) return;

    // Show immediately once
    setOpen(true);

    // Then show every 1 minute
    const interval = setInterval(() => {
      setOpen(true);
    }, 600000);

    return () => clearInterval(interval);
  }, [showModal]);

  if (!open || !showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-card)] backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.4)] p-8 animate-kycPop">

        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--error)] transition"
        >
          <XCircle size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-[var(--warning)]/10 flex items-center justify-center animate-pulse">
            <ShieldAlert className="text-[var(--warning)]" size={32} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-[var(--text-main)] mb-3">
          Complete Your KYC
        </h2>

        {/* Description */}
        <p className="text-sm text-center text-[var(--text-muted)] mb-6 leading-relaxed">
          Your account verification is pending.  
          Complete KYC to unlock full trading access and secure withdrawals.
        </p>

        {/* Action */}
        <button
          onClick={() => {
            setOpen(false);
            router.push("/dashboard/kyc");
          }}
          className="w-full rounded-xl py-3 font-medium bg-[var(--primary)] text-white hover:opacity-90 transition"
        >
          Verify Now
        </button>

      </div>
    </div>
  );
}
