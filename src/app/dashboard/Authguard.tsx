"use client";

import { useAuthGuard } from "@/hooks/useUser";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isError } = useAuthGuard();

  if (isLoading) return null;

  if (isError) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    document.cookie = "accessToken=; path=/; max-age=0";
    window.location.replace("/login");
    return null;
  }

  return <>{children}</>;
}
