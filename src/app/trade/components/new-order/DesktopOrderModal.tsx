"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useMarketOrder, usePendingOrder } from "@/hooks/trade/useTrade";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { Toast } from "@/app/components/ui/Toast";
import { useLiveTradeSocket } from "@/hooks/useLiveTradeSocket";
import { useParams } from "next/navigation";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";

type Props = {
    open: boolean;
    onClose: () => void;
    symbol: string;
    token?: string;
};
export default function DesktopOrderModal({
    open,
    onClose,
    symbol,
}: Props) {
    const { mutate: marketOrder } = useMarketOrder();
    const { mutate: pendingOrder, isPending } = usePendingOrder();

    const [side, setSide] = useState<"BUY" | "SELL">("BUY");
    const [tab, setTab] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");

    const [lot, setLot] = useState(0.01);
    const [price, setPrice] = useState<number | "">("");
    const [sl, setSl] = useState<number | "">("");
    const [tp, setTp] = useState<number | "">("");
    const [expiration, setExpiration] = useState("GTC");
    const [specifiedDate, setSpecifiedDate] = useState<Date | null>(null);
    const { id } = useParams<{ id: string }>();
    const [toast, setToast] = useState<any>(null);

    if (!open) return null;
    const { data: tradeAccount } = useTradeAccount();
    const accountId = tradeAccount?.accountId;
    const { positions } = useLiveTradeSocket(accountId);

    const position = useMemo(
        () => positions.find((p) => p.positionId === id),
        [positions, id]
    );
    const initialToken = getTradeTokenFromStorageSync();
    const [token] = useState<string>(initialToken);
    const quotes = useMarketQuotes(token);

    const live = symbol ? quotes[symbol] : undefined;
    const bid = Number(live?.bid ?? 0);
    const ask = Number(live?.ask ?? 0);
    const currentPrice = side === "BUY" ? ask : bid;

    const themeColor =
        side === "BUY" ? "var(--mt-blue)" : "var(--mt-red)";

    // 🔹 Validation same as mobile
    const bidColor =
        live?.bidDir === "up"
            ? "text-[var(--mt-blue)]"
            : live?.bidDir === "down"
                ? "text-[var(--mt-red)]"
                : "text-[var(--text-main)]";

    const askColor =
        live?.askDir === "up"
            ? "text-[var(--mt-blue)]"
            : live?.askDir === "down"
                ? "text-[var(--mt-red)]"
                : "text-[var(--text-main)]";

    const handleSubmit = () => {
        if (!symbol || lot <= 0) return;

        // 🔵 MARKET ORDER
        if (tab === "MARKET") {
            marketOrder(
                {
                    symbol,
                    side,
                    volume: lot,
                    stopLoss: sl === "" ? undefined : sl,
                    takeProfit: tp === "" ? undefined : tp,
                },
                {
                    onSuccess: () => {
                        setToast({ type: "success", message: "Order executed" });
                        setTimeout(onClose, 1200);
                    },
                    onError: (err: any) => {
                        setToast({
                            type: "error",
                            message: err?.message || "Market order failed",
                        });
                    },
                }
            );
            return;
        }

        // 🔵 PENDING ORDER
        const typeMap: any = {
            LIMIT: side === "BUY" ? "BUY_LIMIT" : "SELL_LIMIT",
            STOP: side === "BUY" ? "BUY_STOP" : "SELL_STOP",
        };

        const payload: any = {
            symbol,
            side,
            orderType: typeMap[tab],
            volume: lot,
            price: Number(price),
        };

        if (sl !== "") payload.stopLoss = Number(sl);
        if (tp !== "") payload.takeProfit = Number(tp);

        if (expiration === "SPECIFIED") {
            if (!specifiedDate) {
                setToast({
                    type: "error",
                    message: "Select expiration date",
                });
                return;
            }
            payload.expireType = "TIME";
            payload.expireAt = specifiedDate.toISOString();
        } else {
            payload.expireType = expiration;
        }

        pendingOrder(payload, {
            onSuccess: () => {
                setToast({ type: "success", message: "Pending order placed" });
                setTimeout(onClose, 1200);
            },
            onError: (err: any) => {
                setToast({
                    type: "error",
                    message: err?.message || "Order failed",
                });
            },
        });
    };

    return (
        <>
            <div className="hidden md:flex fixed inset-0 z-[9999] items-center justify-center ">
                <div className="w-[600px] bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-soft)]">

                    {/* HEADER */}
                    <div
                        className="flex items-center justify-between px-3 py-1 text-white"
                        style={{ background: themeColor }}
                    >
                        <div className="font-semibold">{symbol}</div>

                        <div className="font-bold">
                            {bid} / {ask}
                        </div>

                        <button
                            onClick={() =>
                                setSide((s) => (s === "BUY" ? "SELL" : "BUY"))
                            }
                            className="px-5 py-1 bg-[var(--bg-card)] text-[var(--text-main)] font-bold rounded-md"
                        >
                            {side}
                        </button>

                        <button onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* TABS */}
                    <div className="flex border-b border-[var(--border-soft)]">
                        {["MARKET", "LIMIT", "STOP"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t as any)}
                                className={`flex-1 py-3 text-sm font-semibold ${tab === t
                                    ? "border-b-2 border-[var(--primary)]"
                                    : "text-[var(--text-muted)]"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* BODY */}
                    <div className="px-6 py-2 grid grid-cols-2 gap-3">

                        {/* LOT */}
                        <div>
                            <label className="text-sm text-[var(--text-muted)]">
                                Lot Size
                            </label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={lot}
                                onChange={(e) =>
                                    setLot(Math.max(0.01, Number(e.target.value)))
                                }
                                className="mt-2 w-full px-2 py-1 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
                            />
                        </div>

                        {/* PRICE */}
                        {tab !== "MARKET" && (
                            <div>
                                <label className="text-sm text-[var(--text-muted)]">
                                    Trigger Price
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) =>
                                        setPrice(Number(e.target.value))
                                    }
                                    className="mt-2 w-full px-2 py-1 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
                                />
                            </div>
                        )}

                        {/* SL */}
                        <div>
                            <label className="text-sm text-[var(--text-muted)]">
                                Stop Loss
                            </label>
                            <input
                                type="number"
                                value={sl}
                                onChange={(e) =>
                                    setSl(Number(e.target.value))
                                }
                                className="mt-2 w-full px-2 py-1 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
                            />
                        </div>

                        {/* TP */}
                        <div>
                            <label className="text-sm text-[var(--text-muted)]">
                                Take Profit
                            </label>
                            <input
                                type="number"
                                value={tp}
                                onChange={(e) =>
                                    setTp(Number(e.target.value))
                                }
                                className="mt-2 w-full px-2 py-1 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
                            />
                        </div>

                        {/* EXPIRATION */}
                        {tab !== "MARKET" && (
                            <div className="col-span-2">
                                <div className="flex gap-4">
                                    {["GTC", "TODAY", "SPECIFIED"].map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => setExpiration(e)}
                                            className={`px-4 py-2 border rounded-md ${expiration === e
                                                ? "border-[var(--primary)]"
                                                : "border-[var(--border-soft)]"
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-2 border-t border-[var(--border-soft)] flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="px-8 py-3 rounded-lg text-[var(--text-main)] font-semibold"
                            style={{ background: themeColor }}
                        >
                            {isPending ? "Processing..." : side}
                        </button>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </>
    );
}
