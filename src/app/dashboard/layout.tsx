"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { listenForegroundMessages } from "@/lib/foregroundMessage";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    listenForegroundMessages();
  }, []);
  
  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
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
  );
}
