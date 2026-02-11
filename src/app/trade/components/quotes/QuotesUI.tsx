"use client";

import { useEffect, useState } from "react";
import { Plus, Edit } from "lucide-react";

import QuotesList from "./QuotesList";
import BottomSheet from "./BottomSheet";
import EditSymbols from "./EditSymbols";
import AddSymbol from "./AddSymbol";
import PropertySheet from "./PropertySheet";

type Props = {
  showTopBar?: boolean;
};

export default function QuotesUI({ showTopBar = false }: Props) {
  const [sheet, setSheet] =
    useState<null | "actions" | "edit" | "add">(null);
  const [selected, setSelected] =
    useState<string | null>(null);
  const [openProperty, setOpenProperty] = useState(false);

  const [viewMode, setViewMode] = useState<"advanced" | "simple">(() => {
    if (typeof window === "undefined") return "advanced";
    const saved = localStorage.getItem("trade-quote-view");
    return saved === "advanced" || saved === "simple" ? saved : "advanced";
  });

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

  return (
    <div className="text-[var(--text-main)] mt-2">
      {showTopBar && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">
            Quotes
          </div>

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
        </div>
      )}

      <QuotesList
        viewMode={viewMode}
        onSelect={(symbol) => {
          setSelected(symbol);
          setSheet("actions");
        }}
      />

      <BottomSheet
        open={sheet === "actions"}
        onClose={() => setSheet(null)}
        title={selected ?? ""}
        viewMode={viewMode}
        onOpenProperty={() => setOpenProperty(true)}
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
      />

      <EditSymbols
        open={sheet === "edit"}
        onClose={() => setSheet(null)}
      />

      <AddSymbol
        open={sheet === "add"}
        onClose={() => setSheet(null)}
      />
      <PropertySheet
        open={openProperty}
        symbol={selected ?? ""}
        onClose={() => setOpenProperty(false)}
      />

    </div>
  );
}
