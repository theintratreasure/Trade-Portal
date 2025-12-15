"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4"
    >
      <div
        className="max-w-md w-full text-center rounded-2xl p-8 bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-2xl" >
        {/* ICON */}
        <div
          className=" mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-glass)] text-[var(--warning)] " >
          <AlertTriangle size={26} />
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-semibold">
          Page Not Found
        </h1>

        {/* MESSAGE */}
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          The page you are trying to access does not exist or
          the URL is incorrect.
        </p>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className=" flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-[var(--bg-glass)] hover:bg-[var(--border-soft)] transition"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-[var(--primary)] text-[var(--text-invert)] hover:bg-[var(--primary-hover)] transition"
          >
            <Home size={16} />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
