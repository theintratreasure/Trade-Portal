"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { ArrowDownUp, Calendar, DollarSign } from "lucide-react";
import { useRef, useEffect } from "react";
import TopBarSlot from "../components/layout/TopBarSlot";
import TradeTopBar from "../components/layout/TradeTopBar";
import { useTradeSummary } from "@/hooks/history/useTradeSummary";
import { useTradePositions } from "@/hooks/history/useTradePositions";
import { useTradeOrders } from "@/hooks/history/useTradeOrders";
import { useTradeDeals } from "@/hooks/history/useTradeDeals";
import HistoryActionSheet from "../components/history/HistoryActionSheet";
import { useLongPress } from "@/lib/useLongPress";
import type { HistoryFilterType } from "@/services/trade.service";


/* ================= TYPES ================= */

type TabType = "positions" | "orders" | "deals";
type SideFilter = "ALL" | "BUY" | "SELL";

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

/* ================= TABS ================= */
const LongPressRow = ({
  children,
  onLongPress,
}: {
  children: React.ReactNode;
  onLongPress: () => void;
}) => {
  const longPress = useLongPress(onLongPress);

  return (
    <div
      {...longPress}
      onContextMenu={(e) => e.preventDefault()}
      className="select-none"
    >
      {children}
    </div>
  );
};

const HistoryTabs = memo(
  ({
    activeTab,
    onChange,
  }: {
    activeTab: TabType;
    onChange: (t: TabType) => void;
  }) => (
    <div className="flex border-b border-white/10 mb-3 overflow-hidden relative">
      {(["positions", "orders", "deals"] as TabType[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 py-3 text-center font-semibold uppercase text-[12px] relative
            transition-all duration-300 ease-in-out
            ${activeTab === tab
              ? "text-[var(--mt-blue)] z-10"
              : "text-[var(--text-muted)]"
            }`}
        >
          {tab}
        </button>
      ))}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-[var(--mt-blue)] transition-all duration-300 ease-in-out w-1/3"
        style={{
          transform: `translateX(${(["positions", "orders", "deals"] as TabType[]).indexOf(activeTab) * 100}%)`
        }}
      />
    </div>
  )
);


/* ================= SUMMARY (ORDERS ONLY) ================= */

const OrdersSummary = memo(
  ({ summary }: { summary: { label: string; value: string }[] }) => (
    <div className="space-y-[6px] mb-3">
      {summary.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="font-semibold whitespace-nowrap">
            {row.label}:
          </span>

          <span
            className="flex-1 h-[6px] translate-y-[5px] mx-1"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(156,163,175,0.35) .5px, transparent 1.6px)",
              backgroundSize: "8px 6px",
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
  )
);




export default function TradeHistory() {
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSymbolLabel, setSelectedSymbolLabel] = useState<string | null>(null);
  const [symbolsCache, setSymbolsCache] = useState<{ key: string; label: string }[]>([]);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [sideOpen, setSideOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<HistoryFilterType>("all");
  const [dateOpen, setDateOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const prefetchingSymbolsRef = useRef(false);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };
  const onTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const historyFilters = useMemo(() => {
    const isCustomRangeReady = dateFilter !== "custom" || (fromDate && toDate);
    const normalizedSymbol = selectedSymbolLabel
      ? selectedSymbolLabel.trim().toUpperCase()
      : null;
    return {
      symbol: normalizedSymbol,
      side: sideFilter === "ALL" ? null : sideFilter,
      filter: isCustomRangeReady && dateFilter !== "all" ? dateFilter : null,
      from: dateFilter === "custom" ? fromDate || null : null,
      to: dateFilter === "custom" ? toDate || null : null,
    };
  }, [dateFilter, fromDate, selectedSymbolLabel, sideFilter, toDate]);

  const { data: summary } = useTradeSummary();
  const {
    data: positionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTradePositions(historyFilters);


  const {
    data: ordersPages,
    fetchNextPage: fetchNextOrders,
    hasNextPage: hasNextOrders,
    isFetchingNextPage: isFetchingOrders,
  } = useTradeOrders(historyFilters);

  const {
    data: dealsPages,
    fetchNextPage: fetchNextDeals,
    hasNextPage: hasNextDeals,
    isFetchingNextPage: isFetchingDeals,
  } = useTradeDeals(historyFilters);




  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        if (activeTab === "positions" && hasNextPage) {
          fetchNextPage();
        }

        if (activeTab === "orders" && hasNextOrders) {
          fetchNextOrders();
        }

        if (activeTab === "deals" && hasNextDeals) {
          fetchNextDeals();
        }
      },
      { threshold: 1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    activeTab,
    hasNextPage,
    hasNextOrders,
    hasNextDeals,
    fetchNextPage,
    fetchNextOrders,
    fetchNextDeals,
  ]);


  const rawOrders =
    ordersPages?.pages.flatMap((p) => p.orders) || [];

  const rawPositions =
    positionsData?.pages.flatMap((p) => p.positions) || [];

  const rawDeals =
    dealsPages?.pages.flatMap((p) => p.deals) || [];

  const resolveSymbol = useCallback((item: any) => {
    if (!item) return "";
    const candidates = [
      item.symbol,
      item.symbolName,
      item.pair,
      item.instrument,
      item.product,
      item.ticker,
      item.asset,
      item.code,
      item?.symbol?.name,
      item?.symbol?.symbol,
      item?.symbol?.code,
      item?.instrument?.symbol,
      item?.instrument?.code,
    ];
    const found = candidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    );
    return found ?? "";
  }, []);

  const toSymbolKey = useCallback((value: unknown) => {
    return String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }, []);

  const selectedSymbolNormalized = toSymbolKey(selectedSymbolLabel ?? "");

  const allPositions = useMemo(() => {
    return rawPositions;
  }, [rawPositions]);

  const allOrders = useMemo(() => {
    return rawOrders;
  }, [rawOrders]);

  const allDeals = useMemo(() => {
    return rawDeals;
  }, [rawDeals]);

  const allSymbols = useMemo(() => {
    const map = new Map<string, string>();

    const addSymbol = (item: any) => {
      const label = String(resolveSymbol(item) ?? "").trim();
      const key = toSymbolKey(label);
      if (!key || map.has(key)) return;
      map.set(key, label.toUpperCase());
    };

    rawOrders.forEach(addSymbol);
    rawPositions.forEach(addSymbol);
    rawDeals.forEach(addSymbol);

    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [
    rawOrders,
    rawPositions,
    rawDeals,
    resolveSymbol,
    toSymbolKey,
  ]);

  useEffect(() => {
    if (allSymbols.length === 0) return;
    setSymbolsCache((prev) => {
      const merged = new Map<string, string>(prev.map((s) => [s.key, s.label]));
      for (const s of allSymbols) merged.set(s.key, s.label);
      const next = Array.from(merged.entries()).map(([key, label]) => ({ key, label }));

      if (prev.length === next.length) {
        let same = true;
        for (let i = 0; i < prev.length; i += 1) {
          if (prev[i]?.key !== next[i]?.key || prev[i]?.label !== next[i]?.label) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }

      return next;
    });
  }, [allSymbols]);

  const symbolsForDropdown = symbolsCache.length > 0 ? symbolsCache : allSymbols;

  useEffect(() => {
    if (!symbolOpen || selectedSymbolLabel) return;
    if (prefetchingSymbolsRef.current) return;

    prefetchingSymbolsRef.current = true;

    (async () => {
      try {
        if (hasNextOrders) await fetchNextOrders();
        if (hasNextPage) await fetchNextPage();
        if (hasNextDeals) await fetchNextDeals();
      } finally {
        prefetchingSymbolsRef.current = false;
      }
    })();
  }, [
    symbolOpen,
    selectedSymbolLabel,
    hasNextOrders,
    hasNextPage,
    hasNextDeals,
    fetchNextOrders,
    fetchNextPage,
    fetchNextDeals,
  ]);

  const positionSummary = summary
    ? [
      { label: "Profit", value: summary.totalPnL.toFixed(2), raw: summary.totalPnL },
      { label: "Deposit", value: summary.totalDeposit.toFixed(2) },
      { label: "Swap", value: summary.totalSwap.toFixed(2) },
      { label: "Commission", value: summary.totalCommission.toFixed(2) },
      { label: "Balance", value: summary.balance.toFixed(2) },
    ]
    : [];

  const symbolOrderSummary = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalFilled = allOrders.filter((o: any) =>
      ["FILLED", "CLOSED"].includes(String(o.status).toUpperCase())
    ).length;
    const totalCancelled = allOrders.filter((o: any) =>
      ["CANCELLED", "CANCELED"].includes(String(o.status).toUpperCase())
    ).length;

    return { totalOrders, totalFilled, totalCancelled };
  }, [allOrders]);

  const symbolDropdownRef = useRef<HTMLDivElement | null>(null);
  const sideDropdownRef = useRef<HTMLDivElement | null>(null);
  const dateDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        symbolDropdownRef.current &&
        !symbolDropdownRef.current.contains(event.target as Node)
      ) {
        setSymbolOpen(false);
      }
      if (
        sideDropdownRef.current &&
        !sideDropdownRef.current.contains(event.target as Node)
      ) {
        setSideOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target as Node)
      ) {
        setDateOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () =>
      document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    setExpandedId(null);

    const container = document.querySelector("[data-history-scroll]");
    if (container) {
      container.scrollTop = 0;
    }
  }, [selectedSymbolLabel, sideFilter, dateFilter, fromDate, toDate, activeTab]);

  const dateFilterLabel = useMemo(() => {
    if (dateFilter === "all") return "All";
    if (dateFilter === "today") return "Today";
    if (dateFilter === "lastweek") return "Last Week";
    if (dateFilter === "last3month") return "Last 3M";
    return "Custom";
  }, [dateFilter]);

  const ordersGridTemplate =
    "minmax(96px,1fr) minmax(150px,1.4fr) minmax(100px,1fr) minmax(110px,1fr) minmax(80px,0.8fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(110px,1fr)";
  const positionsGridTemplate =
    "1fr 1.2fr 0.95fr 0.85fr 0.65fr 0.75fr 0.75fr 0.7fr 0.7fr 0.7fr 0.9fr";
  const dealsGridTemplate =
    "minmax(96px,1fr) minmax(150px,1.4fr) minmax(100px,1fr) minmax(120px,1fr) minmax(80px,0.8fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(90px,1fr)";


  return (
    <>
      {/* TOP BAR */}
      <TopBarSlot>
        <TradeTopBar
          title="History"
          subtitle={selectedSymbolLabel ? selectedSymbolLabel : "All symbols"}
          showMenu
          right={
            <div className="flex items-center gap-3">
              <div className="relative" ref={symbolDropdownRef}>
                <button
                  onClick={() => setSymbolOpen((prev) => !prev)}
                  className="flex items-center gap-1 font-semibold text-[13px] text-[var(--text-main)]"
                >
                  <DollarSign size={16} />
                 
                </button>

                {symbolOpen && (
                  <div className="absolute right-0 mt-2 w-28 bg-[var(--bg-plan)] md:bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md shadow-lg z-50 animate-dropdown max-h-72 overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedSymbolLabel(null);
                        setSymbolOpen(false);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-[var(--bg-glass)] text-[13px]"
                    >
                      ALL
                    </div>

                    {symbolsForDropdown.map((sym) => (
                      <div
                        key={sym.key}
                        onClick={() => {
                          setSelectedSymbolLabel(sym.label);
                          setSymbolOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-[var(--bg-glass)] text-[13px] ${selectedSymbolNormalized === sym.key
                          ? "text-[var(--mt-blue)] font-semibold"
                          : ""
                          }`}
                      >
                        {sym.label}
                      </div>

                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={sideDropdownRef}>
                <button
                  onClick={() => setSideOpen((prev) => !prev)}
                  className="flex items-center gap-1 font-semibold text-[13px] text-[var(--text-main)]"
                >
                  <ArrowDownUp size={16} />
                </button>
                {sideOpen && (
                  <div className="absolute right-0 mt-2 w-24 bg-[var(--bg-plan)] md:bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md shadow-lg z-50 animate-dropdown">
                    {(["ALL", "BUY", "SELL"] as SideFilter[]).map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setSideFilter(option);
                          setSideOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-[var(--bg-glass)] text-[13px] ${sideFilter === option ? "text-[var(--mt-blue)] font-semibold" : ""}`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={dateDropdownRef}>
                <button
                  onClick={() => setDateOpen((prev) => !prev)}
                  className="flex items-center gap-1 font-semibold text-[13px] text-[var(--text-main)]"
                >
                  <Calendar size={16} />
                </button>
                {dateOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-plan)] md:bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md shadow-lg z-50 animate-dropdown p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`px-2 py-1 text-xs rounded border border-[var(--border-soft)] ${dateFilter === "all" ? "text-[var(--mt-blue)]" : ""}`}
                        onClick={() => setDateFilter("all")}
                      >
                        All
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded border border-[var(--border-soft)] ${dateFilter === "today" ? "text-[var(--mt-blue)]" : ""}`}
                        onClick={() => setDateFilter("today")}
                      >
                        Today
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded border border-[var(--border-soft)] ${dateFilter === "lastweek" ? "text-[var(--mt-blue)]" : ""}`}
                        onClick={() => setDateFilter("lastweek")}
                      >
                        Last Week
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded border border-[var(--border-soft)] ${dateFilter === "last3month" ? "text-[var(--mt-blue)]" : ""}`}
                        onClick={() => setDateFilter("last3month")}
                      >
                        Last 3 Month
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded border border-[var(--border-soft)] ${dateFilter === "custom" ? "text-[var(--mt-blue)]" : ""}`}
                        onClick={() => setDateFilter("custom")}
                      >
                        Custom
                      </button>
                    </div>
                    {dateFilter === "custom" && (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded px-2 py-1 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          }
        />
      </TopBarSlot>

      {/* BODY */}
      <div data-history-scroll className="px-2 md:px-5 pt-1 text-[13px] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] h-[calc(100vh-60px)] overflow-y-auto pb-7 md:pb-10">
        {/* DEBUG PANEL */}

        <HistoryTabs activeTab={activeTab} onChange={onTabChange} />
        <div className="hidden md:flex items-center gap-3 mb-4 p-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-glass)]">
          <select
            value={selectedSymbolLabel ?? "ALL"}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSymbolLabel(value === "ALL" ? null : value);
            }}
            className="h-9 min-w-[150px] px-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] text-[13px]"
          >
            <option value="ALL">All Symbols</option>
            {symbolsForDropdown.map((sym) => (
              <option key={sym.key} value={sym.label}>
                {sym.label}
              </option>
            ))}
          </select>
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value as SideFilter)}
            className="h-9 min-w-[110px] px-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] text-[13px]"
          >
            <option value="ALL">ALL</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as HistoryFilterType)}
            className="h-9 min-w-[130px] px-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] text-[13px]"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="lastweek">Last Week</option>
            <option value="last3month">Last 3 Month</option>
            <option value="custom">Custom</option>
          </select>
          {dateFilter === "custom" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] text-[13px]"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] text-[13px]"
              />
            </>
          )}
          <button
            onClick={() => {
              setSelectedSymbolLabel(null);
              setSideFilter("ALL");
              setDateFilter("all");
              setFromDate("");
              setToDate("");
            }}
            className="h-9 px-3 rounded-md border border-[var(--border-soft)] hover:bg-[var(--bg-plan)] text-[13px]"
          >
            Reset
          </button>
        </div>

        <div className="transition-opacity duration-200">
          {activeTab === "orders" && (
            <>
              <div className="md:hidden">
              {/* SUMMARY */}
              {symbolOrderSummary && (
                <div className="space-y-[6px] mb-3">
                  <OrdersSummary
                    summary={[
                      {
                        label: "Filled",
                        value: symbolOrderSummary.totalFilled.toString(),
                      },
                      {
                        label: "Canceled",
                        value: symbolOrderSummary.totalCancelled.toString(),
                      },
                      {
                        label: "Total",
                        value: symbolOrderSummary.totalOrders.toString(),
                      },
                    ]}
                  />
                </div>
              )}

              {/* ORDERS LIST */}
              {allOrders.map((order: any) => {
                const isBuy = order.side === "BUY";

                return (
                  <LongPressRow
                    key={order.orderId}
                    onLongPress={() => {
                      setSelectedItem(order);
                      setShowSheet(true);
                    }}
                  >

                    <div
                      onClick={() => toggleExpand(order.orderId)}
                      className={`
    py-1 cursor-pointer active:bg-white/5 md:py-2 md:px-3 md:rounded-md md:bg-[var(--bg-plan)] md:mb-2
    ${expandedId !== order.orderId
                          ? "border-b border-[var(--border-grey)] md:border-[var(--border-soft)]"
                          : ""}
  `}>
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold text-[15px] mt-font">
                            {order.symbol},{" "}
                            <span
                              className={
                                isBuy
                                  ? "text-[var(--mt-blue)] font-medium"
                                  : "text-[var(--mt-red)] font-medium"
                              }
                            >
                              {isBuy ? "buy" : "sell"}
                            </span>
                          </div>

                          <div className="mt-price-line">
                            {order.qty.toFixed(2)} / {order.qty.toFixed(2)} at{" "}
                            {order.orderType.toLowerCase()}
                          </div>
                        </div>

                        <div className="text-right mt-price-line">
                          <div className="text-[12px]">
                            {formatDateTime24(order.openTime)}
                          </div>
                          <div className="mt-profit text-[13px]">
                            {order.status === "CLOSED" ? "FILLED" : order.status}
                          </div>

                        </div>
                      </div>
                    </div>

                    {expandedId === order.orderId && (
                      <div className="pb-3 text-[12px] mt-price-line border-b border-[var(--border-grey)] md:border-[var(--border-soft)] md:px-3 md:rounded-b-md md:bg-[var(--bg-plan)] space-y-1 animate-fadeIn grid grid-cols-1 ">

                        <div className="w-50">#{order.orderId.slice(0, 10)}</div>

                        <div className="flex justify-between w-50">
                          <span>S / L:</span>
                          <span>{order.stopLoss ?? "-"}</span>
                        </div>

                        <div className="flex justify-between w-50">
                          <span>T / P:</span>
                          <span>{order.takeProfit ?? "-"}</span>
                        </div>

                      </div>
                    )}
                  </LongPressRow>
                );
              })}
              </div>

              <div className="hidden md:block">
                <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                    <div className="font-semibold text-[14px]">Orders ({allOrders.length})</div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[980px] w-full">
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
                        <div className="text-right">STATUS</div>
                      </div>
                      {allOrders.length > 0 ? (
                        allOrders.map((order: any) => (
                          <div
                            key={order.orderId}
                            className="grid w-full px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center"
                            style={{ gridTemplateColumns: ordersGridTemplate }}
                          >
                            <div>{String(order.orderId ?? "-").slice(0, 10)}</div>
                            <div>{formatDateTime24(order.openTime)}</div>
                            <div className="font-semibold">{order.symbol ?? "-"}</div>
                            <div className={String(order.side).toUpperCase() === "BUY" ? "text-[var(--mt-blue)]" : "text-[var(--mt-red)]"}>
                              {order.orderType ?? "-"}
                            </div>
                            <div>{Number(order.qty ?? 0).toFixed(2)}</div>
                            <div>{Number(order.price ?? 0).toFixed(2)}</div>
                            <div>{order.stopLoss ?? "-"}</div>
                            <div>{order.takeProfit ?? "-"}</div>
                            <div className="text-right font-semibold text-[var(--text-muted)]">
                              {String(order.status ?? "").toUpperCase() === "CLOSED" ? "FILLED" : String(order.status ?? "-")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">No Orders Found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={loadMoreRef}
                className="h-10 flex items-center justify-center"
              >
                {isFetchingOrders && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Loading more...
                  </span>
                )}
              </div>
            </>
          )}


          {activeTab === "positions" && (

            <>
              <div className="md:hidden">

              {/* SUMMARY */}
              <div className="space-y-[6px] mb-3">

                {positionSummary.map((row) => (
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

                    <span
                      className={`font-semibold whitespace-nowrap ${row.label === "Profit"
                        ? row.raw >= 0
                          ? "text-[var(--mt-blue)]"
                          : "text-[var(--mt-red)]"
                        : ""
                        }`}
                    >
                      {row.value}
                    </span>

                  </div>
                ))}
              </div>
              {/* <div className="border-t border-b border-[var(--border-soft)] bg-[var(--bg-plan)]py-3 mt-3">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-[16px] mt-font">
                    Balance
                  </div>

                  <div className="text-right">
                    <div className="text-[12px] text-[var(--mt-grey)] mt-font">
                      {new Date().toLocaleString()}
                    </div>

                    <div className="mt-profit text-[15px] text-[var(--mt-blue)]">
                      {summary?.balance?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div> */}


              {/* POSITIONS LIST */}
              {allPositions.map((pos: any) => {
                return (
                  <LongPressRow
                    key={pos.orderId}
                    onLongPress={() => {
                      setSelectedItem(pos);
                      setShowSheet(true);
                    }}
                  >
                    {/* MAIN ROW */}
                    <div
                      onClick={() => toggleExpand(pos.orderId)}
                      className={`
    py-1 cursor-pointer active:bg-white/5 md:py-2 md:px-3 md:rounded-md md:bg-[var(--bg-plan)] md:mb-2
    ${expandedId !== pos.orderId
                          ? "border-b border-[var(--border-grey)] md:border-[var(--border-soft)]"
                          : ""}
  `}
                    >

                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold text-[15px] mt-font">
                            {pos.symbol},{" "}
                            <span
                              className={` ${pos.side === "BUY"
                                ? "text-[var(--mt-blue)] font-medium"
                                : "text-[var(--mt-red)] font-medium"
                                } `}
                            >
                              {pos.side.toLowerCase()} {pos.qty.toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-price-line">
                            {pos.openPrice}{" "}
                            {pos.closePrice ? `→ ${pos.closePrice}` : ""}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[12px] mt-price-line">
                            {formatDateTime24(pos.openTime)}
                          </div>

                          <div
                            className={`mt-profit ${pos.profitLoss > 0
                              ? "text-[var(--mt-blue)]"
                              : pos.profitLoss < 0
                                ? "text-[var(--mt-red)]"
                                : ""
                              }`}
                          >
                            {pos.profitLoss !== 0
                              ? Math.abs(pos.profitLoss).toFixed(2)
                              : ""}
                          </div>

                        </div>
                      </div>
                    </div>


                    {/* EXPANDED DETAILS */}
                    {expandedId === pos.orderId && (
                      <div className="pb-3 border-b border-[var(--border-grey)] md:border-[var(--border-soft)] md:px-3 md:rounded-b-md md:bg-[var(--bg-plan)] animate-fadeIn">
                        <div className="text-[12px] mt-price-line mt-font space-y-1 grid grid-cols-2">

                          <div className="mr-2">#{pos.orderId.slice(0, 10)}</div>

                          <div className="flex justify-between mr-2">
                            <span>{pos.status}</span>
                            <span>{pos.openPrice}</span>
                          </div>

                          <div className="flex justify-between mr-2">
                            <span>S/L:</span>
                            <span>{pos.stopLoss ?? "-"}</span>
                          </div>

                          <div className="flex justify-between mr-2">
                            <span>Swap:</span>
                            <span>{pos.swap.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between mr-2">
                            <span>T/P:</span>
                            <span>{pos.takeProfit ?? "-"}</span>
                          </div>

                          <div className="flex justify-between mr-2">
                            <span>Commission:</span>
                            <span>{pos.commission.toFixed(2)}</span>
                          </div>

                        </div>
                      </div>
                    )}

                  </LongPressRow>
                );
              })}
              </div>

              <div className="hidden md:block">
                <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                    <div className="font-semibold text-[14px]">Positions ({allPositions.length})</div>
                  </div>
                  <div className="w-full overflow-x-hidden">
                    <div className="w-full">
                      <div
                        className="grid w-full px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-soft)]"
                        style={{ gridTemplateColumns: positionsGridTemplate }}
                      >
                        <div>ID</div>
                        <div>TIME</div>
                        <div>SYMBOL</div>
                        <div>ORDER</div>
                        <div>LOT</div>
                        <div>OPEN</div>
                        <div>CLOSE</div>
                        <div>SL</div>
                        <div>TP</div>
                        <div>SWAP</div>
                        <div className="text-right">PROFIT</div>
                      </div>
                      {allPositions.length > 0 ? (
                        allPositions.map((pos: any) => (
                          <div
                            key={pos.orderId}
                            className="grid w-full px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center"
                            style={{ gridTemplateColumns: positionsGridTemplate }}
                          >
                            <div className="truncate">{String(pos.orderId ?? "-").slice(0, 10)}</div>
                            <div className="truncate">{formatDateTime24(pos.openTime)}</div>
                            <div className="font-semibold truncate">{pos.symbol ?? "-"}</div>
                            <div className={String(pos.side).toUpperCase() === "BUY" ? "text-[var(--mt-blue)]" : "text-[var(--mt-red)]"}>
                              {String(pos.side ?? "-").toUpperCase()}
                            </div>
                            <div>{Number(pos.qty ?? 0).toFixed(2)}</div>
                            <div>{Number(pos.openPrice ?? 0).toFixed(2)}</div>
                            <div>{pos.closePrice != null ? Number(pos.closePrice).toFixed(2) : "-"}</div>
                            <div>{pos.stopLoss ?? "-"}</div>
                            <div>{pos.takeProfit ?? "-"}</div>
                            <div>{Number(pos.swap ?? 0).toFixed(2)}</div>
                            <div
                              className={`text-right font-semibold ${Number(pos.profitLoss ?? 0) > 0
                                ? "text-[var(--mt-blue)]"
                                : Number(pos.profitLoss ?? 0) < 0
                                ? "text-[var(--mt-red)]"
                                : "text-[var(--text-muted)]"
                                }`}
                            >
                              {Number(pos.profitLoss ?? 0).toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">No Positions Found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>


              {/* LOAD MORE TRIGGER */}
              <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                {isFetchingNextPage && (
                  <span className="text-[var(--text-muted)] text-xs">
                    Loading more...
                  </span>
                )}
              </div>
            </>
          )}

          {activeTab === "deals" && (
            <>
              <div className="md:hidden">
              {/* SUMMARY */}
              <div className="space-y-[6px] mb-3">
                {positionSummary.map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="font-semibold whitespace-nowrap">
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

                    <span
                      className={`font-semibold whitespace-nowrap ${row.label === "Profit"
                        ? row.raw >= 0
                          ? "text-[var(--mt-blue)]"
                          : "text-[var(--mt-red)]"
                        : ""
                        }`}
                    >
                      {row.value}
                    </span>

                  </div>
                ))}
              </div>



              {/* DEALS LIST */}
              {allDeals.map((deal: any) => {
                const isBuy = deal.type.includes("BUY");
                const pnlColor =
                  deal.pnl < 0
                    ? "text-[var(--mt-red)]"
                    : "text-[var(--mt-blue)]";

                return (
                  <LongPressRow
                    key={deal.tradeId + deal.date}
                    onLongPress={() => {
                      setSelectedItem(deal);
                      setShowSheet(true);
                    }}
                  >
                    <div
                      onClick={() => toggleExpand(deal.tradeId + deal.date)}
                      className={`
    py-1 cursor-pointer active:bg-white/5 md:py-2 md:px-3 md:rounded-md md:bg-[var(--bg-plan)] md:mb-2
    ${expandedId !== deal.tradeId + deal.date
                          ? "border-b border-[var(--border-grey)] md:border-[var(--border-soft)]"
                          : ""}
  `}
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold text-[15px] mt-font">
                            {deal.symbol},{" "}
                            <span
                              className={
                                deal.type.includes("BUY")
                                  ? "text-[var(--mt-blue)] font-medium"
                                  : "text-[var(--mt-red)] font-medium"
                              }
                            >
                              {deal.type
                                .toLowerCase()
                                .replace("_", ", ")}
                            </span>

                          </div>

                          <div className="mt-price-line">
                            {deal.volume} at {deal.price}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[12px] mt-price-line">
                            {formatDateTime24(deal.date)}
                          </div>

                          {deal.pnl !== 0 && (
                            <div
                              className={`mt-profit ${deal.pnl > 0
                                ? "text-[var(--mt-blue)]  font-medium"
                                : deal.pnl < 0
                                  ? "text-[var(--mt-red)] font-medium"
                                  : ""
                                }`}
                            >
                              {deal.pnl !== 0
                                ? Math.abs(deal.pnl).toFixed(2)
                                : ""}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {expandedId === deal.tradeId + deal.date && (
                      <div className=" pb-3 text-[12px] mt-price-line space-y-1 animate-fadeIn grid grid-cols-2 border-b border-[var(--border-grey)] md:border-[var(--border-soft)] md:px-3 md:rounded-b-md md:bg-[var(--bg-plan)]">

                        <div className="flex justify-between mr-2">
                          <span>Deal:</span>
                          <span>{deal.tradeId.slice(0, 10)}</span>
                        </div>
                        <div className="flex justify-between mr-2">
                          <span>Swap:</span>
                          <span>{deal.swap.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between mr-2">
                          <span>Order:</span>
                          <span>{deal.tradeId.slice(0, 10)}</span>
                        </div>
                        <div className="flex justify-between mr-2">
                          <span>Charges:</span>
                          <span>{deal.commission.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between mr-2">
                          <span>Position:</span>
                          <span>{deal.tradeId.slice(0, 10)}</span>
                        </div>


                      </div>
                    )}
                  </LongPressRow>
                );
              })}
              </div>

              <div className="hidden md:block">
                <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-md overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-glass)]">
                    <div className="font-semibold text-[14px]">Deals ({allDeals.length})</div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[980px] w-full">
                      <div
                        className="grid w-full px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-soft)]"
                        style={{ gridTemplateColumns: dealsGridTemplate }}
                      >
                        <div>DEAL ID</div>
                        <div>TIME</div>
                        <div>SYMBOL</div>
                        <div>TYPE</div>
                        <div>LOT</div>
                        <div>PRICE</div>
                        <div>SWAP</div>
                        <div>CHARGES</div>
                        <div className="text-right">PNL</div>
                      </div>
                      {allDeals.length > 0 ? (
                        allDeals.map((deal: any) => (
                          <div
                            key={deal.tradeId + deal.date}
                            className="grid w-full px-4 py-2 text-[13px] border-b border-[var(--border-soft)] hover:bg-[var(--bg-glass)] transition items-center"
                            style={{ gridTemplateColumns: dealsGridTemplate }}
                          >
                            <div>{String(deal.tradeId ?? "-").slice(0, 10)}</div>
                            <div>{formatDateTime24(deal.date)}</div>
                            <div className="font-semibold">{deal.symbol ?? "-"}</div>
                            <div className={String(deal.type ?? "").includes("BUY") ? "text-[var(--mt-blue)]" : "text-[var(--mt-red)]"}>
                              {String(deal.type ?? "-").toLowerCase().replace("_", ", ")}
                            </div>
                            <div>{Number(deal.volume ?? 0).toFixed(2)}</div>
                            <div>{Number(deal.price ?? 0).toFixed(2)}</div>
                            <div>{Number(deal.swap ?? 0).toFixed(2)}</div>
                            <div>{Number(deal.commission ?? 0).toFixed(2)}</div>
                            <div
                              className={`text-right font-semibold ${Number(deal.pnl ?? 0) > 0
                                ? "text-[var(--mt-blue)]"
                                : Number(deal.pnl ?? 0) < 0
                                ? "text-[var(--mt-red)]"
                                : "text-[var(--text-muted)]"
                                }`}
                            >
                              {Number(deal.pnl ?? 0).toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">No Deals Found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={loadMoreRef}
                className="h-10 flex items-center justify-center"
              >
                {isFetchingDeals && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Loading more...
                  </span>
                )}
              </div>
            </>
          )}


        </div>
      </div>
      <HistoryActionSheet
        item={selectedItem}
        type={
          activeTab === "positions"
            ? "position"
            : activeTab === "orders"
              ? "order"
              : "deal"
        }
        open={showSheet}
        onClose={() => setShowSheet(false)}
      />


    </>
  );
}
