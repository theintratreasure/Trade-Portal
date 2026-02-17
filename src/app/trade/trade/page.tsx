"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowDownUp,
    MoreHorizontal,
    FilePlus,
} from "lucide-react";
import TopBarSlot from "../components/layout/TopBarSlot";
import TradeTopBar from "../components/layout/TradeTopBar";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { useLiveTradeSocket, type LivePosition } from "@/hooks/useLiveTradeSocket";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import DeleteOrderModal from "../components/trade/DeleteOrderModal";
import OrderActionSheet from "../components/trade/OrderActionSheet";
import MobilePositionItem from "../components/trade/MobilePositionItem";
import PositionActionSheet from "../components/trade/PositionActionSheet";
import MobilePendingOrderItem from "../components/trade/MobilePendingOrderItem";
import ActionItem from "../components/trade/ActionItem";
import { useRouter } from "next/navigation";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";
import tradeApi from "@/api/tradeApi";

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

type PendingOrder = {
    orderId: string;
    createdAt: string | number;
    symbol: string;
    side: string;
    orderType: string;
    volume: number | string;
    price: number | string;
    stopLoss?: number | string | null;
    takeProfit?: number | string | null;
    currentPrice?: number | string | null;
    current_price?: number | string | null;
    ltp?: number | string | null;
    lastPrice?: number | string | null;
    status?: string | null;
    orderStatus?: string | null;
    state?: string | null;
};

type DesktopMenuAction = {
    label: string;
    onClick: () => void;
};

type DesktopMenuState = {
    id: string;
    top: number;
    right: number;
    actions: DesktopMenuAction[];
};

const formatDateTime24 = (value: string | number | Date | null | undefined) => {
    if (!value) return "-";
    const raw = typeof value === "string" ? value.trim() : value;
    let parsed: number | string | Date = raw;

    if (typeof raw === "string" && /^\d+$/.test(raw)) {
        const n = Number(raw);
        parsed = raw.length <= 10 || n < 1_000_000_000_000 ? n * 1000 : n;
    } else if (typeof raw === "number") {
        parsed = raw < 1_000_000_000_000 ? raw * 1000 : raw;
    }

    const dt = new Date(parsed);
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

const formatOpenTime24 = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return "-";

    const raw = typeof value === "string" ? value.trim() : value;
    let parsed: string | number | Date = raw;

    if (typeof raw === "string" && /^\d+$/.test(raw)) {
        const n = Number(raw);
        parsed = raw.length <= 10 || n < 1_000_000_000_000 ? n * 1000 : n;
    } else if (typeof raw === "number") {
        parsed = raw < 1_000_000_000_000 ? raw * 1000 : raw;
    }

    const dt = new Date(parsed);
    if (Number.isNaN(dt.getTime())) return String(value);

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

const toSafeNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const toFixedSafe = (value: unknown, digits = 2, fallback = "0.00") => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : fallback;
};

const isFinitePositive = (value: number) => Number.isFinite(value) && value > 0;

const getAccountIdFromUnknown = (value: unknown): string | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const row = value as Record<string, unknown>;
    const id = row.accountId ?? row._id ?? row.id;
    return id === undefined || id === null ? undefined : String(id);
};

function isActivePositionRow(row: Record<string, unknown>): boolean {
    const status = String(
        row?.status ?? row?.state ?? row?.positionStatus ?? row?.position_status ?? "OPEN"
    ).toUpperCase();
    if (status === "CLOSED" || status === "CLOSE" || status === "DELETED") return false;
    if (row?.isClosed === true || row?.closed === true) return false;
    if (row?.closeTime || row?.close_time || row?.closedAt || row?.closed_at) return false;
    if (String(row?.action ?? "").toUpperCase() === "CLOSE") return false;
    return true;
}

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

export default function TradePage() {
    const [sortOpen, setSortOpen] = useState<boolean>(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { data: tradeAccount } = useTradeAccount();

    const accountId = getAccountIdFromUnknown(tradeAccount);
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [showSheet, setShowSheet] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
    const [showOrderSheet, setShowOrderSheet] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { account, positions, pending } = useLiveTradeSocket(accountId);
    const [token] = useState<string>(() => getTradeTokenFromStorageSync());

    const { data: restFallback } = useQuery({
        queryKey: ["trade-live-fallback", accountId ?? null],
        enabled: Boolean(token || accountId),
        refetchInterval: 3000,
        staleTime: 1000,
        gcTime: 10_000,
        retry: 1,
        queryFn: async () => {
            const [accountRes, positionsRes, ordersRes] = await Promise.all([
                tradeApi.get("/trade/account"),
                tradeApi.get("/trade/positions", { params: { page: 1, limit: 200 } }),
                tradeApi.get("/trade/orders", { params: { page: 1, limit: 200 } }),
            ]);

            const accountRow =
                accountRes.data?.data ??
                accountRes.data?.account ??
                accountRes.data?.tradeAccount ??
                accountRes.data ??
                null;

            const positionsRows = Array.isArray(positionsRes.data?.positions)
                ? positionsRes.data.positions
                : Array.isArray(positionsRes.data?.data?.positions)
                    ? positionsRes.data.data.positions
                    : [];

            const ordersRows = Array.isArray(ordersRes.data?.orders)
                ? ordersRes.data.orders
                : Array.isArray(ordersRes.data?.data?.orders)
                    ? ordersRes.data.data.orders
                    : [];

            return {
                account: accountRow,
                positions: positionsRows,
                orders: ordersRows,
            };
        },
    });

    const effectiveAccount = account ?? restFallback?.account ?? null;

    const socketOrRestPositions = useMemo(() => {
        const rows = Array.isArray(restFallback?.positions) ? restFallback.positions : [];
        const restPositions: LivePosition[] = rows
            .filter((row: Record<string, unknown>) => isActivePositionRow(row))
            .map((row: Record<string, unknown>): LivePosition => {
                const side: LivePosition["side"] =
                    String(row?.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY";
                return {
                    accountId: String(row?.accountId ?? accountId ?? ""),
                    positionId: String(row?.orderId ?? row?.positionId ?? row?.id ?? row?._id ?? ""),
                    symbol: String(row?.symbol ?? "-"),
                    side,
                    volume: Number(row?.qty ?? row?.volume ?? 0),
                    openPrice: Number(row?.openPrice ?? 0),
                    currentPrice: Number(row?.currentPrice ?? row?.closePrice ?? row?.openPrice ?? 0),
                    floatingPnL: Number(row?.profitLoss ?? row?.floatingPnL ?? 0),
                    stopLoss: (row?.stopLoss ?? null) as number | null,
                    takeProfit: (row?.takeProfit ?? null) as number | null,
                    swap: Number(row?.swap ?? 0),
                    commission: Number(row?.commission ?? 0),
                    openTime:
                        row?.openTime != null
                            ? String(row.openTime)
                            : row?.open_time != null
                                ? String(row.open_time)
                                : undefined,
                };
            });

        // Merge to avoid socket partial updates shrinking the list intermittently.
        const merged = new Map<string, LivePosition>();
        for (const item of restPositions) merged.set(item.positionId, item);
        for (const item of positions) {
            const prev = merged.get(item.positionId);
            if (!prev) {
                merged.set(item.positionId, item);
                continue;
            }
            merged.set(item.positionId, {
                ...prev,
                ...item,
                openPrice: isFinitePositive(item.openPrice) ? item.openPrice : prev.openPrice,
                currentPrice: isFinitePositive(item.currentPrice) ? item.currentPrice : prev.currentPrice,
            });
        }
        return Array.from(merged.values());
    }, [accountId, positions, restFallback]);

    const socketOrRestPending = useMemo(() => {
        if (pending.length > 0) return pending;

        const rows = Array.isArray(restFallback?.orders) ? restFallback.orders : [];
        return rows
            .filter((row: Record<string, unknown>) => {
                const status = String(row?.status ?? "").toUpperCase();
                return status === "PENDING" || status === "PLACED" || status === "OPEN";
            })
            .map((row: Record<string, unknown>) => ({
                orderId: String(row?.orderId ?? row?.id ?? row?._id ?? ""),
                symbol: String(row?.symbol ?? "-"),
                side: String(row?.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
                orderType: String(row?.orderType ?? row?.type ?? "MARKET"),
                price: Number(row?.price ?? row?.openPrice ?? 0),
                volume: Number(row?.qty ?? row?.volume ?? 0),
                stopLoss: (row?.stopLoss ?? null) as number | null,
                takeProfit: (row?.takeProfit ?? null) as number | null,
                createdAt: Number(new Date(String(row?.openTime ?? row?.createdAt ?? 0)).getTime()),
                currentPrice: undefined,
                status: String(row?.status ?? "PENDING"),
            }));
    }, [pending, restFallback]);

    const pendingSymbols = useMemo(
        () =>
            Array.from(
                new Set(
                    socketOrRestPending
                        .map((order) => order?.symbol)
                        .filter((symbol): symbol is string => typeof symbol === "string" && symbol.length > 0)
                )
            ),
        [socketOrRestPending]
    );
    const quotes = useMarketQuotes(token, pendingSymbols);
    const [openMenu, setOpenMenu] = useState<DesktopMenuState | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const closeDesktopMenu = () => setOpenMenu(null);

    const toggleDesktopMenu = (
        key: string,
        anchor: HTMLElement,
        actions: DesktopMenuAction[]
    ) => {
        setOpenMenu((prev) => {
            if (prev?.id === key) return null;
            const rect = anchor.getBoundingClientRect();
            return {
                id: key,
                top: rect.bottom + 6,
                right: Math.max(8, window.innerWidth - rect.right),
                actions,
            };
        });
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeDesktopMenu();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!openMenu) return;

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeDesktopMenu();
            }
        }

        function handleViewportChange() {
            closeDesktopMenu();
        }

        window.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);

        return () => {
            window.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };
    }, [openMenu]);


    const accountBalance = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.balance);
    const accountEquity = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.equity);
    const accountBonusBalance = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.bonusBalance);
    const accountBonusLive = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.bonusLive);
    const accountBonusPercent = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.bonusPercent);
    const accountUsedMargin = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.usedMargin);
    const accountFreeMargin = toSafeNumber((effectiveAccount as Record<string, unknown> | null)?.freeMargin);
    const marginLevel =
        effectiveAccount && accountUsedMargin > 0
            ? ((accountEquity / accountUsedMargin) * 100).toFixed(2)
            : "0.00";

    const accountStats: AccountStat[] = effectiveAccount
        ? [
            { label: "Balance", value: accountBalance.toFixed(2) },
            { label: "Credit", value: accountBonusBalance.toFixed(2) },
            { label: "Equity", value: accountEquity.toFixed(2) },
            // { label: "Bonus Live", value: accountBonusLive.toFixed(2) },
            // { label: "Bonus (%)", value: accountBonusPercent.toFixed(2) },
            { label: "Margin", value: accountUsedMargin.toFixed(2) },
            { label: "Free margin", value: accountFreeMargin.toFixed(2) },
            { label: "Margin Level (%)", value: marginLevel },
        ]
        : [];

    const pnl =
        effectiveAccount
            ? accountEquity - accountBalance
            : 0;
    const formattedPnl = `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USD`;
    const pnlColorClass =
        pnl > 0
            ? "text-[var(--mt-blue)]"
            : pnl < 0
                ? "text-[var(--mt-red)]"
                : "text-[var(--text-muted)]";

    const livePositions: Position[] = useMemo(() => {
        return socketOrRestPositions.map((pos) => ({
            id: pos.positionId,
            pair: pos.symbol,
            type: pos.side.toLowerCase(),
            lot: toSafeNumber(pos.volume),
            from: toFixedSafe(pos.openPrice, 2, "-"),
            to: toFixedSafe(pos.currentPrice, 2, "-"),
            profit: toSafeNumber(pos.floatingPnL),
            openTime: pos.openTime
                ? formatOpenTime24(pos.openTime)
                : "-",

            swap: toFixedSafe(pos.swap),
            stopLoss: pos.stopLoss == null ? null : toSafeNumber(pos.stopLoss, 0),
            takeProfit: pos.takeProfit == null ? null : toSafeNumber(pos.takeProfit, 0),
        }));
    }, [socketOrRestPositions]);

    const pendingWithLive = useMemo<PendingOrder[]>(() => {
        return socketOrRestPending.map((order) => {
            const directCurrentPrice = order.currentPrice;
            const liveQuote = order.symbol ? quotes[order.symbol] : undefined;
            const side = String(order.side ?? "").toUpperCase();
            const quoteCurrentPrice = side === "BUY" ? liveQuote?.ask : liveQuote?.bid;
            return {
                ...order,
                currentPrice: directCurrentPrice ?? quoteCurrentPrice ?? "-",
            } as PendingOrder;
        });
    }, [socketOrRestPending, quotes]);

    const router = useRouter();
    const positionsGridTemplate =
        "minmax(96px,1fr) minmax(150px,1.4fr) minmax(100px,1fr) minmax(90px,0.9fr) minmax(70px,0.7fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,1fr) minmax(72px,0.8fr)";
    const ordersGridTemplate =
        "minmax(96px,1fr) minmax(150px,1.4fr) minmax(100px,1fr) minmax(90px,0.9fr) minmax(70px,0.7fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(110px,1fr) minmax(72px,0.8fr)";

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

            <div className="px-2 md:px-0 text-[13px] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] h-[calc(100vh-3.5rem)] md:h-full overflow-y-auto pb-5 mb-5">

                {/* ================= MOBILE (UNCHANGED) ================= */}
                <div className="md:hidden pb-6 mb-5">

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
                <div className="hidden md:block pt-4 mb-5">

                    <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md overflow-hidden shadow-sm">
                        {/* ===== ACCOUNT SUMMARY ===== */}
                        {effectiveAccount && (
                            <div className="px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                                <div className="flex flex-wrap items-center gap-8 text-[13px]">

                                    <div>
                                        <span className="text-[var(--text-muted)]">Balance:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountBalance.toFixed(2)}
                                        </span>
                                    </div>
                                     <div>
                                        <span className="text-[var(--text-muted)]">Used Margin:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountUsedMargin.toFixed(2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--text-muted)]">Equity:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountEquity.toFixed(2)}
                                        </span>
                                    </div>

                                   

                                    {/* <div>
                                        <span className="text-[var(--text-muted)]">Bonus:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountBonusBalance.toFixed(2)}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-muted)]">Bonus Live:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountBonusLive.toFixed(2)}
                                        </span>
                                    </div> */}
{/* 
                                    <div>
                                        <span className="text-[var(--text-muted)]">Bonus %:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountBonusPercent.toFixed(2)}%
                                        </span>
                                    </div> */}

                                    <div>
                                        <span className="text-[var(--text-muted)]">Free Margin:</span>{" "}
                                        <span className="font-semibold text-[var(--mt-blue)]">
                                            {accountFreeMargin.toFixed(2)}
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
                                Positions ({socketOrRestPositions.length})
                            </div>
                        </div>

                        {/* Column Header */}
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1050px] w-full">
                                <div
                                    className="grid w-full px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-soft)]"
                                    style={{ gridTemplateColumns: positionsGridTemplate }}
                                >
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
                                            className="grid w-full px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center"
                                            style={{ gridTemplateColumns: positionsGridTemplate }}
                                        >
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
                                                    onClick={(event) =>
                                                        toggleDesktopMenu(
                                                            `position-${pos.id}`,
                                                            event.currentTarget,
                                                            [
                                                                {
                                                                    label: "Close position",
                                                                    onClick: () => {
                                                                        router.push(`/trade/close/${pos.id}`);
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                                {
                                                                    label: "Modify position",
                                                                    onClick: () => {
                                                                        router.push(buildModifyPositionUrl(pos));
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                                {
                                                                    label: "New order",
                                                                    onClick: () => {
                                                                        router.push(`/trade/new-order?symbol=${pos.pair}`);
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                                {
                                                                    label: "Chart",
                                                                    onClick: () => {
                                                                        router.push(`/trade/charts?symbol=${pos.pair}`);
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                            ]
                                                        )
                                                    }
                                                    className="p-2 rounded-md hover:bg-[var(--bg-glass)] transition"
                                                >
                                                    <div className="flex flex-col gap-[3px]">
                                                        <MoreHorizontal />
                                                    </div>
                                                </button>
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
                                Orders ({socketOrRestPending.length})
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1050px] w-full">

                                {/* Column Header */}
                                <div
                                    className="grid w-full px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-soft)]"
                                    style={{ gridTemplateColumns: ordersGridTemplate }}
                                >
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
                                            className="grid w-full px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center"
                                            style={{ gridTemplateColumns: ordersGridTemplate }}
                                        >
                                            <div>{order.orderId.slice(0, 10)}</div>

                                            <div>
                                                {formatDateTime24(order.createdAt)}
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
                                                    onClick={(event) =>
                                                        toggleDesktopMenu(
                                                            `order-${order.orderId}`,
                                                            event.currentTarget,
                                                            [
                                                                {
                                                                    label: "Delete order",
                                                                    onClick: () => {
                                                                        setSelectedOrder(order);
                                                                        setShowDeleteModal(true);
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                                {
                                                                    label: "Modify order",
                                                                    onClick: () => {
                                                                        router.push(`/trade/modify-order/${order.orderId}`);
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                                {
                                                                    label: "New order",
                                                                    onClick: () => {
                                                                        router.push(
                                                                            `/trade/new-order?symbol=${order.symbol}&type=${encodeURIComponent(order.orderType)}`
                                                                        );
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                                {
                                                                    label: "Chart",
                                                                    onClick: () => {
                                                                        router.push(`/trade/charts?symbol=${order.symbol}`);
                                                                        closeDesktopMenu();
                                                                    },
                                                                },
                                                            ]
                                                        )
                                                    }
                                                    className="p-2 rounded-md hover:bg-[var(--bg-glass)] transition"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
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
            {openMenu &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[800] w-48 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg shadow-lg"
                        style={{
                            top: openMenu.top,
                            right: openMenu.right,
                        }}
                    >
                        {openMenu.actions.map((action) => (
                            <ActionItem
                                key={action.label}
                                label={action.label}
                                onClick={action.onClick}
                            />
                        ))}
                    </div>,
                    document.body
                )}

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
