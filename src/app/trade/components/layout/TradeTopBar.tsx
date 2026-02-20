"use client";

import { ReactNode } from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { useTradeSidebar } from "./TradeSidebarContext";
import { usePathname, useRouter } from "next/navigation";

type TopBarProps = {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  showMenu?: boolean;
  showBack?: boolean;
  onBackClick?: () => void;
  right?: ReactNode;
};

export default function TradeTopBar({
  title,
  subtitle,
  subtitleClassName,
  showMenu = false,
  showBack = false,
  onBackClick,
  right,
}: TopBarProps) {
  const hasSubtitle = Boolean(subtitle);
  const { open } = useTradeSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    if (pathname?.startsWith("/trade")) {
      router.push("/trade/quotes");
      return;
    }

    if (pathname?.startsWith("/dashboard")) {
      router.push("/dashboard");
      return;
    }

    router.push("/");
  };

  return (
    <header className="h-14 w-full flex items-center justify-between px-3 bg-[var(--bg-plan)] border-b border-[var(--border-soft)] backdrop-blur">

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {showBack && (
          <button
            onClick={handleBack}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-glass)] transition"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {showMenu && !showBack && (
          <button
            onClick={open}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-glass)] transition"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex flex-col leading-tight">
          <span
            className={
              hasSubtitle
                ? "text-[12px] font-semibold"
                : "text-lg font-semibold"
            }
          >
            {title}
          </span>

          {hasSubtitle && (
            <span
  className={`text-[16px] font-medium ${
    subtitleClassName ?? "text-[var(--text-muted)]"
  }`}
            >
              {subtitle}
</span>

          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {right}
      </div>
    </header>
  );
}
