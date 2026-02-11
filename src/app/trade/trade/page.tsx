"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDownUp,
    MoreHorizontal,
    FilePlus,
    DotSquareIcon,
} from "lucide-react";
import TopBarSlot from "../components/layout/TopBarSlot";
import TradeTopBar from "../components/layout/TradeTopBar";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { useLiveTradeSocket } from "@/hooks/useLiveTradeSocket";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { useCancelPendingOrder } from "@/hooks/useCancelPendingOrder";
import { Toast } from "@/app/components/ui/Toast";
import DeleteOrderModal from "../components/trade/DeleteOrderModal";
import OrderActionSheet from "../components/trade/OrderActionSheet";
import MobilePositionItem from "../components/trade/MobilePositionItem";
import PositionActionSheet from "../components/trade/PositionActionSheet";
import MobilePendingOrderItem from "../components/trade/MobilePendingOrderItem";
import ActionItem from "../components/trade/ActionItem";
import { useRouter } from "next/navigation";

type AccountStat = {
    label: string;
    value: string;
};

type Position = {
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

function buildModifyPositionUrl(pos: Position): string {
    const params = new URLSearchParams({
        symbol: pos.pair ?? "",
        side: (pos.type ?? "").toUpperCase(),
        volume: String(pos.lot ?? ""),
        currentPrice: String(pos.to ?? ""),
        stopLoss: pos.stopLoss == null ? "" : String(pos.stopLoss),
        takeProfit: pos.takeProfit == null ? "" : String(pos.takeProfit),
    });
    return `/trade/modify/${pos.id}?${params.toString()}`;
}

function getTradeTokenFromStorageSync(): string {
    if (typeof window === "undefined") return "";
    const local = localStorage.getItem("accessToken");
    if (local) return local;
    const cookie = document.cookie
        .split("; ")
        .find((c) => c.trim().startsWith("tradeToken="));
    return cookie ? cookie.split("=")[1] : "";
}

export default function TradePage() {
    const [sortOpen, setSortOpen] = useState<boolean>(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [bulkOpen, setBulkOpen] = useState<boolean>(false);
    const { data: tradeAccount } = useTradeAccount();

    const accountId = tradeAccount?.accountId;
    const [selectedPos, setSelectedPos] = useState<any | null>(null);
    const [showSheet, setShowSheet] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [showOrderSheet, setShowOrderSheet] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { account, positions, pending } = useLiveTradeSocket(accountId);
    const [token] = useState<string>(() => getTradeTokenFromStorageSync());
    const pendingSymbols = useMemo(
        () =>
            Array.from(
                new Set(
                    pending
                        .map((order) => order?.symbol)
                        .filter((symbol): symbol is string => typeof symbol === "string" && symbol.length > 0)
                )
            ),
        [pending]
    );
    const quotes = useMarketQuotes(token, pendingSymbols);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const marginLevel =
        account && account.usedMargin > 0
            ? ((account.equity / account.usedMargin) * 100).toFixed(2)
            : "0.00";

    const accountStats: AccountStat[] = account
        ? [
            { label: "Balance", value: account.balance.toFixed(2) },
            { label: "Equity", value: account.equity.toFixed(2) },
            { label: "Margin", value: account.usedMargin.toFixed(2) },
            { label: "Free margin", value: account.freeMargin.toFixed(2) },
            { label: "Margin Level (%)", value: marginLevel },
        ]
        : [];

    const pnl =
        account
            ? account.equity - account.balance
            : 0;
    const formattedPnl = `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USD`;
    const pnlColorClass =
        pnl > 0
            ? "text-[var(--mt-blue)]"
            : pnl < 0
                ? "text-[var(--mt-red)]"
                : "text-[var(--text-muted)]";

    const livePositions: Position[] = useMemo(() => {
        return positions.map((pos) => ({
            id: pos.positionId,
            pair: pos.symbol,
            type: pos.side.toLowerCase(),
            lot: pos.volume ?? 0,
            from: pos.openPrice?.toFixed(2) ?? "-",
            to: pos.currentPrice?.toFixed(2) ?? "-",
            profit: pos.floatingPnL ?? 0,
            openTime: pos.openTime
                ? new Date(Number(pos.openTime)).toLocaleString()
                : "-",

            swap: pos.swap?.toFixed(2) ?? "0.00",
            stopLoss: pos.stopLoss ?? null,
            takeProfit: pos.takeProfit ?? null,
        }));
    }, [positions]);

    const pendingWithLive = useMemo(() => {
        return pending.map((order) => {
            const directCurrentPrice =
                order.currentPrice ?? order.current_price ?? order.ltp ?? order.lastPrice;
            const liveQuote = order.symbol ? quotes[order.symbol] : undefined;
            const side = String(order.side ?? "").toUpperCase();
            const quoteCurrentPrice = side === "BUY" ? liveQuote?.ask : liveQuote?.bid;
            return {
                ...order,
                currentPrice: directCurrentPrice ?? quoteCurrentPrice ?? "-",
            };
        });
    }, [pending, quotes]);

    const router = useRouter();
    return (
        <>
            <TopBarSlot>
                <TradeTopBar
                    title="Trade"
                    subtitle={formattedPnl}
                    subtitleClassName={pnlColorClass}
                    showMenu
                    right={
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSortOpen(!sortOpen)}>
                                <ArrowDownUp size={18} />
                            </button>
                            <button>
                                <FilePlus size={20} />
                            </button>
                        </div>
                    }
                />
            </TopBarSlot>

            <div className="px-2 md:px-0 text-[13px] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] h-[calc(80vh)] md:h-[calc(97vh)] overflow-y-auto">

                {/* ================= MOBILE (UNCHANGED) ================= */}
                <div className="md:hidden pb-6">

                    <div className="space-y-[6px] ">
                        {accountStats.map((row) => (
                            <div key={row.label} className="flex items-center gap-2">
                                <span className="text-[var(--text-main)] font-semibold whitespace-nowrap">
                                    {row.label}:
                                </span>

                                <span
                                    className="flex-1 h-[6px] translate-y-[5px]"
                                    style={{
                                        backgroundImage:
                                            "radial-gradient(circle, rgba(156,163,175,0.35) .5px, transparent 1.6px)",
                                        backgroundSize: "6px 6px",
                                        backgroundRepeat: "repeat-x",
                                        backgroundPosition: "left center",
                                    }}
                                />

                                <span className="font-semibold whitespace-nowrap">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-2">
                        <div className="flex justify-between items-center py-[3px] bg-[var(--bg-glass)]">
                            <span className="text-[var(--text-muted)] font-semibold">
                                Positions
                            </span>
                        </div>

                        {livePositions.length > 0 ? (
                            livePositions.map((pos) => (
                                <MobilePositionItem
                                    key={pos.id}
                                    pos={pos}
                                    expandedId={expandedId}
                                    setExpandedId={setExpandedId}
                                    onLongPress={(p) => {
                                        setSelectedPos(p);
                                        setShowSheet(true);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="text-center py-6 text-[var(--text-muted)]">
                                No Positions
                            </div>
                        )}
                    </div>

                    {/* Pending Orders */}
                    <div className="">
                        <div className="flex justify-between items-center py-[3px] bg-[var(--bg-glass)]">
                            <span className="text-[var(--text-muted)] font-semibold">
                                Orders
                            </span>
                        </div>

                        {pendingWithLive.length > 0 ? (
                            pendingWithLive.map((order) => (
                                <MobilePendingOrderItem
                                    key={order.orderId}
                                    order={order}
                                    expandedId={expandedId}
                                    setExpandedId={setExpandedId}
                                    onLongPress={(o) => {
                                        setSelectedOrder(o);
                                        setShowOrderSheet(true);
                                    }}
                                />
                            ))

                        ) : (
                            <>

                            </>
                        )}
                    </div>



                </div>

                {/* ================= DESKTOP ================= */}
                <div className="hidden md:block pt-4">

                    <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md overflow-hidden shadow-sm">
                        {/* ===== ACCOUNT SUMMARY ===== */}
                        {account && (
                            <div className="px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                                <div className="flex flex-wrap items-center gap-8 text-[13px]">

                                    <div>
                                        <span className="text-[var(--text-muted)]">Balance:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {account.balance.toFixed(2)}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-muted)]">Equity:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {account.equity.toFixed(2)}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-muted)]">Used Margin:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {account.usedMargin.toFixed(2)}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-muted)]">Free Margin:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {account.freeMargin.toFixed(2)}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-muted)]">Margin Level:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {marginLevel}%
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-muted)]">Total PnL:</span>{" "}
                                        <span className={`font-semibold ${pnlColorClass}`}>
                                            {pnl.toFixed(2)}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                            <div className="font-semibold text-[14px]">
                                Positions ({positions.length})
                            </div>
                        </div>

                        {/* Column Header */}
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1050px]">
                                <div className="grid grid-cols-[100px_150px_90px_70px_70px_90px_90px_90px_90px_90px_90px_70px] px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-soft)]">
                                    <div>ID</div>
                                    <div>TIME</div>
                                    <div>SYMBOL</div>
                                    <div>ORDER</div>
                                    <div>LOT</div>
                                    <div>PRICE</div>
                                    <div>SL</div>
                                    <div>TP</div>
                                    <div>SWAP</div>
                                    <div>LTP</div>
                                    <div className="text-right">PROFIT</div>
                                    <div className="text-right">ACTION</div>
                                </div>


                                {/* Rows */}
                                {livePositions.length > 0 ? (
                                    livePositions.map((pos) => (
                                        <div
                                            key={pos.id}
                                            className="grid grid-cols-[100px_150px_90px_70px_70px_90px_90px_90px_90px_90px_90px_70px] px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center">
                                            <div>{pos.id.slice(0, 10)}</div>
                                            <div>{pos.openTime}</div>
                                            <div className="font-semibold">{pos.pair}</div>
                                            <div className={
                                                pos.type === "buy"
                                                    ? "text-[var(--mt-blue)]"
                                                    : "text-[var(--mt-red)]"
                                            }
                                            >
                                                {pos.type} {pos.lot}
                                            </div>
                                            <div>{pos.lot}</div>
                                            <div>{pos.from}</div>
                                            <div>{pos.stopLoss ?? "-"}</div>
                                            <div>{pos.takeProfit ?? "-"}</div>
                                            <div>{pos.swap}</div>
                                            <div>{pos.to}</div>

                                            <div
                                                className={`text-right font-semibold ${pos.profit < 0
                                                    ? "text-[var(--mt-red)]"
                                                    : "text-[var(--mt-blue)]"
                                                    }`}
                                            >
                                                {pos.profit.toFixed(2)}
                                            </div>
                                            <div className="relative text-right">
                                                <button
                                                    onClick={() =>
                                                        setOpenMenuId(openMenuId === pos.id ? null : pos.id)
                                                    }
                                                    className="p-2 rounded-md hover:bg-[var(--bg-glass)] transition"
                                                >
                                                    <div className="flex flex-col gap-[3px]">
                                                        <MoreHorizontal />
                                                    </div>
                                                </button>

                                                {openMenuId === pos.id && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg shadow-lg z-50"
                                                    >
                                                        <ActionItem
                                                            label="Close position"
                                                            onClick={() => {
                                                                router.push(`/trade/close/${pos.id}`);
                                                                setOpenMenuId(null);
                                                            }}
                                                        />

                                                        <ActionItem
                                                            label="Modify position"
                                                            onClick={() => {
                                                                router.push(buildModifyPositionUrl(pos));
                                                                setOpenMenuId(null);
                                                            }}
                                                        />

                                                        <ActionItem
                                                            label="New order"
                                                            onClick={() => {
                                                                router.push(`/trade/new-order?symbol=${pos.pair}`);
                                                                setOpenMenuId(null);
                                                            }}
                                                        />

                                                        <ActionItem
                                                            label="Chart"
                                                            onClick={() => {
                                                                router.push(`/trade/charts?symbol=${pos.pair}`);
                                                                setOpenMenuId(null);
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>


                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-muted)]">
                                        No Order(s) Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ================= DESKTOP PENDING ================= */}
                    <div className="mt-6 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md overflow-hidden shadow-sm">

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                            <div className="font-semibold text-[14px]">
                                Orders ({pending.length})
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1050px]">

                                {/* Column Header */}
                                <div className="grid grid-cols-[100px_150px_90px_70px_70px_90px_90px_90px_90px_90px_70px] px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-soft)]">
                                    <div>ID</div>
                                    <div>TIME</div>
                                    <div>SYMBOL</div>
                                    <div>TYPE</div>
                                    <div>LOT</div>
                                    <div>PRICE</div>
                                    <div>SL</div>
                                    <div>TP</div>
                                    <div>LTP</div>
                                    <div className="text-right">STATUS</div>
                                    <div className="text-right">ACTION</div>
                                </div>

                                {/* Rows */}
                                {pendingWithLive.length > 0 ? (
                                    pendingWithLive.map((order) => (
                                        <div
                                            key={order.orderId}
                                            className="grid grid-cols-[100px_150px_90px_70px_70px_90px_90px_90px_90px_90px_70px] px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center"
                                        >
                                            <div>{order.orderId.slice(0, 10)}</div>

                                            <div>
                                                {new Date(order.createdAt).toLocaleString()}
                                            </div>

                                            <div className="font-semibold">
                                                {order.symbol}
                                            </div>

                                            <div
                                                className={
                                                    order.side === "BUY"
                                                        ? "text-[var(--mt-blue)]"
                                                        : "text-[var(--mt-red)]"
                                                }
                                            >
                                                {order.orderType}
                                            </div>

                                            <div>{order.volume}</div>

                                            <div>{order.price}</div>

                                            <div>{order.stopLoss ?? "-"}</div>

                                            <div>{order.takeProfit ?? "-"}</div>

                                            <div>{order.currentPrice ?? "-"}</div>

                                            <div className="text-right font-semibold text-[var(--text-muted)]">
                                                {(order.status ?? order.orderStatus ?? order.state ?? "PENDING")
                                                    ?.toString()
                                                    .toUpperCase() === "PENDING"
                                                    ? "PLACED"
                                                    : (order.status ?? order.orderStatus ?? order.state ?? "PENDING")}
                                            </div>

                                            {/* ACTION COLUMN */}
                                            <div className="relative text-right">
                                                <button
                                                    onClick={() =>
                                                        setOpenMenuId(
                                                            openMenuId === order.orderId
                                                                ? null
                                                                : order.orderId
                                                        )
                                                    }
                                                    className="p-2 rounded-md hover:bg-[var(--bg-glass)] transition"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {openMenuId === order.orderId && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg shadow-lg z-50"
                                                    >
                                                        <ActionItem
                                                            label="Delete order"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowDeleteModal(true);
                                                                setOpenMenuId(null);
                                                            }}
                                                        />

                                                        <ActionItem
                                                            label="Modify order"
                                                            onClick={() => {
                                                                router.push(`/trade/modify-order/${order.orderId}`);
                                                                setOpenMenuId(null);
                                                            }}
                                                        />

                                                        <ActionItem
                                                            label="New order"
                                                            onClick={() => {
                                                                router.push(
                                                                    `/trade/new-order?symbol=${order.symbol}&type=${encodeURIComponent(order.orderType)}`
                                                                );
                                                                setOpenMenuId(null);
                                                            }}
                                                        />

                                                        <ActionItem
                                                            label="Chart"
                                                            onClick={() => {
                                                                router.push(`/trade/charts?symbol=${order.symbol}`);
                                                                setOpenMenuId(null);
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-muted)]">
                                        No Pending Orders
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </div>

            </div>

            {/* 👇 YAHAN ADD KARO */}
            <PositionActionSheet
                pos={selectedPos}
                open={showSheet}
                onClose={() => setShowSheet(false)}
            />
            <OrderActionSheet
                order={selectedOrder}
                open={showOrderSheet}
                onClose={() => setShowOrderSheet(false)}
                onDeleteClick={() => setShowDeleteModal(true)}
            />
            <DeleteOrderModal
                order={selectedOrder}
                open={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setShowOrderSheet(false);
                }}
            />

        </>
    );
}
// export function useLongPress(callback: () => void, ms = 500) {
//     const timerRef = useRef<NodeJS.Timeout | null>(null);

//     const start = () => {
//         timerRef.current = setTimeout(() => {
//             callback();
//         }, ms);
//     };

//     const clear = () => {
//         if (timerRef.current) {
//             clearTimeout(timerRef.current);
//             timerRef.current = null;
//         }
//     };

//     return {
//         onTouchStart: start,
//         onTouchEnd: clear,
//         onTouchMove: clear,
//         onMouseDown: start,
//         onMouseUp: clear,
//         onMouseLeave: clear,
//     };
// }
