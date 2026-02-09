"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Toast } from "@/app/components/ui/Toast";
import TopBarSlot from "../../components/layout/TopBarSlot";
import TradeTopBar from "../../components/layout/TradeTopBar";
import LiveChart from "../../components/new-order/chart";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { useLiveTradeSocket } from "@/hooks/useLiveTradeSocket";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import { useModifyPosition } from "@/hooks/trade/useModifyPosition";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { FilePlus, FileX } from "lucide-react";
type SplitPrice = {
  int: string;
  normal: string;
  big: string;
  small?: string;
};

function splitPrice(price?: string): SplitPrice {
  if (!price || isNaN(Number(price))) {
    return { int: "0", normal: "", big: "00" };
  }

  const [intPart, decimalRaw = ""] = price.split(".");
  const decimals = decimalRaw;

  if (decimals.length === 0) {
    return { int: intPart, normal: "", big: "" };
  }

  if (decimals.length === 2) {
    return { int: intPart, normal: "", big: decimals };
  }

  if (decimals.length >= 3) {
    return {
      int: intPart,
      normal: decimals.slice(0, decimals.length - 3),
      big: decimals.slice(decimals.length - 3, decimals.length - 1),
      small: decimals.slice(-1),
    };
  }

  return { int: intPart, normal: decimals, big: "" };
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
export default function ModifyPositionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { mutate, isPending } = useModifyPosition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: tradeAccount } = useTradeAccount();
  const accountId = tradeAccount?.accountId;
  const { positions } = useLiveTradeSocket(accountId);

  const position = useMemo(
    () => positions.find((p) => p.positionId === id),
    [positions, id]
  );
  const initialToken = getTradeTokenFromStorageSync();
  const [token] = useState<string>(initialToken);
  const quotes = useMarketQuotes(token);

  const symbol = position?.symbol;
  const live = symbol ? quotes[symbol] : undefined;


  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [modifyResult, setModifyResult] = useState<{
    status: "loading" | "success" | "error";
    message?: string;
  } | null>(null);
  const STEP = 0.0001;

  useEffect(() => {
    if (!position || initialized) return;

    setStopLoss(position.stopLoss ?? null);
    setTakeProfit(position.takeProfit ?? null);

    setInitialized(true);
  }, [position, initialized]);


  if (!position) {
    return (
      <div className="p-6">
        <GlobalLoader />
      </div>
    );
  }

  const currentPrice = Number(position.currentPrice);
  const isBuy = position.side === "BUY";
  const marketReady = !!live;
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



  const handleModify = () => {
    if (stopLoss === null && takeProfit === null) return;

    // 🔵 Show loading sheet immediately
    setModifyResult({
      status: "loading",
    });

    mutate(
      {
        positionId: id,
        stopLoss: stopLoss ?? undefined,
        takeProfit: takeProfit ?? undefined,
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            setModifyResult({
              status: "success",
            });

            setTimeout(() => {
              router.push("/trade/trade");
            }, 1000);
          }, 700);
        },
        onError: (err: any) => {
          setTimeout(() => {
            setModifyResult({
              status: "error",
              message: err?.response?.data?.message || err?.message || "Modify failed",
            });

            setTimeout(() => {
              setModifyResult(null);
            }, 1500);
          }, 700);
        },
      }
    );
  };


  return (
    <>
      <TopBarSlot>
        <TradeTopBar
          title="Modify Position"
          subtitle={`#${id.slice(0, 10)}`}
          showBack
        />
      </TopBarSlot>

      <div className="md:hidden flex flex-col bg-[var(--bg-plan)]">

        {/* LIVE PRICES */}
        <div className="flex justify-around px-6 pb-3 pt-2 mt-4">
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
        {/* SL / TP */}
        <div className="flex justify-around items-center px-6 pb-3 text-[var(--text-main)] mt-4">

          {/* SL */}
          <div className="flex items-center gap-3 border-b border-[var(--warning)] pb-1">

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"
              onClick={() => {
                const base = stopLoss ?? currentPrice;
                setStopLoss(Number((base - STEP).toFixed(5)));
              }}
            >
              −
            </button>

            <input
              type="number"
              value={stopLoss ?? ""}
              onChange={(e) =>
                setStopLoss(e.target.value === "" ? null : Number(e.target.value))
              }
              step="0.00001"
              className="w-24 bg-transparent text-center text-lg outline-none"
              placeholder="SL"
            />

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"
              onClick={() => {
                const base = stopLoss ?? currentPrice;
                setStopLoss(Number((base + STEP).toFixed(5)));
              }}
            >
              +
            </button>
          </div>

          {/* TP */}
          <div className="flex items-center gap-3 border-b border-[var(--success)] pb-1">

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"
              onClick={() => {
                const base = takeProfit ?? currentPrice;
                setTakeProfit(Number((base - STEP).toFixed(5)));
              }}
            >
              −
            </button>

            <input
              type="number"
              value={takeProfit ?? ""}
              onChange={(e) =>
                setTakeProfit(e.target.value === "" ? null : Number(e.target.value))
              }
              step="0.00001"
              className="w-24 bg-transparent text-center text-lg outline-none"
              placeholder="TP"
            />

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"
              onClick={() => {
                const base = takeProfit ?? currentPrice;
                setTakeProfit(Number((base + STEP).toFixed(5)));
              }}
            >
              +
            </button>
          </div>

        </div>

        <div className="mt-8">

          <LiveChart
            bid={Number(live?.bid)}
            ask={Number(live?.ask)}
            sl={stopLoss ?? undefined}
            tp={takeProfit ?? undefined}
            height={350} gridCount={10}
          />
        </div>

        <div className="fixed bottom-0 z-[99] w-full p-5 bg-[var(--bg-plan)] border-t border-[var(--border-soft)]">
          <button
            onClick={handleModify}
            disabled={isPending}
            className="w-full py-4 rounded-xl bg-[var(--mt-grey)] text-[var(--text-main)] font-semibold"
          >
            {isPending ? "Modifying..." : "MODIFY"}
          </button>
        </div>

      </div>
      {/* ================= DESKTOP MODIFY ================= */}
      <div className="hidden md:block px-8 py-6 bg-[var(--bg-main)] min-h-screen">

        <div className="max-w-6xl mx-auto bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl shadow-sm">

          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-soft)] bg-[var(--bg-glass)] flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">
                Modify Position
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                #{id.slice(0, 10)} · {position.symbol}
              </div>
            </div>

            <div className={`text-lg font-semibold ${isBuy ? "text-[var(--mt-blue)]" : "text-[var(--mt-red)]"
              }`}>
              {position.side} {position.volume}
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-2 gap-8 p-8">

            {/* LEFT SIDE - PRICE + SLTP */}
            <div>

              {/* Live Prices */}
              <div className="flex justify-between mb-8">
                <div className={`font-bold text-2xl ${bidColor}`}>
                  BID {live?.bid ?? "--"}
                </div>

                <div className={`font-bold text-2xl ${askColor}`}>
                  ASK {live?.ask ?? "--"}
                </div>
              </div>

              {/* SL */}
              <div className="mb-6">
                <label className="text-sm text-[var(--text-muted)]">Stop Loss</label>

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => {
                      const base = stopLoss ?? currentPrice;
                      setStopLoss(Number((base - STEP).toFixed(5)));
                    }}
                    className="px-3 py-2 bg-[var(--bg-glass)] rounded-lg"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={stopLoss ?? ""}
                    onChange={(e) =>
                      setStopLoss(e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="flex-1 px-4 py-2 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-lg text-center outline-none"
                  />

                  <button
                    onClick={() => {
                      const base = stopLoss ?? currentPrice;
                      setStopLoss(Number((base + STEP).toFixed(5)));
                    }}
                    className="px-3 py-2 bg-[var(--bg-glass)] rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* TP */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">Take Profit</label>

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => {
                      const base = takeProfit ?? currentPrice;
                      setTakeProfit(Number((base - STEP).toFixed(5)));
                    }}
                    className="px-3 py-2 bg-[var(--bg-glass)] rounded-lg"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={takeProfit ?? ""}
                    onChange={(e) =>
                      setTakeProfit(e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="flex-1 px-4 py-2 bg-[var(--bg-plan)] border border-[var(--border-soft)] rounded-lg text-center outline-none"
                  />

                  <button
                    onClick={() => {
                      const base = takeProfit ?? currentPrice;
                      setTakeProfit(Number((base + STEP).toFixed(5)));
                    }}
                    className="px-3 py-2 bg-[var(--bg-glass)] rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT SIDE - CHART */}
            <div className="border border-[var(--border-soft)] rounded-xl overflow-hidden">
              <LiveChart
                bid={Number(live?.bid)}
                ask={Number(live?.ask)}
                sl={stopLoss ?? undefined}
                tp={takeProfit ?? undefined}
                height={420}
                gridCount={10}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-[var(--border-soft)] bg-[var(--bg-glass)] flex justify-end">

            <button
              onClick={handleModify}
              disabled={isPending}
              className="px-10 py-3 rounded-xl bg-[var(--primary)] text-[var(--text-invert)] font-semibold hover:bg-[var(--primary-hover)] transition disabled:opacity-50"
            >
              {isPending ? "Modifying..." : "Modify Position"}
            </button>

          </div>

        </div>
      </div>
      {modifyResult && (
        <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center justify-center text-[var(--text-main)]">

          {/* LOADING */}
          {modifyResult.status === "loading" && (
            <>
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
                <div className="text-xl font-semibold">
                  Modifying position...
                </div>
              </div>
            </>
          )}

          {/* SUCCESS */}
          {modifyResult.status === "success" && (
            <>
              <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center pt-[12vh] text-[var(--text-main)]">

                {/* ICON CIRCLE */}
                <div className="relative w-22 h-22 mb-8">
                  <div className="absolute inset-0 rounded-full bg-[var(--success)] flex items-center justify-center">
                    <FilePlus size={34} className="text-[var(--text-main)]" />
                  </div>
                </div>

                <div className="text-3xl font-bold mb-4">
                  Modified Successfully
                </div>

                <div className="text-gray-400">
                  #{id.slice(0, 10)}
                </div>
              </div>
            </>
          )}

          {/* ERROR */}
          {modifyResult.status === "error" && (
            <>
              <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center pt-[12vh] text-[var(--text-main)]">

                {/* ICON CIRCLE */}
                <div className="relative w-22 h-22 mb-8">
                  <div className="absolute inset-0 rounded-full bg-[var(--mt-red)] flex items-center justify-center">
                    <FileX size={34} className="text-white" />
                  </div>
                </div>

                <div className="text-3xl font-bold mb-4">
                  Modify Failed
                </div>

                <div className="text-[var(--mt-red)] text-lg text-center px-6">
                  {modifyResult.message || "Something went wrong"}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
