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
                            {order.side} {order.volume}
                        </span>
                    </div>

                    <div className="mt-price-line">
                        {order.price} → {currentPriceValue}
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
                        <span>{order.stopLoss ?? "-"}</span>
                    </div>

                    <div className="flex justify-between mr-2">
                        <span>T / P:</span>
                        <span>{order.takeProfit ?? "-"}</span>
                    </div>

                    <div className="flex justify-between mr-2">
                        <span>Type:</span>
                        <span>{order.orderType}</span>
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
