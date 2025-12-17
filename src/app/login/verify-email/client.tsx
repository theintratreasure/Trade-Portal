"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyEmail } from "@/hooks/useAuth";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const verifyEmail = useVerifyEmail();

  const [status, setStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    verifyEmail.mutate(
      { token },
      {
        onSuccess: () => {
          setStatus("success");
          setTimeout(() => {
            router.replace("/login");
          }, 2500);
        },
        onError: () => {
          setStatus("error");
        },
      }
    );
  }, [token]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />

      <div className="relative text-center space-y-3 bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        {status === "verifying" && (
          <>
            <h2 className="text-xl font-semibold">
              Verifying your email
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Please wait, do not refresh
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-xl font-semibold text-emerald-500">
              Email verified successfully
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Redirecting you to login…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-xl font-semibold text-red-500">
              Verification failed
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              This link may be invalid or expired
            </p>
          </>
        )}
      </div>
    </div>
  );
}
