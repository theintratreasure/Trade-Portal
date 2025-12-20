"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { listenForegroundMessages } from "@/lib/foregroundMessage";
import { AuthGuard } from "./Authguard";
import { useAuthGuard } from "@/hooks/useUser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isLoading, isError } = useAuthGuard();
  useEffect(() => {
    listenForegroundMessages();
    if (Notification.permission === "default") {
      const permission = Notification.requestPermission();
    }
  }, []);


if (isLoading) {
  return null;
}

if (isError) {
  window.location.replace("/login");
  return null;
}


  return (
    <AuthGuard>
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

        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>

      </div>
    </div>
    </AuthGuard>
  );
}
