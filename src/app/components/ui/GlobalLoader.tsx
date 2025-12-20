"use client";

export default function GlobalLoader({ label = "Loading" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[var(--primary)] animate-spin" />
        </div>
        <p className="text-sm tracking-wide text-white/90">
          {label}…
        </p>
      </div>
    </div>
  );
}
