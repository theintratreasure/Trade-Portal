"use client";

import { useLongPress } from "@/lib/useLongPress";

export type Position = {
    id: string;
    pair: string;
    type: string;
    lot: number;
    from: string;
    to: string;
    profit: number;
    openTime: string;
    swap: string;
    stopLoss?: number | null;
    takeProfit?: number | null;
};
type MobilePositionItemProps = {
    pos: Position;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    onLongPress: (pos: Position) => void;
};

export default function MobilePositionItem({
    pos,
    expandedId,
    setExpandedId,
    onLongPress,
}: MobilePositionItemProps) {

    const expanded = expandedId === pos.id;

    const longPress = useLongPress(() => {
        onLongPress(pos);
    });

    return (
        <div
            {...longPress}
            onContextMenu={(e) => e.preventDefault()}
            className="border-b border-[var(--border-grey)]/40 bg-[var(--bg-plan)] select-none no-touch-callout select-none"
        >

            <button
                onClick={() =>
                    setExpandedId(expanded ? null : pos.id)
                }
                className="w-full flex justify-between items-center pt-[10px] pb-[8px]"
            >
                <div className="text-left">
                    <div className="font-semibold">
                        {pos.pair},{" "}
                        <span
                            className={
                                pos.type === "buy"
                                    ? "text-[var(--mt-blue)] font-medium"
                                    : "text-[var(--mt-red)] font-medium"
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
                        ? "text-[var(--mt-red)] font-medium"
                        : "text-[var(--mt-blue)] font-medium"
                        }`}
                >
                    {pos.profit.toFixed(2)}
                </div>
            </button>

            {expanded && (
                <div className="px-[2px] pb-[8px] text-[11px] space-y-[3px] grid grid-cols-2">
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
            )}
        </div>
    );
}
