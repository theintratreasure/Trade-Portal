"use client";

import { useRouter } from "next/navigation";
import ActionItem from "./ActionItem";

type OrderSheetProps = {
    order: any;
    open: boolean;
    onClose: () => void;
    onDeleteClick: () => void;
};

export default function OrderActionSheet({
    order,
    open,
    onClose,
    onDeleteClick,
}: OrderSheetProps) {
    const router = useRouter();
    if (!open || !order) return null;

    const statusRaw =
        order.status ?? order.orderStatus ?? order.state ?? order.order_state;
    const statusLabel =
        typeof statusRaw === "string" && statusRaw.toLowerCase() === "pending"
            ? "PLACED"
            : (statusRaw ?? "PENDING");
    const currentPriceValue = order.currentPrice ?? order.current_price ?? order.ltp ?? "-";

    return (
        <div className="fixed inset-0 z-[999] flex items-end bg-black/40 md:items-center md:justify-center">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full bg-[var(--bg-plan)] md:w-[420px] md:bg-[var(--bg-card)]">
                <div className="p-2 border-b border-[var(--border-soft)]">
                    <div className="flex justify-between items-center pt-[10px] pb-[8px]">
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
                    </div>

                    <div className="px-[2px] pb-[8px] text-[11px] space-y-[3px] grid grid-cols-2">
                        <div className="opacity-70 mr-2">
                            #{order.orderId.slice(0, 10)}
                        </div>

                        <div className="flex justify-between mr-2">
                            <span>Created:</span>
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
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
                            <span>Status:</span>
                            <span>{statusLabel}</span>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-[var(--border-soft)] text-[15px]">
                    <ActionItem
                        label="Delete order"
                        onClick={() => {
                            onDeleteClick();
                            onClose();
                        }}
                    />

                    <ActionItem
                        label="Modify order"
                        onClick={() => {
                            router.push(`/trade/modify-order/${order.orderId}`);
                            onClose();
                        }}
                    />

                    <ActionItem
                        label="New order"
                        onClick={() => {
                            router.push(
                                `/trade/new-order?symbol=${order.symbol}&type=${encodeURIComponent(order.orderType)}`
                            );
                            onClose();
                        }}
                    />

                    <ActionItem
                        label="Chart"
                        onClick={() => {
                            router.push(`/trade/charts?symbol=${order.symbol}`);
                            onClose();
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
