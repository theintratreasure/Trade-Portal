"use client";

import { useLogout } from "@/hooks/useAuth";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  Menu,
  Bell,
  ChevronDown,
  Wallet,
  ArrowLeftRight,
  FileText,
  BadgeCheck,
  Settings,
  Layers,
  Gift,
  Headphones,
  LogOut,
  User,
  Repeat,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const logout = useLogout();

  /* ================= STATES ================= */
  const [userHover, setUserHover] = useState(false);
  const [userPinned, setUserPinned] = useState(false);

  const [notifHover, setNotifHover] = useState(false);
  const [notifPinned, setNotifPinned] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const userOpen = userHover || userPinned;
  const notifOpen = notifHover || notifPinned;

  /* ================= OUTSIDE CLICK ================= */
 {(userPinned || notifPinned) && (
  <div
    className="fixed inset-0 z-20"
    onClick={() => {
      setUserHover(false);
      setUserPinned(false);
      setNotifHover(false);
      setNotifPinned(false);
    }}
  />
)}


  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    const refreshToken = localStorage.getItem("refreshToken");

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    document.cookie = "accessToken=; path=/; max-age=0";

    setToast("Logged out");

    if (refreshToken) logout.mutate({ refreshToken });

    window.location.replace("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-glass)] backdrop-blur-xl">
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-lg p-2 hover:bg-[var(--bg-glass)]"
        >
          <Menu size={18} />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {/* 🔔 NOTIFICATIONS */}
          <div
            ref={notifRef}
            className="relative"
            onMouseEnter={() => setNotifHover(true)}
            onMouseLeave={() => !notifPinned && setNotifHover(false)}
          >
            <button
              onClick={() => setNotifPinned((v) => !v)}
              className="relative rounded-xl p-2 hover:bg-[var(--bg-main)]"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--primary)]" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-7 w-72 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-xl p-4 animate-dropdown z-30" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  No new notifications
                </p>
              </div>
            )}
          </div>

          {/* 👤 USER */}
          <div
            ref={userRef}
            className="relative"
            onMouseEnter={() => setUserHover(true)}
            onMouseLeave={() => !userPinned && setUserHover(false)}
          >
            <button
              onClick={() => setUserPinned((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-[var(--bg-glass)]"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-semibold">
                U
              </div>
              <ChevronDown size={14} />
            </button>

            {userOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-xl p-4 origin-top animate-dropdown z-30" onClick={(e) => e.stopPropagation()}>
                {/* INFO */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[var(--bg-glass)] flex items-center justify-center">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-semibold">vAgMDpQh</p>
                    <p className="text-xs text-[var(--warning)]">
                      KYC Not Verified
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Btn icon={Wallet} label="Deposit" />
                  <Btn icon={Repeat} label="Withdraw" />
                  <Btn icon={ArrowLeftRight} label="Transfer" />
                  <Btn icon={FileText} label="Transactions" />
                </div>

                <Divider />

                <MenuItem
                  icon={BadgeCheck}
                  label="Verification / KYC"
                  onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }}
                />
                <MenuItem
                  icon={User}
                  label="Edit Profile"
                  page="profile"
                  onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }}
                />
                <MenuItem icon={Settings} label="Reset Password" />
                <MenuItem icon={Layers} label="Client Portal" />
                <MenuItem icon={Gift} label="Referral Link" />
                <MenuItem icon={Headphones} label="Support" />

                <Divider />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-[var(--error)] hover:bg-[var(--bg-glass)]"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-[var(--primary)] text-white px-4 py-2 shadow-xl animate-fadeIn">
          {toast}
        </div>
      )}
    </>
  );
}

/* ===== HELPERS ===== */

function MenuItem({ icon: Icon, label, page, onClick }: any) {
  const router = useRouter();

  const handleClick = () => {
    onClick?.();
    if (page) router.push(`/dashboard/${page}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--bg-glass)] text-sm"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Btn({ icon: Icon, label }: any) {
  return (
    <button className="flex items-center gap-2 justify-center rounded-xl border border-[var(--border-soft)] py-2 text-sm hover:bg-[var(--bg-glass)]">
      <Icon size={14} />
      {label}
    </button>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-[var(--border-soft)]" />;
}
