"use client";

import {
    Plus,
    Check,
    Search,
    Folder,
    Home,
    X,
    ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useInstrumentSearch, useSegmentInstruments, useWatchlist, useWatchlistActions } from "@/hooks/watchlist/useWatchlist";
import type { InstrumentItem, WatchlistItem } from "@/services/watchlist.service";


type Mode = "idle" | "search" | "segment";

const SEGMENTS = [
    { key: "FOREX", label: "Forex", },
    { key: "INDICES", label: "Indices", },
    { key: "METAL", label: "COMMODITIES", },
    { key: "CRYPTO", label: "CRYPTO", },
];

export default function AddSymbolSearch() {
    const [q, setQ] = useState("");
    const [segment, setSegment] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>("idle");

    const dq = useDebounce(q, 300);

    /* SOURCE OF TRUTH */
    const watchlistQuery = useWatchlist();
    const watchlistSet = useMemo(
        () => new Set((watchlistQuery.data ?? []).map((w: WatchlistItem) => w.code)),
        [watchlistQuery.data]
    );

    const searchQuery = useInstrumentSearch(dq);
    const segmentQuery = useSegmentInstruments(segment);
    const { add, remove } = useWatchlistActions();

    const data = useMemo<InstrumentItem[]>(() => {
        if (mode === "search") return searchQuery.data ?? [];
        if (mode === "segment") return segmentQuery.data ?? [];
        return [];
    }, [mode, searchQuery.data, segmentQuery.data]);

    const filteredData = useMemo(() => {
        if (mode !== "segment" || !q.trim()) return data;
        const needle = q.trim().toLowerCase();
        return data.filter((i) => {
            const code = String(i?.code ?? "").toLowerCase();
            const name = String(i?.name ?? "").toLowerCase();
            return code.includes(needle) || name.includes(needle);
        });
    }, [data, mode, q]);

    const resetToHome = () => {
        setMode("idle");
        setSegment(null);
        setQ("");
    };

    return (
        <div className="h-full min-h-0 flex flex-col">
            {/* SEARCH BAR */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-soft)]">
                <Search size={16} className="text-[var(--text-muted)]" />

                <input
                    value={q}
                    onChange={(e) => {
                        const v = e.target.value;
                        setQ(v);
                        if (segment) {
                            setMode("segment");
                            return;
                        }
                        setSegment(null);
                        setMode(v.length >= 2 ? "search" : "idle");
                    }}
                    placeholder="Find symbols"
                    className="flex-1 bg-transparent outline-none text-sm"
                />

                {q && (
                    <button
                        onClick={() => {
                            setQ("");
                            setMode(segment ? "segment" : "idle");
                        }}
                    >
                        <X size={16} className="text-[var(--text-muted)]" />
                    </button>
                )}
            </div>

            {/* BREADCRUMB / HOME */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-soft)] text-sm">
                <button
                    onClick={resetToHome}
                    className="flex items-center gap-1 text-[var(--text-muted)]"
                >
                    <Home size={16} />

                </button>

                {mode === "segment" && segment && (
                    <>
                        <ChevronRight size={14} className="text-[var(--text-muted)]" />
                        <span className="font-medium">
                            {SEGMENTS.find((s) => s.key === segment)?.label}
                        </span>
                    </>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto ios-momentum-scroll">
                {/* SEGMENT FOLDERS */}
                {mode === "idle" &&
                    SEGMENTS.map((s) => {
                        return (
                            <button
                                key={s.key}
                                onClick={() => {
                                    setSegment(s.key);
                                    setMode("segment");
                                    setQ("");
                                }}
                                className="w-full px-4 py-4 flex items-center justify-between border-b border-[var(--border-soft)]"
                            >
                                <div className="flex items-center gap-3">
                                    <Folder
                                        size={18}
                                        className="text-yellow-400 shrink-0"
                                        strokeWidth={2.2}
                                        fill="currentColor"
                                    />
                                    <span className="text-sm">{s.label}</span>
                                </div>

                                <ChevronRight size={16} className="text-[var(--text-muted)]" />
                            </button>
                        );
                    })}

                {/* SYMBOL LIST */}
                {(mode === "search" || mode === "segment") &&
                    filteredData.map((i) => {
                        const isAdded = watchlistSet.has(i.code);

                        return (
                            <div
                                key={i.code}
                                className="px-4 py-4 border-b border-[var(--border-soft)] flex justify-between items-center"
                            >
                                <div>
                                    <div className="text-sm">{i.code}</div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {i.name}
                                    </div>
                                </div>

                                <button
                                    onClick={() =>
                                        isAdded ? remove.mutate(i.code) : add.mutate(i.code)
                                    }
                                    className={`h-7 w-7 rounded-full flex items-center justify-center
                  ${isAdded
                                            ? "bg-[var(--primary)] text-[var(--text-main)]"
                                            : "border border-[var(--border-soft)]"
                                        }`}
                                >
                                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                                </button>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
