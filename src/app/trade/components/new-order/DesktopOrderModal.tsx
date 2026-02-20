"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useMarketOrder, usePendingOrder } from "@/hooks/trade/useTrade";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { Toast } from "@/app/components/ui/Toast";
import { getTradeTokenFromStorageSync } from "@/lib/tradeToken";
import type { PendingOrderPayload } from "@/services/trade/trade.service";

type Props = {
  open: boolean;
  onClose: () => void;
  symbol: string;
};

type OrderTab = "MARKET" | "LIMIT" | "STOP";
type ToastState = { message: string; type: "success" | "error" };
type PendingOrderType = "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP";

const MIN_LOT = 0.01;
const ORDER_TABS: OrderTab[] = ["MARKET", "LIMIT", "STOP"];

function getErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const row = err as { message?: string; response?: { data?: { message?: string } } };
  return row.response?.data?.message || row.message || fallback;
}

export default function DesktopOrderModal({ open, onClose, symbol }: Props) {
  const { mutate: marketOrder } = useMarketOrder();
  const { mutate: pendingOrder, isPending } = usePendingOrder();

  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [tab, setTab] = useState<OrderTab>("MARKET");

  const [lotInput, setLotInput] = useState<string>(MIN_LOT.toFixed(2));
  const [price, setPrice] = useState<number | "">("");
  const [sl, setSl] = useState<number | "">("");
  const [tp, setTp] = useState<number | "">("");
  const [expiration, setExpiration] = useState<"GTC" | "TODAY" | "SPECIFIED">("GTC");
  const [specifiedDate, setSpecifiedDate] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const token = useMemo(() => getTradeTokenFromStorageSync(), []);
  const quotes = useMarketQuotes(token);

  const live = symbol ? quotes[symbol] : undefined;
  const bid = Number(live?.bid ?? 0);
  const ask = Number(live?.ask ?? 0);
  const lot = Math.max(MIN_LOT, Number(lotInput || 0));
  const pricePrecision = useMemo(() => {
    const getDecimals = (value: unknown) => {
      const raw = String(value ?? "").trim();
      if (!raw || raw === "--") return 0;
      const num = Number(raw);
      if (!Number.isFinite(num)) return 0;
      const decimals = raw.split(".")[1]?.replace(/0+$/, "").length ?? 0;
      return Math.max(0, decimals);
    };
    const detected = Math.max(getDecimals(live?.bid), getDecimals(live?.ask));
    return Math.min(8, Math.max(0, detected || 5));
  }, [live?.ask, live?.bid]);
  const priceStep = useMemo(() => {
    if (pricePrecision <= 0) return 1;
    return Number((1 / Math.pow(10, pricePrecision)).toFixed(pricePrecision));
  }, [pricePrecision]);
  const roundToPricePrecision = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Number(value.toFixed(pricePrecision));
  };

  if (!open) return null;

  const themeColor = side === "BUY" ? "var(--mt-blue)" : "var(--mt-red)";
  const isLocked = isSubmitting || submitLockRef.current || isPending;
  const handleClose = () => {
    if (isLocked) return;
    onClose();
  };

  const handleSubmit = () => {
    if (submitLockRef.current || isSubmitting || isPending) return;

    if (!symbol || !Number.isFinite(lot) || lot < MIN_LOT) {
      setToast({
        type: "error",
        message: `Lot size must be at least ${MIN_LOT.toFixed(2)}`,
      });
      return;
    }

    if (tab !== "MARKET" && expiration === "SPECIFIED" && !specifiedDate) {
      setToast({ type: "error", message: "Select expiration date" });
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const unlock = () => {
      submitLockRef.current = false;
      setIsSubmitting(false);
    };

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
            unlock();
            onClose();
          },
          onError: (err: unknown) => {
            unlock();
            setToast({
              type: "error",
              message: getErrorMessage(err, "Market order failed"),
            });
          },
        }
      );
      return;
    }

    const typeMap: Record<Exclude<OrderTab, "MARKET">, PendingOrderType> = {
      LIMIT: side === "BUY" ? "BUY_LIMIT" : "SELL_LIMIT",
      STOP: side === "BUY" ? "BUY_STOP" : "SELL_STOP",
    };

    const pendingType = typeMap[tab as Exclude<OrderTab, "MARKET">];
    const payload: PendingOrderPayload = {
      symbol,
      side,
      orderType: pendingType as PendingOrderPayload["orderType"],
      volume: lot,
      price: roundToPricePrecision(Number(price)),
    };

    if (sl !== "") payload.stopLoss = roundToPricePrecision(Number(sl));
    if (tp !== "") payload.takeProfit = roundToPricePrecision(Number(tp));

    if (expiration === "SPECIFIED") {
      payload.expireType = "TIME";
      payload.expireAt = specifiedDate!.toISOString();
    } else {
      payload.expireType = expiration;
    }

    pendingOrder(payload, {
      onSuccess: () => {
        unlock();
        onClose();
      },
      onError: (err: unknown) => {
        unlock();
        setToast({
          type: "error",
          message: getErrorMessage(err, "Order failed"),
        });
      },
    });
  };

  return (
    <>
      <div className="hidden md:flex fixed inset-0 z-[9999] items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

        <div className="relative w-[min(92vw,520px)] bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-soft)] overflow-hidden">
          <div
            className="flex items-center justify-between px-3 py-2 text-white"
            style={{ background: themeColor }}
          >
            <div className="font-semibold text-sm">{symbol}</div>

            <div className="font-bold text-sm">
              {bid} / {ask}
            </div>

            <button
              disabled={isLocked}
              onClick={() => setSide((s) => (s === "BUY" ? "SELL" : "BUY"))}
              className="px-4 py-1 bg-[var(--bg-card)] text-[var(--text-main)] font-bold rounded-md disabled:opacity-60"
            >
              {side}
            </button>

            <button onClick={handleClose} disabled={isLocked} className="disabled:opacity-60">
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-[var(--border-soft)]">
            {ORDER_TABS.map((t) => (
              <button
                key={t}
                disabled={isLocked}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold ${
                  tab === t ? "border-b-2 border-[var(--primary)]" : "text-[var(--text-muted)]"
                } disabled:opacity-60`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[var(--text-muted)]">Lot Size</label>
              <input
                type="text"
                inputMode="decimal"
                value={lotInput}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9.]/g, "");
                  const dotCount = (next.match(/\./g) || []).length;
                  if (dotCount > 1) return;
                  setLotInput(next);
                }}
                onBlur={() => {
                  const parsed = Number(lotInput || 0);
                  if (!Number.isFinite(parsed) || parsed < MIN_LOT) {
                    setLotInput(MIN_LOT.toFixed(2));
                    return;
                  }
                  setLotInput(parsed.toFixed(2));
                }}
                className="mt-2 w-full px-2 py-1.5 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
              />
            </div>

            {tab !== "MARKET" && (
              <div>
                <label className="text-sm text-[var(--text-muted)]">Trigger Price</label>
                <input
                  type="number"
                  value={price}
                  step={priceStep}
                  onChange={(e) =>
                    setPrice(e.target.value === "" ? "" : roundToPricePrecision(Number(e.target.value)))
                  }
                  className="mt-2 w-full px-2 py-1.5 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-[var(--text-muted)]">Stop Loss</label>
              <input
                type="number"
                value={sl}
                step={priceStep}
                onChange={(e) =>
                  setSl(e.target.value === "" ? "" : roundToPricePrecision(Number(e.target.value)))
                }
                className="mt-2 w-full px-2 py-1.5 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
              />
            </div>

            <div>
              <label className="text-sm text-[var(--text-muted)]">Take Profit</label>
              <input
                type="number"
                value={tp}
                step={priceStep}
                onChange={(e) =>
                  setTp(e.target.value === "" ? "" : roundToPricePrecision(Number(e.target.value)))
                }
                className="mt-2 w-full px-2 py-1.5 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md"
              />
            </div>

            {tab !== "MARKET" && (
              <div className="col-span-2">
                <div className="flex flex-wrap gap-2">
                  {["GTC", "TODAY", "SPECIFIED"].map((e) => (
                    <button
                      key={e}
                      onClick={() => setExpiration(e as "GTC" | "TODAY" | "SPECIFIED")}
                      className={`px-3 py-1.5 border rounded-md text-sm ${
                        expiration === e ? "border-[var(--primary)]" : "border-[var(--border-soft)]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                {expiration === "SPECIFIED" && (
                  <input
                    type="datetime-local"
                    className="mt-2 w-full px-2 py-1.5 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-md text-[var(--text-main)] [color-scheme:light] dark:[color-scheme:dark]"
                    value={
                      specifiedDate
                        ? new Date(
                            specifiedDate.getTime() - specifiedDate.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setSpecifiedDate(val ? new Date(val) : null);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-[var(--border-soft)] flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLocked}
              className="px-6 py-2 rounded-lg text-[var(--text-main)] font-semibold"
              style={{ background: themeColor }}
            >
              {isLocked ? "Processing..." : side}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
