"use client";

import { useLongPress } from "@/lib/useLongPress";

type MobilePendingOrderItemProps = {
    order: any;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    onLongPress: (order: any) => void;
};

const formatDateTime24 = (value: string | number | Date | null | undefined) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
};

const formatOrderTypeLabel = (value: unknown) =>
    String(value ?? "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

const getDecimalPlacesFromUnknown = (value: unknown): number => {
    const raw = String(value ?? "").trim();
    if (!raw || raw === "-" || raw === "--") return 0;
    if (!raw.includes(".")) return 0;
    const decimals = raw.split(".")[1] ?? "";
    return Math.max(0, decimals.replace(/0+$/, "").length);
};

const formatPriceByPrecision = (value: unknown, precision: number, fallback = "-") => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const safePrecision = Math.min(8, Math.max(0, precision));
    return n.toFixed(safePrecision).replace(/\.?0+$/, "");
};

export default function MobilePendingOrderItem({
    order,
    expandedId,
    setExpandedId,
    onLongPress,
}: MobilePendingOrderItemProps) {
    const expanded = expandedId === order.orderId;

    const longPress = useLongPress(() => {
        onLongPress(order);
    });

    const statusRaw =
        order.status ?? order.orderStatus ?? order.state ?? order.order_state;
    const statusLabel =
        typeof statusRaw === "string" && statusRaw.toLowerCase() === "pending"
            ? "PLACED"
            : (statusRaw ?? "PENDING");
    const currentPriceValue =
        order.currentPrice ?? order.current_price ?? order.ltp ?? "-";
    const rowPrecision = Math.min(
        8,
        Math.max(
            0,
            Math.max(
                getDecimalPlacesFromUnknown(order.price),
                getDecimalPlacesFromUnknown(currentPriceValue),
                getDecimalPlacesFromUnknown(order.stopLoss),
                getDecimalPlacesFromUnknown(order.takeProfit)
            ) || 5
        )
    );

    return (
        <div
            {...longPress}
            onContextMenu={(e) => e.preventDefault()}
            className="border-b border-[var(--border-grey)] bg-[var(--bg-plan)]"
        >
            <button
                onClick={() => setExpandedId(expanded ? null : order.orderId)}
                className="w-full flex justify-between items-center pt-[10px] pb-[8px]"
            >
                <div className="text-left">
                    <div className="font-semibold">
                        {order.symbol},{" "}
                        <span
                            className={
                                order.side === "BUY"
                                    ? "text-[var(--mt-blue)]"
                                    : "text-[var(--mt-red)]"
                            }
                        >
                             {formatOrderTypeLabel(order.orderType)}
                        </span>
                    </div>

                    <div className="mt-price-line">
                        {formatPriceByPrecision(order.price, rowPrecision)} {"->"} {formatPriceByPrecision(currentPriceValue, rowPrecision)}
                    </div>
                </div>

                <div className="font-semibold mt-price-line">{statusLabel}</div>
            </button>

            {expanded && (
                <div className="px-[2px] pb-[8px] text-[11px] space-y-[3px] grid grid-cols-2">
                    <div className="opacity-70 mr-2">#{order.orderId.slice(0, 10)}</div>

                    <div className="flex justify-between mr-2">
                        <span>Created:</span>
                        <span>{formatDateTime24(order.createdAt)}</span>
                    </div>

                    <div className="flex justify-between mr-2">
                        <span>S / L:</span>
                        <span>{formatPriceByPrecision(order.stopLoss, rowPrecision)}</span>
                    </div>

                    <div className="flex justify-between mr-2">
                        <span>T / P:</span>
                        <span>{formatPriceByPrecision(order.takeProfit, rowPrecision)}</span>
                    </div>

                    <div className="flex justify-between mr-2">
                        <span>Lot:</span>
                        <span>{order.volume}</span>
                    </div>

                    <div className="flex justify-between mr-2">
                        <span className="font-semibold text-[var(--mt-blue)]">
                            {statusLabel}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

