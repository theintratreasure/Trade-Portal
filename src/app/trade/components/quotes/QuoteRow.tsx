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
      <div className="px-1 md:px-0 py-1 border-b border-[var(--border-soft)]">
       

        <div className="mt-2 flex items-center justify-between">
          <div className="font-semibold text-[14px]">
            {live.symbol}
          </div>

          <div className="flex gap-10">
            <div className={`text-right font-semibold text-[18px] ${bidColor}`}>
              {bid.int}.
              <span>{bid.normal}</span>
              <span className="text-[22px]">{bid.big}</span>
              <sup className="text-[11px] relative top-[-13px]">
                {bid.small}
              </sup>
            </div>

            <div className={`text-right font-semibold text-[18px] ${askColor}`}>
              {ask.int}.
              <span>{ask.normal}</span>
              <span className="text-[22px]">{ask.big}</span>
              <sup className="text-[11px] relative top-[-13px]">
                {ask.small}
              </sup>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 md:px-0 py-3 border-b border-[var(--border-soft)]">
      {/* LEFT */}
      <div className="flex flex-col gap-[2px] min-w-[130px]">

        {/* CHANGE + % */}
        <div className={`text-[13px] font-semibold ${changeColor}`}>
          {formattedChange} | {formattedPercent}
        </div>


        {/* SYMBOL */}
        <div className="font-semibold text-[14px]">
          {live.symbol}
        </div>

        {/* TIME + SPREAD */}
        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
          {live.tickTime ?? "--:--:--"}
          <HGapSeparatorIcon />
          {diff}
        </div>
      </div>


      {/* RIGHT */}
      <div className="flex gap-6">
        {/* BID */}
        <div className="text-right">
          <div className={`font-semibold text-[18px] ${bidColor}`}>
            {bid.int}.
            <span>{bid.normal}</span>
            <span className="text-[22px]">{bid.big}</span>
            <sup className="text-[11px] relative top-[-13px]">
              {bid.small}
            </sup>
          </div>

          <div className="text-xs text-[var(--text-muted)]">
            L: {live.low ?? "--"}
          </div>
        </div>

        {/* ASK */}
        <div className="text-right">
          <div className={`font-semibold text-[18px] ${askColor}`}>
            {ask.int}.
            <span>{ask.normal}</span>
            <span className="text-[22px]">{ask.big}</span>
            <sup className="text-[11px] relative top-[-13px]">
              {ask.small}
            </sup>
          </div>


          <div className="text-xs text-[var(--text-muted)]">
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
