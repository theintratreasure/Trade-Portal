"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createPortal } from "react-dom";
import AddSymbolList from "./AddSymbolList";
import AddSymbolSearch from "./AddSymbolSearch";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function AddSymbol({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [folder, setFolder] = useState<null | string>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  /* ================================
     DESKTOP → Cover ONLY Quotes Panel
  ================================= */
 if (isDesktop) {
  return folder ? (
    <AddSymbolList
      folder={folder}
      onBack={() => setFolder(null)}
      onClose={onClose}
    />
  ) : (
    <div className="absolute inset-0 z-[60] bg-[var(--bg-card)] mt-4 flex flex-col">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)]">
        <button onClick={onClose}>
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 font-semibold text-sm">
          Add symbol
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <AddSymbolSearch />
      </div>

    </div>
  );
}


  /* ================================
     MOBILE → Fullscreen (Same as before)
  ================================= */
  return createPortal(
    folder ? (
      <AddSymbolList
        folder={folder}
        onBack={() => setFolder(null)}
        onClose={onClose}
      />
    ) : (
      <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-primary)] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)]">
          <button onClick={onClose}>
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 font-semibold text-sm">
            Add symbol
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <AddSymbolSearch />
        </div>
      </div>
    ),
    document.body
  );
}
