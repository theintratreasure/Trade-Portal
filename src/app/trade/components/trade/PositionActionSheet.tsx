"use client";

import { useRouter } from "next/navigation";
import ActionItem from "./ActionItem";
import { Position } from "./MobilePositionItem";

type ActionSheetProps = {
    pos: Position | null;
    open: boolean;
    onClose: () => void;
};

export default function PositionActionSheet({ pos, open, onClose }: ActionSheetProps) {
    if (!open || !pos) return null;
    const router = useRouter();
    return (
        <div className="fixed inset-0 z-[999] flex items-end bg-black/40 md:items-center md:justify-center">

            {/* BACKDROP */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* SHEET */}
            <div className="relative w-full bg-[var(--bg-plan)] md:w-[420px] md:bg-[var(--bg-card)] max-h-[85dvh] overflow-y-auto ios-momentum-scroll pb-[env(safe-area-inset-bottom)]">

                {/* ================= POSITION HEADER ================= */}
                <div className="p-2 border-b border-[var(--border-soft)]">

                    <div className="flex justify-between items-center pt-[10px] pb-[8px]">

                        <div className="text-left">
                            <div className="font-semibold">
                                {pos.pair},{" "}
                                <span
                                    className={
                                        pos.type === "buy"
                                            ? "text-[var(--mt-blue)]"
                                            : "text-[var(--mt-red)]"
                                    }
                                >
                                    {pos.type} {pos.lot}
                                </span>

                            </div>
                            <div className="mt-price-line">
                                {pos.from} → {pos.to}
                            </div>
                        </div>

                        <div
                            className={`font-semibold ${pos.profit < 0
                                ? "text-[var(--mt-red)]"
                                : "text-[var(--mt-blue)]"
                                }`}
                        >
                            {pos.profit.toFixed(2)}
                        </div>

                    </div>

                    {/* EXTENDED INFO GRID */}
                    <div className="px-1 pb-[8px] text-[11px] space-y-[3px] grid grid-cols-2">
                        <div className="opacity-70 mr-2">
                            #{pos.id.slice(0, 10)}
                        </div>

                        <div className="flex justify-between mr-2">
                            <span>Open:</span>
                            <span>{pos.openTime || "-"}</span>
                        </div>

                        <div className="flex justify-between mr-2">
                            <span>S / L:</span>
                            <span>{pos.stopLoss ?? "-"}</span>
                        </div>

                        <div className="flex justify-between mr-2">
                            <span>Swap:</span>
                            <span>{pos.swap ?? "-"}</span>
                        </div>

                        <div className="flex justify-between mr-2">
                            <span>T / P:</span>
                            <span>{pos.takeProfit ?? "-"}</span>
                        </div>
                    </div>

                </div>

                {/* ================= ACTION LIST ================= */}
                <div className="divide-y divide-[var(--border-soft)] text-[15px]">

                    <ActionItem
                        label="Close position"
                        onClick={() => {
                            router.push(`/trade/close/${pos.id}`);
                            onClose();
                        }}
                    />

                    <ActionItem
                        label="Modify position"
                        onClick={() => {
                            router.push(`/trade/modify/${pos.id}`);
                            onClose();
                        }}
                    />

                    <ActionItem
                        label="New order"
                        onClick={() => {
                            router.push(`/trade/new-order?symbol=${pos.pair}`);
                            onClose();
                        }}
                    />

                    <ActionItem
                        label="Chart"
                        onClick={() => {
                            router.push(`/trade/charts?symbol=${pos.pair}`);
                            onClose();
                        }}
                    />

                </div>


            </div>
        </div>
    );
}
