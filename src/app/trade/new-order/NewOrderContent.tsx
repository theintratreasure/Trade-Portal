"use client";
export const dynamic = "force-dynamic";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback, Suspense } from "react";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { ArrowLeft, CircleDollarSign, DollarSignIcon, FilePlus, FileX } from "lucide-react";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import TopBarSlot from "../components/layout/TopBarSlot";
import TradeTopBar from "../components/layout/TradeTopBar";
import LiveChart from "../components/new-order/chart";
import { useWatchlist } from "@/hooks/watchlist/useWatchlist";
import { useMarketOrder, usePendingOrder } from "@/hooks/trade/useTrade";
import { Toast } from "@/app/components/ui/Toast";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";
type OrderResult = {
    status: "loading" | "success" | "error";
    message?: string;
    side?: "BUY" | "SELL";
    orderType?: string;
    volume?: string;
    filled?: string;
    symbol?: string;
    price?: number;
};


type SplitPrice = {
    int: string;
    normal: string;
    big: string;
    small?: string;
};

function splitPrice(price?: string): SplitPrice {
    if (!price || isNaN(Number(price))) {
        return {
            int: "0",
            normal: "",
            big: "00",
        };
    }

    const [intPart, decimalRaw = ""] = price.split(".");
    const decimals = decimalRaw;

    if (decimals.length === 0) {
        return { int: intPart, normal: "", big: "" };
    }

    if (decimals.length === 2) {
        return {
            int: intPart,
            normal: "",
            big: decimals,
        };
    }

    if (decimals.length >= 3) {
        return {
            int: intPart,
            normal: decimals.slice(0, decimals.length - 3),
            big: decimals.slice(decimals.length - 3, decimals.length - 1),
            small: decimals.slice(-1),
        };
    }

    return {
        int: intPart,
        normal: decimals,
        big: "",
    };
}
export default function NewOrderPage() {
    const MIN_LOT = 0;
    const MAX_LOT = 100;
    const search = useSearchParams();
    const router = useRouter();
    const symbol = search.get("symbol") || "";
    const { data: watchlist } = useWatchlist();
    const [openWatchlist, setOpenWatchlist] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [sl, setSl] = useState<number | "">("");
    const [tp, setTp] = useState<number | "">("");
    const [specifiedDate, setSpecifiedDate] = useState<Date | null>(null);
    const [openSpecifiedModal, setOpenSpecifiedModal] = useState(false);
    const successAudioRef = useRef<HTMLAudioElement | null>(null);
    const errorAudioRef = useRef<HTMLAudioElement | null>(null);

    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const [processingSide, setProcessingSide] = useState<"BUY" | "SELL" | null>(null);

    const STEP = 0.0001; // adjust per symbol
    const marketMutation = useMarketOrder();
    const pendingMutation = usePendingOrder();
    const selectedType = search.get("type");
    type OrderResultState =
        | null
        | {
            status: "loading" | "success" | "error";
            message?: string;
            side?: "BUY" | "SELL";
        };

    const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

    useEffect(() => {
        successAudioRef.current = new Audio("/sound/success.mp3");
        errorAudioRef.current = new Audio("/sound/error.mp3");

        successAudioRef.current.volume = 0.8;
        errorAudioRef.current.volume = 0.8;
    }, []);
    useEffect(() => {
        if (!orderResult) return;

        if (orderResult.status === "success") {
            successAudioRef.current?.play().catch(() => { });
        }

        if (orderResult.status === "error") {
            errorAudioRef.current?.play().catch(() => { });
        }
    }, [orderResult?.status]);


    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpenWatchlist(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ Fix 1: Initialize with immediate token fetch
    const initialToken = getTradeTokenFromStorageSync();
    const [token, setToken] = useState<string>(initialToken);
    const [isTokenReady, setIsTokenReady] = useState(true);
    const tokenRef = useRef<string>(initialToken);


    // ✅ Fix 2: Synchronous token fetch on mount + optimistic loading
    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    // ✅ Fix 3: Pass ref.current instead of state to avoid re-renders
    const quotes = useMarketQuotes(token);
    const live = token ? quotes[symbol] : undefined;
    const [orderType, setOrderType] = useState("MARKET EXECUTION");
    const [openType, setOpenType] = useState(false);
    const [price, setPrice] = useState<number | "">("");
    const [expiration, setExpiration] = useState("GTC");
    const [openExpiration, setOpenExpiration] = useState(false);

    const expirationOptions = ["GTC", "TODAY", "SPECIFIED"];
    const orderOptions = [
        "MARKET EXECUTION",
        "BUY LIMIT",
        "SELL LIMIT",
        "BUY STOP",
        "SELL STOP",
    ];
    useEffect(() => {
        if (!selectedType) return;

        const normalized = selectedType
            .toLowerCase()
            .replace("_", " ");

        const map: Record<string, string> = {
            buy: "MARKET EXECUTION",
            sell: "MARKET EXECUTION",
            "buy limit": "BUY LIMIT",
            "sell limit": "SELL LIMIT",
            "buy stop": "BUY STOP",
            "sell stop": "SELL STOP",
        };

        const mapped = map[normalized];

        if (mapped) {
            setOrderType(mapped);
        }
    }, [selectedType]);

    const [volumeInput, setVolumeInput] = useState("0.01");

    const volume = useMemo(() => {
        const parsed = Number(volumeInput);
        if (!Number.isFinite(parsed)) return 0;
        return Number(Math.min(MAX_LOT, Math.max(MIN_LOT, parsed)).toFixed(2));
    }, [volumeInput]);

    const adjustVolume = (delta: number) => {
        setVolumeInput((prev) => {
            const current = prev === "" ? 0 : Number(prev);
            const safeCurrent = Number.isFinite(current) ? current : 0;
            const next = Math.min(MAX_LOT, Math.max(MIN_LOT, safeCurrent + delta));
            return next.toFixed(2);
        });
    };


    const midPrice = useMemo(() => {
        if (!live?.bid || !live?.ask) return 0;
        const bid = Number(live.bid);
        const ask = Number(live.ask);
        if (isNaN(bid) || isNaN(ask)) return 0;
        return (bid + ask) / 2;
    }, [live?.bid, live?.ask]);

    const stepButtons = useMemo(() => {
        if (!midPrice) return [];
        if (midPrice < 1) return [-0.5, -0.1, -0.01, 0.01, 0.1, 0.5];
        return [-5, -1, -0.1, 0.1, 1, 5];
    }, [midPrice]);

    // ✅ Fix 4: Proper loading states - separate token vs data loading
    if (!isTokenReady) {
        return <GlobalLoader />;
    }

    const marketReady = !!live;
    const isPendingMode = orderType !== "MARKET EXECUTION";
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


    const handleMarketOrder = (side: "BUY" | "SELL") => {
        if (!symbol || volume <= 0) return;

        setProcessingSide(side);

        // 🔵 Show QUEUE screen immediately
        setOrderResult({
            status: "loading",
            side,
            orderType,
            volume: volume.toFixed(2),
            filled: "0.00",
            symbol,
            price: undefined,
        });


        marketMutation.mutate(
            {
                symbol,
                side,
                volume,
                stopLoss: sl === "" ? undefined : sl,
                takeProfit: tp === "" ? undefined : tp,
            },
            {
                onSuccess: (res: any) => {
                    const data = res?.data;

                    setTimeout(() => {

                        setOrderResult({
                            status: "success",
                            side: data?.side,
                            orderType: orderType, // MARKET EXECUTION
                            volume: data?.volume?.toFixed(2),
                            filled: data?.volume?.toFixed(2), // market me fully filled
                            symbol: data?.symbol,
                            price: data?.openPrice,
                            message: data?.positionId?.slice(0, 10) // 10 digit id
                        });

                        setTimeout(() => {
                            router.push("/trade/trade");
                        }, 1000); // 1 sec show success screen

                    }, 700);
                },
                onError: (err: any) => {
                    setTimeout(() => {
                        setOrderResult({
                            status: "error",
                            message: err?.message || "Market closed",
                        });

                        // stay on same page
                        setTimeout(() => {
                            setOrderResult(null);
                        }, 1500);
                    }, 700);
                },
                onSettled: () => {
                    setProcessingSide(null);
                },
            }
        );
    };

    const handlePendingOrder = () => {
        if (!symbol || volume <= 0 || price === "") return;

        const mapOrderType = {
            "BUY LIMIT": "BUY_LIMIT",
            "SELL LIMIT": "SELL_LIMIT",
            "BUY STOP": "BUY_STOP",
            "SELL STOP": "SELL_STOP",
        } as const;

        const apiOrderType =
            mapOrderType[orderType as keyof typeof mapOrderType];

        if (!apiOrderType) return;

        const side: "BUY" | "SELL" =
            orderType.includes("BUY") ? "BUY" : "SELL";

        // 🧠 Base payload (required fields only)
        const payload: any = {
            symbol,
            side,
            orderType: apiOrderType,
            price: Number(price),
            volume: Number(volume),
        };

        // Optional SL
        if (sl !== "") {
            payload.stopLoss = Number(sl);
        }

        // Optional TP
        if (tp !== "") {
            payload.takeProfit = Number(tp);
        }

        // Expiration logic
        if (expiration === "SPECIFIED") {
            if (!specifiedDate) {
                setToast({
                    type: "error",
                    message: "Please select expiration date",
                });
                return;
            }

            payload.expireType = "TIME";
            payload.expireAt = specifiedDate.toISOString();
        } else {
            payload.expireType = expiration; // GTC or TODAY
        }

        setOrderResult({ status: "loading" });

        pendingMutation.mutate(payload, {
            onSuccess: (res: any) => {
                setTimeout(() => {
                    if (res?.status !== "success") {
                        setOrderResult({
                            status: "error",
                            message: res?.message || "Order rejected",
                        });

                        setTimeout(() => {
                            setOrderResult(null);
                        }, 1500);

                        return;
                    }

                    setOrderResult({
                        status: "loading",
                        side,
                        orderType,
                        volume: volume.toFixed(2),
                        filled: "0.00",
                        symbol,
                        price: Number(price),
                    });


                    setTimeout(() => {
                        router.push("/trade/trade");
                    }, 1200);
                }, 700);
            },
            onError: (err: any) => {
                setTimeout(() => {
                    setOrderResult({
                        status: "error",
                        message: err?.message || "Order failed",
                    });

                    setTimeout(() => {
                        setOrderResult(null);
                    }, 1500);
                }, 700);
            },
        });

    };

    function formatDateTime(date: Date) {
        const pad = (n: number) => n.toString().padStart(2, "0");

        return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(
            date.getDate()
        )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }


    return (
        <>
            <TopBarSlot>
                <TradeTopBar
                    showBack
                    title={symbol}
                    subtitle={getSymbolName(symbol)}
                    showMenu={false}
                    right={
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setOpenWatchlist((p) => !p)}>
                                <DollarSignIcon size={22} />
                            </button>

                            {openWatchlist && (
                                <div className="
            absolute right-0 mt-2
            w-20
            max-h-64 overflow-y-auto
            rounded-lg border shadow-lg
            z-[999]
        "
                                    style={{
                                        backgroundColor: "var(--bg-muted-card)",
                                        borderColor: "var(--border-soft)"
                                    }}
                                >
                                    {watchlist?.map((item: any) => (
                                        <div
                                            key={item.code}
                                            onClick={() => {
                                                setOpenWatchlist(false);
                                                router.push(`/trade/new-order?symbol=${item.code}`);
                                            }}
                                            className="
                        px-4 py-3 text-sm cursor-pointer
                        hover:bg-[var(--bg-plan)]
                        border-b last:border-none
                    "
                                            style={{ borderColor: "var(--border-soft)" }}
                                        >
                                            {item.code}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    }
                />
            </TopBarSlot>

            {/* Desktop Heading */}
            {/* <div className="hidden md:flex flex-col ">

                <div className="flex items-center justify-between">

                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-wide">
                            New Order
                        </h1>

                        <p className="text-sm text-[var(--text-muted)] mt-2">
                            Execute or schedule trades with precision control
                        </p>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-[var(--bg-plan)] border border-[var(--border-soft)] text-sm text-[var(--text-muted)]">
                        {symbol}
                    </div>

                </div>

                <div className="mt-6 h-[1px] w-full bg-[var(--border-soft)]" />

            </div> */}

            <div className="md:hidden relative min-h-screen bg-[var(--bg-plan)] md:bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col overflow-y-auto pb-[calc(180px+env(safe-area-inset-bottom))] md:px-6 ">

                {/* MARKET EXECUTION */}
                <div className="relative border-b border-gray-800 py-3">

                    {/* Selected Value */}
                    <div
                        onClick={() => setOpenType((p) => !p)}
                        className="text-center text-sm text-[var(--text-main)] cursor-pointer relative select-none"
                    >
                        {orderType}

                        {/* Bottom-right corner triangle (like textarea resize) */}
                        <span className="absolute right-0 top-4 text-xl text-gray-500">
                            ▾
                        </span>
                    </div>

                    {/* Dropdown */}
                    {openType && (
                        <div className="absolute left-0 right-0 top-0 bg-[var(--bg-plan)] border border-gray-700 z-50">
                            {orderOptions.map((opt) => (
                                <div
                                    key={opt}
                                    onClick={() => {
                                        setOrderType(opt);
                                        setOpenType(false);
                                    }}
                                    className="text-center py-3 text-sm text-[var(--text-main)] hover:bg-gray-800 cursor-pointer transition"
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* VOLUME ROW */}
                <div className="flex items-center justify-between px-2 py-3 text-sm select-none border-b border-gray-800">
                    <div className="flex gap-2 text-[var(--text-main)]">
                        {stepButtons
                            .filter((v) => v < 0)
                            .map((v, i) => (
                                <button
                                    key={i}
                                    className="px-2 py-1 rounded text-1xl hover:bg-gray-800 transition-colors"
                                    onClick={() => adjustVolume(v)}
                                >
                                    {v}
                                </button>
                            ))}
                    </div>

                    <input
                        type="text"
                        inputMode="decimal"
                        value={volumeInput}
                        onChange={(e) => {
                            const raw = e.target.value.trim();
                            if (raw === "") {
                                setVolumeInput("");
                                return;
                            }

                            if (!/^\d*\.?\d{0,2}$/.test(raw)) return;

                            const parsed = Number(raw);
                            if (!Number.isFinite(parsed)) return;
                            if (parsed > MAX_LOT) {
                                setVolumeInput(MAX_LOT.toFixed(2));
                                return;
                            }

                            setVolumeInput(raw);
                        }}
                        onBlur={() => {
                            if (volumeInput === "") {
                                setVolumeInput("0.01");
                                return;
                            }
                            const parsed = Number(volumeInput);
                            if (!Number.isFinite(parsed)) {
                                setVolumeInput("0.01");
                                return;
                            }
                            const normalized = Math.min(MAX_LOT, Math.max(MIN_LOT, parsed));
                            setVolumeInput(normalized.toFixed(2));
                        }}
                        className="w-20 bg-transparent text-center text-1xl font-bold text-[var(--text-main)] outline-none border-b border-gray-700"
                    />


                    <div className="flex gap-2 text-[var(--mt-blue)]">
                        {stepButtons
                            .filter((v) => v > 0)
                            .map((v, i) => (
                                <button
                                    key={i}
                                    className="px-2 py-1 rounded text-1xl hover:bg-blue-900/50 transition-colors"
                                    onClick={() => adjustVolume(v)}
                                >
                                    +{v}
                                </button>
                            ))}
                    </div>
                </div>

                {/* LIVE PRICES */}
                <div className="flex justify-around px-6 pb-3 pt-2">
                    <div className={`font-bold ${bidColor}`}>
                        {marketReady ? (
                            (() => {
                                const bid = splitPrice(live!.bid);
                                return (
                                    <div className="text-right leading-none">
                                        <span className="text-2xl">{bid.int}.</span>
                                        {bid.normal && <span className="text-2xl">{bid.normal}</span>}
                                        {bid.big && <span className="text-4xl">{bid.big}</span>}
                                        {bid.small && (
                                            <sup className="text-lg relative -top-3 ml-[2px]">{bid.small}</sup>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="text-right leading-none text-[var(--text-muted)]">
                                --.--{/* placeholder */}
                            </div>
                        )}
                    </div>

                    <div className={`font-bold ${askColor}`}>
                        {marketReady ? (
                            (() => {
                                const ask = splitPrice(live!.ask);
                                return (
                                    <div className="text-right leading-none">
                                        <span className="text-2xl">{ask.int}.</span>
                                        {ask.normal && <span className="text-2xl">{ask.normal}</span>}
                                        {ask.big && <span className="text-4xl">{ask.big}</span>}
                                        {ask.small && (
                                            <sup className="text-lg relative -top-3 ml-[2px]">{ask.small}</sup>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="text-right leading-none text-[var(--text-muted)]">
                                --.--{/* placeholder */}
                            </div>
                        )}
                    </div>
                </div>


                {isPendingMode && (
                    <div className="flex items-center justify-center px-6 py-2">

                        <div className="flex items-center gap-3 w-full">

                            {/* Minus */}
                            <button
                                className="text-[var(--mt-blue)] text-xl font-bold"
                                onClick={() => {
                                    const base = price === "" ? Number(live?.bid ?? 0) : price;
                                    const value = Math.max(0, base - STEP);
                                    setPrice(Number(value.toFixed(5)));
                                }}
                            >
                                −
                            </button>

                            {/* Input */}
                            <input
                                type="number"
                                value={price === "" ? "" : price}
                                min="0"
                                step="0.00001"
                                onChange={(e) => {
                                    const val = e.target.value;

                                    if (val === "") {
                                        setPrice("");
                                        return;
                                    }

                                    const num = Number(val);
                                    if (!isNaN(num) && num >= 0) {
                                        setPrice(num);
                                    }
                                }}
                                placeholder="Price"
                                className="flex-1 bg-transparent  border-b border-gray-700 text-center text-[var(--text-main)] outline-none text-xl"
                            />

                            {/* Plus */}
                            <button
                                className="text-[var(--mt-blue)] text-xl font-bold"
                                onClick={() => {
                                    const base = price === "" ? Number(live?.ask ?? 0) : price;
                                    const value = base + STEP;
                                    setPrice(Number(value.toFixed(5)));
                                }}
                            >
                                +
                            </button>

                        </div>

                    </div>
                )}

                {/* SL / TP INPUTS */}
                <div className="flex justify-around items-center px-6 pb-3 text-[var(--text-main)]">

                    {/* SL */}
                    <div className="relative flex items-center gap-3 border-b border-[var(--warning)] pb-1">
                        <span className="absolute bottom-0 left-0 h-[20%] w-[1px] bg-[var(--warning)]"></span>
                        <span className="absolute bottom-0 right-0 h-[20%] w-[1px] bg-[var(--warning)]"></span>

                        <button
                            className="text-[var(--mt-blue)] text-xl font-bold"
                            onClick={() => {
                                const value =
                                    sl === ""
                                        ? Number(live?.bid ?? 0) - STEP
                                        : sl - STEP;

                                setSl(Number(value.toFixed(5)));
                            }}

                        >
                            −
                        </button>

                        <input
                            type="number"
                            value={sl === "" ? "" : sl}
                            min="0"
                            step="0.00001"
                            onChange={(e) => {
                                const val = e.target.value;

                                if (val === "") {
                                    setSl("");
                                    return;
                                }

                                const num = Number(val);
                                if (!isNaN(num) && num >= 0) {
                                    setSl(num);
                                }
                            }}
                            placeholder="SL"
                            className="w-24 bg-transparent text-center text-[var(--text-main)] outline-none text-lg"
                        />

                        <button
                            className="text-[var(--mt-blue)] text-xl font-bold"
                            onClick={() => {
                                const value =
                                    sl === ""
                                        ? Number(live?.bid ?? 0) + STEP
                                        : sl + STEP;

                                setSl(Number(value.toFixed(5)));
                            }}

                        >
                            +
                        </button>

                    </div>

                    {/* TP */}
                    <div className="relative flex items-center gap-3 border-b border-[var(--success)] pb-1">
                        <span className="absolute bottom-0 left-0 h-[20%] w-[1px] bg-[var(--success)]"></span>
                        <span className="absolute bottom-0 right-0 h-[20%] w-[1px] bg-[var(--success)]"></span>

                        <button
                            className="text-[var(--mt-blue)] text-xl font-bold"
                            onClick={() => {
                                const value =
                                    tp === ""
                                        ? Number(live?.bid ?? 0) - STEP
                                        : tp - STEP;

                                setTp(Number(value.toFixed(5)));
                            }}
                        >
                            −
                        </button>

                        <input
                            type="number"
                            value={tp}
                            min="0"
                            step="0.00001"
                            onChange={(e) => {
                                const val = e.target.value;

                                if (val === "") {
                                    setTp("");
                                    return;
                                }

                                const num = Number(val);
                                if (!isNaN(num) && num >= 0) {
                                    setTp(num);
                                }
                            }}

                            placeholder="TP"
                            className="w-24 bg-transparent text-center text-[var(--text-main)] outline-none text-lg"
                        />

                        <button
                            className="text-[var(--mt-blue)] text-xl font-bold"
                            onClick={() => {
                                const value =
                                    tp === ""
                                        ? Number(live?.bid ?? 0) + STEP
                                        : tp + STEP;

                                setTp(Number(value.toFixed(5)));
                            }}

                        >
                            +
                        </button>

                    </div>

                </div>

                {isPendingMode && (
                    <div className="relative px-3 py-3 border-t border-gray-800">

                        {/* Selector Row */}
                        <div
                            onClick={() => setOpenExpiration((v) => !v)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <span className="text-gray-400 text-sm">
                                Expiration
                            </span>

                            <span className="text-[var(--text-main)] text-sm">
                                {expiration === "SPECIFIED" && specifiedDate
                                    ? formatDateTime(specifiedDate)
                                    : expiration}
                            </span>

                            <span className="absolute right-0 top-4 text-xl text-gray-500">
                                ▾
                            </span>
                        </div>

                        {/* Dropdown */}
                        {openExpiration && (
                            <div className="absolute left-0 right-0 mt-2 top-full bg-[var(--bg-plan)] border border-gray-700 z-50">

                                {expirationOptions.map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => {
                                            setOpenExpiration(false);

                                            if (opt === "SPECIFIED") {
                                                setExpiration("SPECIFIED");
                                                setOpenSpecifiedModal(true);
                                            } else {
                                                setExpiration(opt);
                                                setSpecifiedDate(null);
                                            }

                                        }}

                                        className="text-right px-6 py-3 text-sm text-[var(--text-main)] hover:bg-gray-800 cursor-pointer transition"
                                    >
                                        {opt}
                                    </div>
                                ))}

                            </div>
                        )}

                    </div>
                )}



                <Suspense>
                    <LiveChart 
                        key={symbol}
                        bid={live?.bid ? Number(live.bid) : Number.NaN}
                        ask={live?.ask ? Number(live.ask) : Number.NaN}
                        sl={sl === "" ? undefined : Number(sl)}
                        tp={tp === "" ? undefined : Number(tp)}
                        pendingPrice={price === "" ? undefined : Number(price)}
                        height={isPendingMode ? 220 : 280}
                        gridCount={isPendingMode ? 5 : 7}
                    />
                </Suspense>


                {!isPendingMode && (
                    <div className="text-center text-xs text-gray-400 py-2 px-6">
                        Attention! The trade will be executed at market conditions,
                        difference with requested price may be significant!
                    </div>
                )}


                <div className="fixed md:absolute left-0 right-0 z-40 border-t border-gray-800 bg-[var(--bg-plan)] bottom-[calc(64px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] md:bottom-22 md:pb-0">
                    {orderType === "MARKET EXECUTION" ? (
                        <div className="grid grid-cols-2">
                            <button
                                disabled={processingSide !== null}
                                className="text-red-500 py-4 text-xl font-bold border-r border-gray-800 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                onClick={() => handleMarketOrder("SELL")}
                            >
                                {processingSide === "SELL" ? "PROCESSING..." : "SELL"}
                                <div className="text-xs font-normal">BY MARKET</div>
                            </button>



                            <button
                                disabled={processingSide !== null}
                                className="text-[var(--mt-blue)] py-4 text-xl font-bold hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                                onClick={() => handleMarketOrder("BUY")}
                            >
                                {processingSide === "BUY" ? "PROCESSING..." : "BUY"}
                                <div className="text-xs font-normal">BY MARKET</div>
                            </button>


                        </div>
                    ) : (
                        <button
                            disabled={pendingMutation.isPending}
                            className="w-full py-4 text-xl font-bold text-[var(--text-main)] hover:bg-white/10 transition-colors disabled:opacity-50"
                            onClick={handlePendingOrder}
                        >
                            {pendingMutation.isPending ? "PROCESSING..." : "PLACE"}
                        </button>

                    )}

                </div>

            </div>
            {openSpecifiedModal && (
                <div
                    className="
      fixed inset-0 z-[999]
      flex items-center justify-center
      bg-[var(--bg-main)]/70
      backdrop-blur-md
      animate-fadeIn
    "
                >
                    <div
                        className="
        w-[92%] max-w-md
        rounded-2xl
        bg-[var(--bg-plan)]
        border border-[var(--border-soft)]
        shadow-2xl
        p-6
        animate-slideUp
      "
                    >
                        {/* Header */}
                        <div className="text-center text-xl font-semibold text-[var(--text-main)] mb-6">
                            Expiration
                        </div>

                        {/* Date + Time */}
                        <div className="space-y-6">

                            <div>
                                <label className="block text-xs text-[var(--text-main)] mb-2 uppercase tracking-wide">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className="
              w-full
              bg-[var(--bg-main)]
              border border-[var(--border-soft)]
              rounded-lg
              px-3 py-2
              text-[var(--text-main)]
              outline-none
              focus:border-[var(--primary)]
              transition
            "
                                    onChange={(e) => {
                                        const current = specifiedDate || new Date();
                                        const [y, m, d] = e.target.value.split("-");
                                        const newDate = new Date(current);
                                        newDate.setFullYear(Number(y));
                                        newDate.setMonth(Number(m) - 1);
                                        newDate.setDate(Number(d));
                                        setSpecifiedDate(newDate);
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-[var(--text-main)] mb-2 uppercase tracking-wide">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    step="60"
                                    className="
              w-full
              bg-[var(--bg-main)]
              border border-[var(--border-soft)]
              rounded-lg
              px-3 py-2
              text-[var(--text-main)]
              outline-none
              focus:border-[var(--primary)]
              transition
            "
                                    onChange={(e) => {
                                        const current = specifiedDate || new Date();
                                        const [h, min] = e.target.value.split(":");
                                        const newDate = new Date(current);
                                        newDate.setHours(Number(h));
                                        newDate.setMinutes(Number(min));
                                        setSpecifiedDate(newDate);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-[var(--border-soft)]">

                            <button
                                className="
            px-4 py-2
            text-[var(--text-main)]
            hover:text-[var(--text-main)]
            transition
          "
                                onClick={() => setOpenSpecifiedModal(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="
            px-6 py-2
            rounded-lg
            bg-[var(--primary)]
            text-[var(--text-invert)]
            hover:bg-[var(--primary-hover)]
            transition
            disabled:opacity-50
          "
                                onClick={() => {
                                    if (!specifiedDate) return;
                                    setExpiration("SPECIFIED");
                                    setOpenSpecifiedModal(false);
                                }}
                            >
                                OK
                            </button>

                        </div>
                    </div>
                </div>
            )}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                />
            )}

            {orderResult && (
                <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center justify-center text-[var(--text-main)]">

                    {/* Circle Icon */}
                    <div
                        className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 ${orderResult.status === "loading"
                            ? "bg-[var(--mt-blue)]"
                            : orderResult.status === "success"
                                ? "bg-[var(--success)]"
                                : "bg-[var(--mt-red)]"
                            }`}
                    >

                        {orderResult?.status === "loading" && (
                            <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center pt-[8vh] text-[var(--text-main)]">
                                {/* ICON CIRCLE */}
                                <div className="relative w-22 h-22 mb-8">
                                    {/* Blue background */}
                                    <div className="absolute inset-0 rounded-full bg-[var(--mt-blue)] flex items-center justify-center">
                                        {/* File icon */}
                                        <FilePlus size={44} className="text-var[var(--text-main)]" />
                                    </div>

                                    {/* Circular loader */}
                                    <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                                </div>

                                {/* TITLE */}
                                <div className="text-xl font-semibold mb-4 text-center">
                                    Order has been placed in queue...
                                </div>

                                {/* SIDE + TYPE */}
                                <div className="text-lg font-semibold mb-1">
                                    <span
                                        className={
                                            orderResult.side === "SELL"
                                                ? "text-[var(--mt-red)]"
                                                : "text-[var(--mt-blue)]"
                                        }
                                    >
                                        {orderResult.side}
                                    </span>{" "}
                                    {orderResult.orderType}
                                </div>

                                {/* LOT SIZE */}
                                <div className="text-gray-400 text-sm mb-1">
                                    {orderResult.volume} / {orderResult.volume}
                                </div>

                                {/* SYMBOL + MODE */}
                                <div className="text-gray-400 text-sm">
                                    {orderResult.symbol}{" "}
                                    {orderResult.price
                                        ? `at ${orderResult.price}`
                                        : "by market"}
                                </div>

                            </div>
                        )}


                        {orderResult?.status === "success" && (
                            <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center pt-[12vh] text-[var(--text-main)]">

                                {/* ICON CIRCLE */}
                                <div className="relative w-22 h-22 mb-8">
                                    <div className="absolute inset-0 rounded-full bg-[var(--success)] flex items-center justify-center">
                                        <FilePlus size={34} className="text-[var(--text-main)]" />
                                    </div>
                                </div>

                                {/* TITLE */}
                                <div className="text-3xl font-bold mb-4 text-center">
                                    Done
                                </div>

                                {/* SIDE + LOT */}
                                <div className="text-lg font-semibold mb-1">
                                    <span
                                        className={
                                            orderResult.side === "SELL"
                                                ? "text-[var(--mt-red)]"
                                                : "text-[var(--mt-blue)]"
                                        }
                                    >
                                        {orderResult.side}
                                    </span>{" "}
                                    {orderResult.volume} / {orderResult.volume}
                                </div>

                                {/* SYMBOL + PRICE */}
                                <div className="text-gray-400 text-lg mb-1">
                                    {orderResult.symbol}{" "}
                                    {orderResult.price !== undefined
                                        ? `at ${orderResult.price}`
                                        : "by market"}
                                </div>

                                {/* OPTIONAL TICKET (agar API se aaye toh) */}
                                {orderResult.message && (
                                    <div className="text-gray-400 text-lg">
                                        #{orderResult.message}
                                    </div>
                                )}

                            </div>
                        )}


                        {orderResult?.status === "error" && (
                            <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center pt-[12vh] text-[var(--text-main)]">

                                {/* ICON CIRCLE */}
                                <div className="relative w-22 h-22 mb-8">
                                    <div className="absolute inset-0 rounded-full bg-[var(--mt-red)] flex items-center justify-center">
                                        <FileX size={34} className="text-white" />
                                    </div>
                                </div>

                                {/* TITLE */}
                                <div className="text-3xl font-bold mb-4 text-center">
                                    Order Failed
                                </div>

                                {/* SIDE + TYPE */}
                                {(orderResult.side || orderResult.orderType) && (
                                    <div className="text-lg font-semibold mb-1">
                                        {orderResult.side && (
                                            <span
                                                className={
                                                    orderResult.side === "SELL"
                                                        ? "text-[var(--mt-red)]"
                                                        : "text-[var(--mt-blue)]"
                                                }
                                            >
                                                {orderResult.side}
                                            </span>
                                        )}{" "}
                                        {orderResult.orderType}
                                    </div>
                                )}

                                {/* SYMBOL + PRICE */}
                                {orderResult.symbol && (
                                    <div className="text-gray-400 text-lg mb-1">
                                        {orderResult.symbol}{" "}
                                        {orderResult.price !== undefined
                                            ? `at ${orderResult.price}`
                                            : "by market"}
                                    </div>
                                )}

                                {/* ERROR MESSAGE */}
                                <div className="text-[var(--mt-red)] text-lg mt-2 text-center max-w-md px-6">
                                    {orderResult.message || "Something went wrong"}
                                </div>

                            </div>
                        )}

                    </div>

                    {/* Title */}
                    <div className="text-3xl font-bold mb-4">
                        {orderResult.status === "loading" && "Order has been placed in queue..."}
                        {orderResult.status === "success" && "Done"}
                        {orderResult.status === "error" && (orderResult.message || "Market closed")}
                    </div>

                    {/* Sub text */}
                    {orderResult.side && (
                        <div className="text-lg text-gray-400">
                            {orderResult.side}
                        </div>
                    )}

                </div>
            )}

        </>
    );
}

function getSymbolName(sym: string) {
    const map: Record<string, string> = {
        EURUSD: "Euro vs US Dollar",
        GBPUSD: "Pound Sterling vs US Dollar",
        USDJPY: "US Dollar vs Yen",
    };
    return map[sym] || sym;
}
