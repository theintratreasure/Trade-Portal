"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { listenForegroundMessages } from "@/lib/foregroundMessage";
import { useUserMe } from "@/hooks/useUser";
import GlobalLoader from "../components/ui/GlobalLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data, isLoading, isError, error } = useUserMe();
    useEffect(() => {
    listenForegroundMessages();
    if (Notification.permission === "default") {
      const permission = Notification.requestPermission();
    }
  }, []);
  // 🔐 AUTH DECISION HERE (NO useEffect)
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
      // 🔴 logout
      localStorage.removeItem("accessToken");
      document.cookie = "accessToken=; path=/; max-age=0";

      router.replace("/");
      return null;
    }
  }

  // ✅ Auth OK → dashboard allowed
  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />

      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}


