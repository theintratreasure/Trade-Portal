import React from "react";

type PriceDirection = "up" | "down" | "same";

type Props = {
  live: {
    symbol: string;
    bid: string;
    ask: string;
    bidVolume: string;
    askVolume: string;
    bidDir: PriceDirection;
    askDir: PriceDirection;
    high?: number;
    low?: number;
    change?: number;
    changePercent?: number;
    tickTime?: string;
  };
  viewMode?: "advanced" | "simple";
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
      int: "--",
      normal: "",
      big: "--",
    };
  }

  const [intPart, decimalRaw = ""] = price.split(".");
  const decimals = decimalRaw;

  // No decimal
  if (decimals.length === 0) {
    return { int: intPart, normal: "", big: "" };
  }

  // Exactly 2 decimals → both BIG
  if (decimals.length === 2) {
    return {
      int: intPart,
      normal: "",
      big: decimals,
    };
  }

  // 3 or more decimals
  if (decimals.length >= 3) {
    return {
      int: intPart,
      normal: decimals.slice(0, decimals.length - 3),
      big: decimals.slice(decimals.length - 3, decimals.length - 1),
      small: decimals.slice(-1),
    };
  }

  // Only 1 decimal
  return {
    int: intPart,
    normal: decimals,
    big: "",
  };
}

function decimalDiff(bid: string, ask: string): string {
  if (!Number.isFinite(Number(bid)) || !Number.isFinite(Number(ask))) {
    return "---";
  }
  const bidDec = bid.split(".")[1] ?? "0";
  const askDec = ask.split(".")[1] ?? "0";

  const diff = Math.abs(Number(bidDec) - Number(askDec));
  return diff.toString().padStart(3,);
}

function QuoteRow({ live, viewMode = "advanced" }: Props) {
  const bid = splitPrice(live.bid);
  const ask = splitPrice(live.ask);
  const diff = decimalDiff(live.bid, live.ask);

  const bidColor =
    live.bidDir === "up"
      ? "text-blue-600"
      : live.bidDir === "down"
        ? "text-red-600"
        : "text-[var(--text-main)]";

  const askColor =
    live.askDir === "up"
      ? "text-blue-600"
      : live.askDir === "down"
        ? "text-red-600"
        : "text-[var(--text-main)]";

const change = live.change ?? 0;
const changePercent = live.changePercent ?? 0;

const isPositive = change > 0;
const isNegative = change < 0;

const changeColor =
  isPositive
    ? "text-blue-600"
    : isNegative
      ? "text-red-600"
      : "text-[var(--text-muted)]";

// MT5 proper formatting
const formattedChange =
  isPositive
    ? `+${change.toFixed(2)}`
    : change.toFixed(2);

const formattedPercent =
  isPositive
    ? `+${changePercent.toFixed(2)}%`
    : `${changePercent.toFixed(2)}%`;



  if (viewMode === "simple") {
    return (
      <div className="px-1 md:px-0 py-1.5 border-b border-[var(--border-soft)] overflow-x-hidden">
        <div className="mt-1 grid grid-cols-[minmax(72px,1fr)_minmax(82px,auto)_minmax(82px,auto)] items-center gap-2 max-[360px]:gap-1.5">
          <div className="font-semibold text-[14px] max-[360px]:text-[12px] truncate pr-1">
            {live.symbol}
          </div>

          <div className={`text-right font-semibold text-[18px] max-[360px]:text-[15px] leading-none whitespace-nowrap tabular-nums ${bidColor}`}>
            {bid.int}
            <span className="text-[14px] max-[360px]:text-[12px]">.</span>
              <span>{bid.normal}</span>
              <span className="text-[22px] max-[360px]:text-[18px]">{bid.big}</span>
              <sup className="text-[11px] max-[360px]:text-[9px] relative top-[-11px] max-[360px]:top-[-9px]">
                {bid.small}
              </sup>
          </div>

          <div className={`text-right font-semibold text-[18px] max-[360px]:text-[15px] leading-none whitespace-nowrap tabular-nums ${askColor}`}>
            {ask.int}
            <span className="text-[14px] max-[360px]:text-[12px]">.</span>
              <span>{ask.normal}</span>
              <span className="text-[22px] max-[360px]:text-[18px]">{ask.big}</span>
              <sup className="text-[11px] max-[360px]:text-[9px] relative top-[-11px] max-[360px]:top-[-9px]">
                {ask.small}
              </sup>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 md:px-0 py-3 border-b border-[var(--border-soft)] overflow-x-hidden">
      {/* LEFT */}
      <div className="flex flex-col gap-[2px] min-w-0 flex-1">

        {/* CHANGE + % */}
        <div className={`text-[13px] max-[360px]:text-[11px] font-semibold ${changeColor} truncate`}>
          {formattedChange} | {formattedPercent}
        </div>


        {/* SYMBOL */}
        <div className="font-semibold text-[14px] max-[360px]:text-[12px] truncate">
          {live.symbol}
        </div>

        {/* TIME + SPREAD */}
        <div className="text-[11px] max-[360px]:text-[10px] text-[var(--text-muted)] flex items-center gap-2 max-[360px]:gap-1 min-w-0">
          {live.tickTime ?? "--:--:--"}
          <HGapSeparatorIcon />
          {diff}
        </div>
      </div>


      {/* RIGHT */}
      <div className="grid grid-cols-2 gap-3 max-[360px]:gap-2 shrink-0">
        {/* BID */}
        <div className="text-right">
          <div className={`font-semibold text-[18px] max-[360px]:text-[15px] leading-none whitespace-nowrap tabular-nums ${bidColor}`}>
            {bid.int}
            <span className="text-[14px] max-[360px]:text-[12px]">.</span>
            <span>{bid.normal}</span>
            <span className="text-[22px] max-[360px]:text-[18px]">{bid.big}</span>
            <sup className="text-[11px] max-[360px]:text-[9px] relative top-[-11px] max-[360px]:top-[-9px]">
              {bid.small}
            </sup>
          </div>

          <div className="text-xs max-[360px]:text-[10px] text-[var(--text-muted)]">
            L: {live.low ?? "--"}
          </div>
        </div>

        {/* ASK */}
        <div className="text-right">
          <div className={`font-semibold text-[18px] max-[360px]:text-[15px] leading-none whitespace-nowrap tabular-nums ${askColor}`}>
            {ask.int}
            <span className="text-[14px] max-[360px]:text-[12px]">.</span>
            <span>{ask.normal}</span>
            <span className="text-[22px] max-[360px]:text-[18px]">{ask.big}</span>
            <sup className="text-[11px] max-[360px]:text-[9px] relative top-[-11px] max-[360px]:top-[-9px]">
              {ask.small}
            </sup>
          </div>


          <div className="text-xs max-[360px]:text-[10px] text-[var(--text-muted)]">
            H: {live.high ?? "--"}
          </div>
        </div>
      </div>
    </div>
  );
}

const HGapSeparatorIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 5 V8 H18 V5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 19 V16 H18 V19"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default React.memo(QuoteRow);
