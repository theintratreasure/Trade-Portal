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
import { useUserMe } from "@/hooks/useUser";
import { useNotifications } from "@/hooks/useNotifications";

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
  const { data: user } = useUserMe();

  const userOpen = userHover || userPinned;
  const notifOpen = notifHover || notifPinned;
  const { data: notifData } = useNotifications(1, 3);

  /* ================= OUTSIDE CLICK ================= */
  {
    (userPinned || notifPinned) && (
      <div
        className="fixed inset-0 z-20"
        onClick={() => {
          setUserHover(false);
          setUserPinned(false);
          setNotifHover(false);
          setNotifPinned(false);
        }}
      />
    )
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userRef.current &&
        !userRef.current.contains(e.target as Node)
      ) {
        setUserHover(false);
        setUserPinned(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifHover(false);
        setNotifPinned(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const initial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
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
              <div className="absolute -right-24 md:right-0 top-7 w-80 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-xl p-4 z-30">

                <p className="text-sm font-semibold mb-3">Notifications</p>

                {notifData?.data?.length ? (
                  <>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {notifData.data.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-xl bg-[var(--bg-glass)]"
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setNotifHover(false);
                        setNotifPinned(false);
                        router.push("/dashboard/notifications");
                      }}
                      className="mt-4 w-full text-sm text-[var(--primary)] hover:underline"
                    >
                      View All
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    No notifications
                  </p>
                )}
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
              <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-[var(--text-main)] flex items-center justify-center text-sm font-semibold">
                {initial}
              </div>
              <ChevronDown size={14} />
            </button>

            {userOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-xl p-4 origin-top animate-dropdown z-30" onClick={(e) => e.stopPropagation()}>
                {/* INFO */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[var(--bg-glass)] flex items-center justify-center">
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user?.name}</p>
                    {(() => {
                      const badge = getKycBadge(user?.kycStatus);

                      return (
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-medium ${badge.wrapper}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.text}
                        </span>
                      );
                    })()}

                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Btn icon={Wallet} label="Deposit" page="payments/deposit" onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }} />
                  <Btn icon={Repeat} label="Withdraw" page="payments/withdraw" onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }}/>
                  <Btn icon={ArrowLeftRight} label="Transfer" page="payments/internal-fund-transfer"  onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }} />
                  <Btn icon={FileText} label="Transactions" page="payments/transactions"  onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }}/>
                </div>

                <Divider />

                <MenuItem
                  icon={BadgeCheck}
                  label="Verification / KYC"
                  page="kyc"
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
                <MenuItem
                  icon={Settings}
                  label="Change Password"
                  page="change-password"
                  onClick={() => {
                    setUserHover(false);
                    setUserPinned(false);
                  }}
                />
                <MenuItem icon={Gift} label="Referral Link" page="referal" onClick={() => {
                  setUserHover(false);
                  setUserPinned(false);
                }} />
                <MenuItem icon={Headphones} label="Support" page="/support" onClick={() => {
                  setUserHover(false);
                  setUserPinned(false);
                }}/>

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
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-[var(--primary)] text-[var(--text-main)] px-4 py-2 shadow-xl animate-fadeIn">
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

function Btn({ icon: Icon, label, page, onClick }: any) {
  const router = useRouter();
  const handleClick = () => {
    onClick?.();
    if (page) router.push(`/dashboard/${page}`);
  };
  return (
    <button onClick={handleClick} className="flex items-center gap-2 justify-center rounded-xl border border-[var(--border-soft)] py-2 text-sm hover:bg-[var(--bg-glass)]">
      <Icon size={14} />
      {label}
    </button>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-[var(--border-soft)]" />;
}
type KycStatus = "VERIFIED" | "REJECTED" | "PENDING" | "NOT_STARTED" | string;

function getKycBadge(status?: KycStatus) {
  switch (status?.toUpperCase()) {
    case "VERIFIED":
      return {
        text: "Verified",
        wrapper: "bg-emerald-500/10 text-emerald-500",
        dot: "bg-emerald-500",
      };

    case "REJECTED":
      return {
        text: "Rejected",
        wrapper: "bg-red-500/10 text-red-500",
        dot: "bg-red-500",
      };

    case "PENDING":
      return {
        text: "Pending",
        wrapper: "bg-yellow-500/10 text-yellow-500",
        dot: "bg-yellow-500",
      };

    case "NOT_STARTED":
    default:
      return {
        text: "KYC Not Verified",
        wrapper: "bg-gray-500/10 text-gray-400",
        dot: "bg-gray-400",
      };
  }
}
