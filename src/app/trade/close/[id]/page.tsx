"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useClosePosition } from "@/hooks/useClosePosition";
import { Toast } from "@/app/components/ui/Toast";
import TopBarSlot from "../../components/layout/TopBarSlot";
import TradeTopBar from "../../components/layout/TradeTopBar";
import LiveChart from "../../components/new-order/chart";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { useLiveTradeSocket } from "@/hooks/useLiveTradeSocket";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import { getTradeTokenFromStorageSync, splitPrice } from "../../components/function/splitPrice";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";

export default function ClosePositionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { mutate, isPending, data } = useClosePosition();
  const [toast, setToast] = useState<any>(null);
  const [volume, setVolume] = useState<number>(0.01);
  const stepButtons = [-1.0, -0.5, -0.1, 0.1, 0.5, 1.0];
  const realizedPnL = data?.data.realizedPnL;
  const { data: tradeAccount } = useTradeAccount();
  const accountId = tradeAccount?.accountId;

  const { positions } = useLiveTradeSocket(accountId);

  const position = positions.find((p) => p.positionId === id);


  const initialToken = getTradeTokenFromStorageSync();
  const [token] = useState<string>(initialToken);
  const quotes = useMarketQuotes(token);

  const symbol = positions.find((p) => p.positionId === id)?.symbol;
  const live = symbol ? quotes[symbol] : undefined;

  const currentPosition = positions.find(
    (p) => p.positionId === id
  );
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
  const livePnL = currentPosition?.floatingPnL ?? 0;
  if (!position) {
    return <div className="p-6"></div>;
  }
  const handleClose = () => {
    mutate(
      { positionId: id },
      {
        onSuccess: (res) => {
          setToast({
            type: "success",
            message: `Position closed (${res.data.realizedPnL})`,
          });

          setTimeout(() => {
            router.push("/trade/trade");
          }, 1500);
        },
        onError: (err: any) => {
          setToast({
            type: "error",
            message: err?.message || "Close failed",
          });
        },
      }
    );
  };

  return (
    <>
      {/* TOPBAR */}
      <TopBarSlot>
        <TradeTopBar
          title="Close Position"
          subtitle={`#${id.slice(0, 10)}`}
          showBack
        />
      </TopBarSlot>

      {/* MAIN CONTENT */}
      <div className="md:hidden flex flex-col  bg-[var(--bg-plan)] md:bg-[var(--bg-card)]">
        {/* VOLUME ROW */}
        <div className="flex items-center justify-between px-2 py-3 text-sm select-none border-b border-gray-800">
          <div className="flex gap-2 text-[var(--text-main)]">
            {stepButtons
              .filter((v) => v < 0)
              .map((v, i) => (
                <button
                  key={i}
                  className="px-2 py-1 rounded text-1xl hover:bg-gray-800 transition-colors"
                  onClick={() =>
                    setVolume((prev) => {
                      const next = +(prev + v).toFixed(2);
                      return next < 0.01 ? 0.01 : next;
                    })
                  }
                >
                  {v}
                </button>
              ))}
          </div>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={position.volume?.toFixed(2)}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (isNaN(val)) return;
              setVolume(val < 0.01 ? 0.01 : Number(val.toFixed(2)));
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
                  onClick={() =>
                    setVolume((prev) => +(prev + v).toFixed(2))
                  }
                >
                  +{v}
                </button>
              ))}
          </div>
        </div>

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

        {/* SL / TP INPUTS */}
        <div className="flex justify-around items-center px-6 pb-3 text-[var(--text-main)] mt-4">

          {/* SL */}
          <div className="relative flex items-center gap-3 border-b border-[var(--warning)] pb-1">
            <span className="absolute bottom-0 left-0 h-[20%] w-[1px] bg-[var(--warning)]"></span>
            <span className="absolute bottom-0 right-0 h-[20%] w-[1px] bg-[var(--warning)]"></span>

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"


            >
              −
            </button>

            <input
              value={position.stopLoss ?? ""}
              readOnly
              placeholder="SL"
              className="w-24 bg-transparent text-center text-[var(--text-main)] outline-none text-lg"
            />

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"


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

            >
              −
            </button>

            <input
              value={position.takeProfit ?? ""}
              readOnly
              placeholder="TP"
              className="w-24 bg-transparent text-center text-[var(--text-main)] outline-none text-lg"
            />

            <button
              className="text-[var(--mt-blue)] text-xl font-bold"


            >
              +
            </button>

          </div>

        </div>
        {/* CHART */}
        <div className="flex-1 mt-4">
          <LiveChart

            bid={Number(live?.bid)}
            ask={Number(live?.ask)}
            sl={position.stopLoss ?? undefined}
            tp={position.takeProfit ?? undefined}
            height={350} gridCount={10}
          />
        </div>



        {/* INFO TEXT */}
        <div className="text-center text-xs text-[var(--text-muted)] px-4 py-2 mt-4">
          Attention! The trade will be executed at market conditions,
          difference with requested price may be significant!
        </div>

        {/* BUTTON AREA */}
        <div className="fixed z-[99] w-full bg-[var(--bg-plan)] p-4 md:p-6 border-t border-[var(--border-soft)] bottom-[calc(64px+env(safe-area-inset-bottom))] pb-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-0 md:pb-6">

          <button
            onClick={handleClose}
            disabled={isPending}
            className="
    w-full py-4 rounded-xl text-lg font-semibold
    bg-[var(--bg-glass)]
    text-[var(--warning)]
    transition active:scale-[0.98]
    disabled:opacity-50
  "
          >
            {livePnL < 0 ? "Close with loss " : "Close with profit "}
            <span
              className={
                livePnL < 0
                  ? "text-[var(--mt-red)]"
                  : "text-[var(--mt-blue)]"
              }
            >
              {livePnL > 0 ? "+" : ""}
              {livePnL.toFixed(2)}
            </span>
          </button>
        </div>
      </div>

      <div className="hidden md:flex h-[calc(100vh-60px)] bg-[var(--bg-main)] text-[var(--text-main)] relative overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[var(--primary-glow)] blur-[140px] rounded-full opacity-30" />
        </div>

        {/* LEFT SIDE */}
        <div className="flex-1 p-10 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-wide">
                {position.symbol}
              </h2>
              <div className="text-sm text-[var(--text-muted)]">
                Market Execution Panel
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--text-muted)]">
              #{id.slice(0, 8)}
            </div>
          </div>

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
          {/* Chart Container */}
          <div className="flex-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-soft)] shadow-xl p-6">
           <LiveChart

            bid={Number(live?.bid)}
            ask={Number(live?.ask)}
            sl={position.stopLoss ?? undefined}
            tp={position.takeProfit ?? undefined}
            height={350} gridCount={10}
          />
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="w-[480px] bg-[var(--bg-card)] border-l border-[var(--border-soft)] flex flex-col">

          {/* PNL SECTION */}
          <div className="p-8 border-b border-[var(--border-soft)] bg-[var(--bg-plan)]">

            <div className="flex justify-between items-center text-xs uppercase tracking-wider text-[var(--text-muted)]">
              <span>Floating PnL</span>
              <span>USD</span>
            </div>

            <div
              className={`mt-4 text-4xl font-bold mt-font ${livePnL >= 0
                ? "text-[var(--mt-blue)]"
                : "text-[var(--mt-red)]"
                }`}
            >
              {livePnL > 0 ? "+" : ""}
              {livePnL.toFixed(2)}
            </div>

          </div>

          {/* DETAILS */}
          <div className="flex-1 p-8 space-y-8 overflow-y-auto">

            <div className="grid grid-cols-2 gap-6">

              <StatBlock label="Volume" value={`${position.volume?.toFixed(2)} Lots`} />
              <StatBlock label="Side" value={position.side} highlight />

              <StatBlock
                label="Stop Loss"
                value={
                  position.stopLoss
                    ? Number(position.stopLoss).toFixed(2)
                    : "---"
                }
                danger
              />

              <StatBlock
                label="Take Profit"
                value={
                  position.takeProfit
                    ? Number(position.takeProfit).toFixed(2)
                    : "---"
                }
                success
              />

              <StatBlock
                label="Entry Price"
                value={Number(position.openPrice).toFixed(2)}
              />

              <StatBlock
                label="Current Price"
                value={Number(position.currentPrice).toFixed(2)}
                highlight
              />

            </div>

          </div>

          {/* EXECUTION BUTTON */}
          <div className="p-8 border-t border-[var(--border-soft)] bg-[var(--bg-plan)]">

            <button
              onClick={handleClose}
              disabled={isPending}
              className={`w-full h-14 rounded-xl text-lg font-semibold transition-all duration-200 active:scale-[0.98] shadow-md ${livePnL >= 0
                ? "bg-[var(--mt-blue)] text-[var(--text-main)]"
                : "bg-[var(--mt-red)] text-[var(--text-main)]"
                } ${isPending ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
            >
              {isPending
                ? "Executing..."
                : livePnL >= 0
                  ? `Close with Profit +${livePnL.toFixed(2)}`
                  : `Close with Loss ${livePnL.toFixed(2)}`
              }
            </button>

          </div>

        </div>
      </div>





      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
function StatBlock({
  label,
  value,
  highlight,
  success,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--bg-plan)] border border-[var(--border-soft)] hover:border-[var(--primary-glow)] transition-all duration-200">

      <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </div>

      <div
        className={`mt-3 text-lg font-semibold mt-font ${success
          ? "text-[var(--mt-blue)]"
          : danger
            ? "text-[var(--mt-red)]"
            : highlight
              ? "text-[var(--text-main)]"
              : "text-[var(--text-muted)]"
          }`}
      >
        {value}
      </div>

    </div>
  );
}

