"use client";

import { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full max-w-md">
      {children}
    </div>
  );
}
