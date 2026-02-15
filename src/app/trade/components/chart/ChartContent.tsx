"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { useSearchParams } from "next/navigation";
import TopBarSlot from "../layout/TopBarSlot";
import TradeTopBar from "../layout/TradeTopBar";
import TradeExecutionSheet from "./TradeExecutionSheet";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";

function normalizeSymbol(tvSymbol: string) {
  if (!tvSymbol) return "";
  // strip exchange prefix if present and uppercase
  if (tvSymbol.includes(":")) {
    return tvSymbol.split(":")[1].toUpperCase();
  }
  return tvSymbol.toUpperCase();
}

function resolveSymbol(s: string) {
  if (!s) return "FX:EURUSD";
  if (s.includes(":")) return s;
  // quick heuristic for crypto pairs vs FX
  if (s.endsWith("USDT") || s.endsWith("BTC") || s.endsWith("USDTP")) {
    return `BINANCE:${s}`;
  }
  return `FX:${s}`;
}

/* --- Small UI icons used in header --- */
function CSIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 70"
      xmlns="http://www.w3.org/2000/svg"
      className="cursor-pointer"
    >
      <path
        d="M5 10 H57 V22 H36 A8 8 0 0 0 28 30 V40 A8 8 0 0 0 36 48 H57 V60 H5 Z"
        fill="#d80000"
      />
      <rect x="40" y="28" width="38" height="16" rx="8" fill="#6b7280" />
      <path
        d="M115 10 H63 V22 H84 A8 8 0 0 1 92 30 V40 A8 8 0 0 1 84 48 H63 V60 H115 Z"
        fill="#0b71f3"
      />
    </svg>
  );
}

/* ----------------- Component ----------------- */
export default function ChartContent() {
  const uid = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetHostIdRef = useRef(`tradingview_chart_${uid.replace(/[:]/g, "_")}`);
  const bootedRef = useRef(false);
  const searchParams = useSearchParams();
  const paramSymbol = searchParams.get("symbol");

  // initial symbol: prefer URL param, else EURUSD
  const initial = paramSymbol ? normalizeSymbol(paramSymbol) : "EURUSD";

  const [currentSymbol, setCurrentSymbol] = useState<string>(initial); // what we tell widget initially
  const [displaySymbol, setDisplaySymbol] = useState<string>(initial); // what is actively shown (from iframe src polling)
  const [theme, setTheme] = useState<string>("dark");
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [tradeOpen, setTradeOpen] = useState<boolean>(false);

  const initialToken = getTradeTokenFromStorageSync();
  const [token] = useState<string>(initialToken);

  const quotes = useMarketQuotes(token);

  // derive trade bid/ask from market quotes using displaySymbol
  const tradeBid = quotes[displaySymbol]?.bid ? Number(quotes[displaySymbol].bid) : 0;
  const tradeAsk = quotes[displaySymbol]?.ask ? Number(quotes[displaySymbol].ask) : 0;

  // sync param -> state if user navigated with ?symbol=...
  useEffect(() => {
    if (paramSymbol) {
      const norm = normalizeSymbol(paramSymbol);
      queueMicrotask(() => {
        setCurrentSymbol(norm);
        // don't immediately overwrite displaySymbol; widget will load that symbol and we poll iframe to detect it.
        // but set displaySymbol so quotes are checked immediately
        setDisplaySymbol(norm);
      });
    }
  }, [paramSymbol]);

  // theme sync (keep your background/theme behavior unchanged)
 useEffect(() => {
  const updateTheme = () => {
    const stored = localStorage.getItem("theme") || "dark";
    setTheme(stored);
  };

  updateTheme();

  window.addEventListener("storage", updateTheme);
  window.addEventListener("themeChange", updateTheme);

  return () => {
    window.removeEventListener("storage", updateTheme);
    window.removeEventListener("themeChange", updateTheme);
  };
}, []);

  // screen resize
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 768);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // Load TradingView widget once (StrictMode-safe).
  useEffect(() => {
    if (bootedRef.current) return;
    if (!containerRef.current) return;
    bootedRef.current = true;
    const containerEl = containerRef.current;

    containerEl.innerHTML = "";
    const widgetHost = document.createElement("div");
    widgetHost.id = widgetHostIdRef.current;
    widgetHost.style.width = "100%";
    widgetHost.style.height = "100%";
    containerEl.appendChild(widgetHost);

   let chartBg = "#ffffff";
if (theme === "dark") {
  chartBg = isDesktop ? "#111827" : "#000000";
}


    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: resolveSymbol(currentSymbol),
      interval: "15",
      timezone: "Asia/Kolkata",
      theme: theme === "light" ? "light" : "dark",
      style: "1",
      locale: "en",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: widgetHostIdRef.current,
      studies: [],
      withdateranges: true,
      details: true,
      backgroundColor: chartBg,
      overrides: {
        "paneProperties.background": chartBg,
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": theme === "light" ? "#e5e7eb" : "#1f2937",
        "paneProperties.horzGridProperties.color": theme === "light" ? "#e5e7eb" : "#1f2937",
        "scalesProperties.textColor": theme === "light" ? "#111827" : "#d1d5db",
        "mainSeriesProperties.candleStyle.upColor": "#22c55e",
        "mainSeriesProperties.candleStyle.downColor": "#ef4444",
      },
    });

    containerEl.appendChild(script);

    return () => {
      // Don't teardown embed script on dev StrictMode passive cleanup.
    };
  }, [currentSymbol, theme, isDesktop]);

  // If you want programmatic symbol change (e.g., user selects a symbol from your UI),
  // call setCurrentSymbol("USDJPY") and the embed will be recreated with that symbol.

  const handleTradeButtonClick = useCallback(() => {
    if (displaySymbol && tradeBid > 0 && tradeAsk > 0) {
      setTradeOpen(true);
    }
  }, [displaySymbol, tradeBid, tradeAsk]);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-[var(--bg-plan)] md:bg-[var(--bg-card)] pb-30 md:pb-0">
      <TopBarSlot>
        <TradeTopBar
          title={`Chart - ${displaySymbol}`}
          showMenu
          right={
            <div className="flex items-center gap-3 pr-2">
              {/* <button className="w-9 h-9 flex items-center justify-center hover:opacity-80 transition">
                <GradientClock size={20} />
              </button> */}

              <button
                className="w-9 h-9 flex items-center justify-center hover:opacity-80 transition disabled:opacity-50"
                onClick={handleTradeButtonClick}
                disabled={!(displaySymbol && tradeBid > 0 && tradeAsk > 0)}
              >
                <CSIcon size={36} />
              </button>

              <TradeExecutionSheet
                open={tradeOpen}
                onClose={() => setTradeOpen(false)}
                symbol={displaySymbol}
                bid={tradeBid}
                ask={tradeAsk}
              />
            </div>
          }
        />
      </TopBarSlot>

      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
