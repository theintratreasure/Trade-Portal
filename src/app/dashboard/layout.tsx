"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { listenForegroundMessages } from "@/lib/foregroundMessage";
import { useUserMe } from "@/hooks/useUser";
import GlobalLoader from "../components/ui/GlobalLoader";
import { Capacitor } from "@capacitor/core";

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

  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setHasToken(!!token);
  }, []);

  const { data: user, isLoading, isError, error } = useUserMe({
    enabled: hasToken && !isTradePage,
  });

  useEffect(() => {
    window.onerror = function (msg, url, line, col, error) {
      alert("JS ERROR: " + msg);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ❌ Skip all web notification logic inside Android/iOS app
    if (Capacitor.isNativePlatform()) return;

    if ("Notification" in window) {
      listenForegroundMessages();

      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => { });
      }
    }
  }, []);


  /* ================= AUTH ================= */
  if (!isTradePage) {
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center text-sm">
          <GlobalLoader />
        </div>
      );
    }

    if (isError) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        localStorage.removeItem("accessToken");
        document.cookie = "accessToken=; path=/; max-age=0";
        router.replace("/login");
        return null;
      }
    }
  }


  /* ================= LAYOUT ================= */
  return (
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
        {/* SIDEBAR — FIXED HEIGHT */}
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

          {/* CONTENT — ONLY THIS SCROLLS */}
          <main
            className={`flex-1 overflow-y-auto ${isTradePage ? "p-0" : "p-4"
              }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );

}
