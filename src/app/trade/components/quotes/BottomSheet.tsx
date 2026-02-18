"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import DesktopOrderModal from "../new-order/DesktopOrderModal";
import PropertySheet from "./PropertySheet";

export default function BottomSheet({
  open,
  onClose,
  title,
  viewMode,
  onToggleViewMode,
  onOpenProperty,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  viewMode: "advanced" | "simple";
  onToggleViewMode: () => void;
  onOpenProperty: () => void;
}) {
  const router = useRouter();
  const [openDesktopOrder, setOpenDesktopOrder] = useState(false);
  const [openProperty, setOpenProperty] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!open) return null;

  const sheetNode = (
    <div className={`${isDesktop ? "absolute" : "fixed"} inset-0 z-[9999] flex items-end`}>
      <div
        onClick={onClose}
        className="absolute inset-0 animate-fadeIn"
        style={{ background: "rgba(0,0,0,0.45)" }}
      />

      <div
        className="relative w-full animate-slideUp bg-[var(--bg-plan)] md:bg-[var(--bg-card)]"
        style={{
          borderTopLeftRadius: "18px",
          borderTopRightRadius: "18px",
          border: "1px solid var(--border-soft)",
          maxHeight: "min(75dvh, 75vh)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full" style={{ background: "var(--border-soft)" }} />
        </div>

        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <div className="text-sm font-medium truncate">{title}</div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-plan)] transition"
          >
            X
          </button>
        </div>

        <div className="overflow-y-auto ios-momentum-scroll">
          <button
            onClick={() => {
              if (!title) return;

              if (isDesktop) {
                setOpenDesktopOrder(true);
              } else {
                router.push(`/trade/new-order?symbol=${title}`);
                onClose();
              }
            }}
            className="w-full px-2 py-4 text-left text-sm border-b border-[var(--border-soft)]"
          >
            New Order
          </button>

          <button
            onClick={() => {
              if (!title) return;
              router.push(`/trade/charts?symbol=${title}`);
              onClose();
            }}
            className="w-full px-2 py-4 text-left text-sm border-b border-[var(--border-soft)]"
          >
            Chart
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenProperty();
            }}
            className="w-full px-2 py-4 text-left text-sm border-b border-[var(--border-soft)]"
          >
            Properties
          </button>

          <button
            onClick={() => {
              const next = viewMode === "advanced" ? "simple" : "advanced";

              localStorage.setItem("trade-quote-view", next);

              window.dispatchEvent(
                new CustomEvent("trade-quote-view-change", {
                  detail: next,
                })
              );

              onClose();
            }}
            className="w-full px-2 py-4 text-left text-sm border-b border-[var(--border-soft)]"
          >
            {viewMode === "advanced" ? "Simple View Mode" : "Advanced View Mode"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isDesktop || !mounted ? sheetNode : createPortal(sheetNode, document.body)}

      {isDesktop && openDesktopOrder && (
        <DesktopOrderModal
          open={openDesktopOrder}
          symbol={title}
          onClose={() => {
            setOpenDesktopOrder(false);
            onClose();
          }}
        />
      )}

      <PropertySheet open={openProperty} symbol={title} onClose={() => setOpenProperty(false)} />
    </>
  );
}
