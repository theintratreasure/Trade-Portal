"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { listenForegroundMessages } from "@/lib/foregroundMessage";
import { useUserMe } from "@/hooks/useUser";
import GlobalLoader from "../components/ui/GlobalLoader";
import { Capacitor } from "@capacitor/core";
import KycReminderModal from "./components/KycReminderModal";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybe = error as { response?: { status?: number } };
  return maybe.response?.status;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);


  const isTradePage = pathname?.startsWith("/dashboard/trade") ?? false;

  const hasToken = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("accessToken"));
  }, []);

  useEffect(() => {
    if (!isTradePage && !hasToken) {
      router.replace("/login");
    }
  }, [hasToken, isTradePage, router]);

  const { data: user, isLoading, isError, error } = useUserMe({
    enabled: hasToken && !isTradePage,
  });

  useEffect(() => {
    window.onerror = function (msg) {
      alert("JS ERROR: " + msg);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // âŒ Skip all web notification logic inside Android/iOS app
    if (Capacitor.isNativePlatform()) return;

    if ("Notification" in window) {
      listenForegroundMessages();

      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => { });
      }
    }
  }, []);

  useEffect(() => {
    if (isTradePage) return;
    if (!isError) return;

    const status = getErrorStatus(error);
    if (status === 401) {
      localStorage.removeItem("accessToken");
      document.cookie = "accessToken=; path=/; max-age=0";
      router.replace("/login");
    }
  }, [error, isError, isTradePage, router]);


  /* ================= AUTH ================= */
    if (!isTradePage) {
    if (!hasToken) {
      return (
        <div className="flex h-screen items-center justify-center text-sm">
          <GlobalLoader />
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center text-sm">
          <GlobalLoader />
        </div>
      );
    }

    if (isError) return null;
  }


  /* ================= LAYOUT ================= */
  return (
    <>
    <KycReminderModal kycStatus={user?.kycStatus} />
    <div
      className={`relative h-screen overflow-hidden text-[var(--text-main)] ${isTradePage ? "bg-[var(--bg-plan)]" : "bg-[var(--bg-main)]"
        }`}
    >
      {/* Background blobs */}
      {!isTradePage && (
        <>
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />
        </>
      )}

      <div className="flex h-full">
        {/* SIDEBAR â€” FIXED HEIGHT */}
        <div
          className={`${isTradePage ? "hidden" : "block"} h-full`}
        >
          <Sidebar
            open={sidebarOpen}
            collapsed={collapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>

        {/* MAIN COLUMN */}
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          {/* TOPBAR */}
          <div className={isTradePage ? "hidden" : "block"}>
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
          </div>

          {/* CONTENT â€” ONLY THIS SCROLLS */}
          <main
            className={`flex-1 overflow-y-auto ${isTradePage ? "p-0" : "p-2 md:p-4"
              }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
    </>
  );

}

