'use client';
import { useEffect, useRef, useState } from "react";

export default function LiveChart({
    bid,
    ask,
    sl,
    tp,
    pendingPrice,
    height = 280,
    gridCount = 9,
    priceScaleWidth = 70,
}: {
    bid: number;
    ask: number;
    sl?: number;
    tp?: number;
    pendingPrice?: number;
    height?: number;
    gridCount?: number;
    priceScaleWidth?: number;
}) {

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [bidTicks, setBidTicks] = useState<number[]>([]);
    const [askTicks, setAskTicks] = useState<number[]>([]);
    const [width, setWidth] = useState(400);

    const STEP = 6;
    const MAX_POINTS = 400;
    const ANCHOR_PERCENT = 0.65;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const resize = () => {
            const w = el.getBoundingClientRect().width - priceScaleWidth;
            if (w > 0) setWidth(w);
        };

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [priceScaleWidth]);

    useEffect(() => {
        // Ignore bootstrap/invalid values so chart scale never gets polluted by 0.
        if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return;

        setBidTicks((p) => [...p.slice(-MAX_POINTS + 1), bid]);
        setAskTicks((p) => [...p.slice(-MAX_POINTS + 1), ask]);
    }, [bid, ask]);

    const len = Math.min(bidTicks.length, askTicks.length);
    if (len < 2) {
        return (
            <div
                ref={containerRef}
                className="relative bg-[var(--bg-plan)]"
                style={{ height }}
            />
        );
    }

    const bids = bidTicks.slice(-len);
    const asks = askTicks.slice(-len);

    const overlays = [sl, tp, pendingPrice].filter(
        (value): value is number =>
            typeof value === "number" && Number.isFinite(value) && value > 0
    );

    const all = [...bids, ...asks, ...overlays];

    const rawMax = Math.max(...all);
    const rawMin = Math.min(...all);

    const padding = (rawMax - rawMin) * 0.25 || 0.0001;
    const max = rawMax + padding;
    const min = rawMin - padding;
    const range = max - min;

    const scaleY = (p: number) =>
        ((max - p) / range) * height;

    const totalWidth = (len - 1) * STEP;
    const anchorX = width * ANCHOR_PERCENT;
    const offset = totalWidth > anchorX ? totalWidth - anchorX : 0;

    const buildPath = (data: number[]) =>
        data
            .map((p, i) => {
                const x = i * STEP - offset;
                const y = scaleY(p);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

    const bidPath = buildPath(bids);
    const askPath = buildPath(asks);

    const currentBid = bids[len - 1];
    const currentAsk = asks[len - 1];

    const bidY = scaleY(currentBid);
    const askY = scaleY(currentAsk);
    const slValue = typeof sl === "number" && Number.isFinite(sl) && sl > 0 ? sl : undefined;
    const tpValue = typeof tp === "number" && Number.isFinite(tp) && tp > 0 ? tp : undefined;
    const pendingValue =
        typeof pendingPrice === "number" && Number.isFinite(pendingPrice) && pendingPrice > 0
            ? pendingPrice
            : undefined;

    const slY = slValue !== undefined ? scaleY(slValue) : null;
    const tpY = tpValue !== undefined ? scaleY(tpValue) : null;
    const pendingY = pendingValue !== undefined ? scaleY(pendingValue) : null;

    const levels = Array.from({ length: gridCount }, (_, i) => {
        const price = max - (range / (gridCount - 1)) * i;
        const y = (i / (gridCount - 1)) * height;
        return { price, y };
    });

    return (
        <div
            ref={containerRef}
            className="relative bg-[var(--bg-plan)] md:bg-[var(--bg-card)] overflow-hidden"
            style={{ height }}
        >
            {/* GRID */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {levels.map((l, i) => (
                    <line
                        key={i}
                        x1="0"
                        x2={width}
                        y1={l.y}
                        y2={l.y}
                        stroke="rgb(112, 111, 111)"
                        strokeDasharray="4 6"
                    />
                ))}
            </svg>

            {/* CHART */}
            <div
                className="absolute left-0 top-0 bottom-0 overflow-hidden"
                style={{ right: priceScaleWidth }}
            >
                <svg width={width} height={height}>
                    <path d={askPath} stroke="var(--mt-red)" strokeWidth="2" fill="none" />
                    <path d={bidPath} stroke="var(--mt-blue)" strokeWidth="2" fill="none" />

                    {slY !== null && (
                        <>
                            <line x1={0} x2={width} y1={slY} y2={slY} stroke="var(--warning)" strokeWidth="1.5" />
                            <text x={4} y={slY - 6} fill="var(--warning)" fontSize="11" fontWeight="600">SL</text>
                            <text x={width - 4} y={slY - 6} fill="var(--warning)" fontSize="11" fontWeight="600" textAnchor="end">
                                {slValue?.toFixed(3)}
                            </text>
                        </>
                    )}

                    {tpY !== null && (
                        <>
                            <line x1={0} x2={width} y1={tpY} y2={tpY} stroke="var(--success)" strokeWidth="1.5" />
                            <text x={4} y={tpY - 6} fill="var(--success)" fontSize="11" fontWeight="600">TP</text>
                            <text x={width - 4} y={tpY - 6} fill="var(--success)" fontSize="11" fontWeight="600" textAnchor="end">
                                {tpValue?.toFixed(3)}
                            </text>
                        </>
                    )}

                    {pendingY !== null && (
                        <>
                            <line x1={0} x2={width} y1={pendingY} y2={pendingY} stroke="#6b7280" strokeWidth="1.5" strokeDasharray="6 4" />
                            <text x={4} y={pendingY - 6} fill="#6b7280" fontSize="11" fontWeight="600">PRICE</text>
                            <text x={width - 4} y={pendingY - 6} fill="#6b7280" fontSize="11" fontWeight="600" textAnchor="end">
                                {pendingValue?.toFixed(3)}
                            </text>
                        </>
                    )}
                </svg>
            </div>

            {/* PRICE SCALE */}
            <div
                className="absolute right-0 top-0 h-full flex flex-col justify-between pr-2 text-xs text-gray-400"
                style={{ width: priceScaleWidth }}
            >
                {levels.map((l, i) => (
                    <div key={i}>{l.price.toFixed(3)}</div>
                ))}
            </div>

            {/* LIVE TAGS */}
            <div
                className="absolute right-0 mr-2 pr-1 py-1 text-xs rounded-l"
                style={{
                    top: askY - 10,
                    background: "var(--mt-red)",
                    color: "white",
                    width: priceScaleWidth,
                    textAlign: "right",
                }}
            >
                {currentAsk.toFixed(3)}
            </div>

            <div
                className="absolute right-0 mr-2 pr-1 py-1 text-xs rounded-l"
                style={{
                    top: bidY - 10,
                    background: "var(--mt-blue)",
                    color: "white",
                    width: priceScaleWidth,
                    textAlign: "right",
                }}
            >
                {currentBid.toFixed(3)}
            </div>

            {slY !== null && (
                <div
                    className="absolute right-0 mr-2 pr-1 py-1 text-xs rounded-l"
                    style={{
                        top: slY - 10,
                        background: "var(--warning)",
                        color: "white",
                        width: priceScaleWidth,
                        textAlign: "right",
                    }}
                >
                    {slValue?.toFixed(3)}
                </div>
            )}

            {tpY !== null && (
                <div
                    className="absolute right-0 mr-2 pr-1 py-1 text-xs rounded-l"
                    style={{
                        top: tpY - 10,
                        background: "var(--success)",
                        color: "white",
                        width: priceScaleWidth,
                        textAlign: "right",
                    }}
                >
                    {tpValue?.toFixed(3)}
                </div>
            )}

            {pendingY !== null && (
                <div
                    className="absolute right-0 mr-2 pr-1 py-1 text-xs rounded-l"
                    style={{
                        top: pendingY - 10,
                        background: "#6b7280",
                        color: "white",
                        width: priceScaleWidth,
                        textAlign: "right",
                    }}
                >
                    {pendingValue?.toFixed(3)}
                </div>
            )}
        </div>
    );
}
