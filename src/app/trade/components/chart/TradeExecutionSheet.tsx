"use client";

import { useState } from "react";
import { Toast } from "@/app/components/ui/Toast";
import { useMarketOrder } from "@/hooks/trade/useTrade";

interface Props {
  open: boolean;
  onClose: () => void;
  symbol: string;
  bid: number;
  ask: number;
}

export default function TradeExecutionSheet({
  open,
  onClose,
  symbol,
  bid,
  ask,
}: Props) {
  const marketOrder = useMarketOrder();

  const [volume, setVolume] = useState(0.01);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  

  if (!open) return null;

  const changeVolume = (type: "inc" | "dec") => {
    setVolume((prev) => {
      const next =
        type === "inc"
          ? prev + 0.01
          : Math.max(0.01, prev - 0.01);
      return parseFloat(next.toFixed(2));
    });
  };

  const execute = (side: "BUY" | "SELL") => {
    marketOrder.mutate(
      { symbol, side, volume },
      {
        onSuccess: () => {
          setToast({
            message: `${side} order executed successfully`,
            type: "success",
          });
          onClose();
        },
        onError: () => {
          setToast({
            message: "Order execution failed",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Slide Down Panel */}
      <div className="fixed top-14 left-0 right-0 z-50 bg-[var(--bg-card)] shadow-xl animate-slideDown">

        <div className="p-2 space-y-4">

          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">
              Market Execution
            </span>
            <button onClick={onClose}>✕</button>
          </div>

          {/* SELL / VOLUME / BUY */}
          <div className="flex items-center gap-2">

            {/* SELL */}
            <button
              onClick={() => execute("SELL")}
              disabled={marketOrder.isPending}
              className="flex-1 bg-red-500 text-white rounded-xl p-2 active:scale-95 transition"
            >
              <div className="text-xs opacity-80">SELL</div>
              <div className="text-lg font-bold">{bid}</div>
            </button>

            {/* Volume Control */}
            <div className="flex flex-col items-center gap-1">

              <div className="flex items-center bg-[var(--bg-plan)] rounded-lg overflow-hidden">

                <button
                  onClick={() => changeVolume("dec")}
                  className="px-2 py-1 text-sm"
                >
                  −
                </button>

                <input
                  type="number"
                  step="0.01"
                  value={volume}
                  onChange={(e) =>
                    setVolume(
                      Math.max(
                        0.01,
                        parseFloat(e.target.value) || 0.01
                      )
                    )
                  }
                  className="w-16 text-center bg-transparent outline-none"
                />

                <button
                  onClick={() => changeVolume("inc")}
                  className="px-2 py-1 text-sm"
                >
                  +
                </button>

              </div>

              <span className="text-xs text-[var(--text-muted)]">
                Lots
              </span>
            </div>

            {/* BUY */}
            <button
              onClick={() => execute("BUY")}
              disabled={marketOrder.isPending}
              className="flex-1 bg-blue-500 text-white rounded-xl p-2 active:scale-95 transition"
            >
              <div className="text-xs opacity-80">BUY</div>
              <div className="text-lg font-bold">{ask}</div>
            </button>

          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
