"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import QuotesList from "../components/quotes/QuotesList";
import EditSymbols from "../components/quotes/EditSymbols";
import AddSymbol from "../components/quotes/AddSymbol";
import PropertySheet from "../components/quotes/PropertySheet";

import TradeTopBar from "../components/layout/TradeTopBar";
import TopBarSlot from "../components/layout/TopBarSlot";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import BottomSheet from "../components/quotes/BottomSheet";

export default function QuotesPage() {
    const [sheet, setSheet] = useState<null | "actions" | "edit" | "add">(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [openProperty, setOpenProperty] = useState(false);
    const [viewMode, setViewMode] = useState<"advanced" | "simple">(() => {
        if (typeof window === "undefined") return "advanced";
        const saved = localStorage.getItem("trade-quote-view");
        return saved === "advanced" || saved === "simple" ? saved : "advanced";
    });
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    useEffect(() => {
        if (mounted && isDesktop) {
            router.replace(`/trade`);
        }
    }, [mounted, isDesktop, router]);
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const syncFromStorage = () => {
            const saved = localStorage.getItem("trade-quote-view");
            if (saved === "advanced" || saved === "simple") {
                setViewMode(saved);
            }
        };
        const onStorage = (e: StorageEvent) => {
            if (e.key === "trade-quote-view") syncFromStorage();
        };
        const onCustom = (e: Event) => {
            const next = (e as CustomEvent).detail;
            if (next === "advanced" || next === "simple") {
                setViewMode(next);
            } else {
                syncFromStorage();
            }
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener("trade-quote-view-change", onCustom);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("trade-quote-view-change", onCustom);
        };
    }, []);

    if (!mounted) return null;

    return (
        <>
            <TopBarSlot>
                <TradeTopBar
                    title="Quotes"
                    showMenu
                    right={
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSheet("add")}
                                className="h-12 w-12 flex items-center justify-center text-[var(--text-main)]"
                            >
                                <Plus size={22} strokeWidth={2.5} />
                            </button>

                            {/* <button
                                onClick={() => setSheet("edit")}
                                className="h-12 w-12 flex items-center justify-center text-[var(--text-main)]"
                            >
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 21h18" />
                                    <path d="M12 3l9 9-9 9-9-9z" opacity="0" />
                                    <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
                                </svg>
                            </button> */}

                        </div>
                    }
                />
            </TopBarSlot>

            <div className="text-[var(--text-main)] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] min-h-screen ">
                <QuotesList
                    viewMode={viewMode}
                    onSelect={(symbol) => {
                        setSelected(symbol);
                        setSheet("actions");
                    }} />

                <BottomSheet
  open={sheet === "actions"}
  onClose={() => setSheet(null)}
  title={selected || ""}
  viewMode={viewMode}
  onToggleViewMode={() =>
    setViewMode((prev) => {
      const next = prev === "advanced" ? "simple" : "advanced";
      if (typeof window !== "undefined") {
        localStorage.setItem("trade-quote-view", next);
        window.dispatchEvent(
          new CustomEvent("trade-quote-view-change", { detail: next })
        );
      }
      return next;
    })
  }
  onOpenProperty={() => {
    setOpenProperty(true);
  }}
/>

                <EditSymbols open={sheet === "edit"} onClose={() => setSheet(null)} />

                <AddSymbol
                    open={sheet === "add"}
                    onClose={() => setSheet(null)}
                />
                <PropertySheet
                    open={openProperty}
                    symbol={selected || ""}
                    onClose={() => setOpenProperty(false)}
                />
            </div>
        </>
    );
}
