"use client";

import { Toast } from "@/app/components/ui/Toast";
import { useCancelPendingOrder } from "@/hooks/useCancelPendingOrder";
import { useState } from "react";

type DeleteOrderModalProps = {
    order: any;
    open: boolean;
    onClose: () => void;
};

export default function DeleteOrderModal({
    order,
    open,
    onClose,
}: DeleteOrderModalProps) {
    
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const { mutate, isPending } = useCancelPendingOrder();

    if (!open || !order) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">

            <div className="w-[90%] max-w-md rounded-2xl bg-[var(--mt-grey)] p-6 text-[var(--text-main)] shadow-xl">

                <div className="text-xl font-semibold mb-4">
                    Delete order
                </div>

                <div className="text-sm mb-6">
                    Delete order: #{order.orderId.slice(0, 10)}{" "}
                    {order.side?.toLowerCase()}{" "}
                    {order.orderType?.toLowerCase()} <br />
                    {order.volume} {order.symbol} at {order.price}?
                </div>

                <div className="flex justify-end gap-6 text-[var(--mt-blue)] font-semibold">

                    <button onClick={onClose}>
                        Cancel
                    </button>

                    <button
                        disabled={isPending}
                        onClick={() => {
                           mutate(order.orderId, {
    onSuccess: (res: any) => {
        setToast({
            type: "success",
            message: res?.message || "Order deleted successfully",
        });

        setTimeout(() => {
            onClose();
        }, 1200);
    },
    onError: (err: any) => {
        setToast({
            type: "error",
            message: err?.message || "Delete failed",
        });
    },
});

                        }}
                    >
                        {isPending ? "Deleting..." : "Delete"}
                    </button>

                </div>

            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
        

    );
}
