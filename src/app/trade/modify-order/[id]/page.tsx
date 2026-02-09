"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Toast } from "@/app/components/ui/Toast";
import TopBarSlot from "../../components/layout/TopBarSlot";
import TradeTopBar from "../../components/layout/TradeTopBar";
import LiveChart from "../../components/new-order/chart";
import { useTradeAccount } from "@/hooks/accounts/useAccountById";
import { useLiveTradeSocket } from "@/hooks/useLiveTradeSocket";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import { useModifyPendingOrder } from "@/hooks/trade/useModifyPendingOrder";
import { FilePlus, FileX } from "lucide-react";

export default function ModifyPendingOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { mutate, isPending } = useModifyPendingOrder();
  const [toast, setToast] = useState<any>(null);

  const { data: tradeAccount } = useTradeAccount();
  const accountId = tradeAccount?.accountId;
  const { pending } = useLiveTradeSocket(accountId);

  const order = useMemo(
    () => pending.find((o) => o.orderId === id),
    [pending, id]
  );

  const [price, setPrice] = useState<number | null>(null);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [modifyResult, setModifyResult] = useState<{
  status: "loading" | "success" | "error";
  message?: string;
} | null>(null);

  const STEP = 0.0001;

 useEffect(() => {
  if (!order || initialized) return;

  setPrice(order.price ?? null);
  setStopLoss(order.stopLoss ?? null);
  setTakeProfit(order.takeProfit ?? null);

  setInitialized(true);
}, [order, initialized]);

  if (!order) {
    return (
      <div className="p-6">
        <GlobalLoader />
      </div>
    );
  }

  const handleModify = () => {
  // 🔵 Show loading immediately
  setModifyResult({ status: "loading" });

  mutate(
    {
      positionId: id,
      price: price ?? 0,
      stopLoss: stopLoss ?? 0,
      takeProfit: takeProfit ?? 0,
    },
    {
      onSuccess: () => {
        setTimeout(() => {
          setModifyResult({ status: "success" });

          setTimeout(() => {
            router.push("/trade/trade");
          }, 1000);
        }, 700);
      },
      onError: (err: any) => {
        setTimeout(() => {
          setModifyResult({
            status: "error",
            message:
              err?.response?.data?.message ||
              err?.message ||
              "Modify failed",
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
        title="Modify Pending"
        subtitle={`#${id.slice(0, 10)}`}
        showBack
      />
    </TopBarSlot>

    <div className="md:hidden flex flex-col bg-[var(--bg-plan)]">

      {/* PRICE */}
      <div className="flex justify-center items-center px-6 pt-4 pb-3 text-[var(--text-main)]">
        <div className="flex items-center gap-3 border-b border-[var(--mt-blue)] pb-1">

          <button
            className="text-[var(--mt-blue)] text-xl font-bold"
            onClick={() => {
              const base = price ?? order.price;
              setPrice(Number((base - STEP).toFixed(5)));
            }}
          >
            −
          </button>

          <input
            type="number"
            value={price ?? ""}
            onChange={(e) =>
              setPrice(e.target.value === "" ? null : Number(e.target.value))
            }
            step="0.00001"
            className="flex-1 bg-transparent  border-b border-gray-700 text-center text-[var(--text-main)] outline-none text-xl"
            placeholder="PRICE"
          />

          <button
            className="text-[var(--mt-blue)] text-xl font-bold"
            onClick={() => {
              const base = price ?? order.price;
              setPrice(Number((base + STEP).toFixed(5)));
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* SL / TP */}
      <div className="flex justify-around items-center px-6 pb-3 text-[var(--text-main)]">

        {/* SL */}
        <div className="flex items-center gap-3 border-b border-[var(--warning)] pb-1">
          <button
            className="text-[var(--mt-blue)] text-xl font-bold"
            onClick={() => {
              const base = stopLoss ?? price ?? order.price;
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
              const base = stopLoss ?? price ?? order.price;
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
              const base = takeProfit ?? price ?? order.price;
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
              const base = takeProfit ?? price ?? order.price;
              setTakeProfit(Number((base + STEP).toFixed(5)));
            }}
          >
            +
          </button>
        </div>

      </div>

      <LiveChart
        bid={price ?? order.price}
        ask={price ?? order.price}
        sl={stopLoss ?? undefined}
        tp={takeProfit ?? undefined}
      />

      <div className="fixed bottom-16 w-full p-4 border-t border-[var(--border-soft)]">
        <button
          onClick={handleModify}
          disabled={isPending}
          className="w-full py-4 rounded-xl bg-[var(--mt-grey)] text-[var(--text-main)] font-semibold"
        >
          {isPending ? "Modifying..." : "MODIFY ORDER"}
        </button>
      </div>

    </div>

    <div className="hidden md:block bg-[var(--bg-plan)] text-[var(--text-main)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)]/40 p-4 backdrop-blur">
            <div className="flex items-center justify-between pb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--text-soft)]">
                  Pending Order
                </div>
                <div className="text-xl font-semibold">Modify Price Levels</div>
              </div>
              <div className="rounded-full border border-[var(--border-soft)] px-3 py-1 text-xs text-[var(--text-soft)]">
                ID: {id.slice(0, 10)}
              </div>
            </div>
            <LiveChart
              bid={price ?? order.price}
              ask={price ?? order.price}
              sl={stopLoss ?? undefined}
              tp={takeProfit ?? undefined}
            />
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)]/60 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Modify Order</div>
                <div className="text-xs text-[var(--text-soft)]">Step 0.0001</div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-plan)]/40 p-4">
                  <div className="mb-2 text-xs uppercase tracking-widest text-[var(--text-soft)]">
                    Price
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="h-10 w-10 rounded-lg border border-[var(--border-soft)] text-lg text-[var(--mt-blue)]"
                      onClick={() => {
                        const base = price ?? order.price;
                        setPrice(Number((base - STEP).toFixed(5)));
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={price ?? ""}
                      onChange={(e) =>
                        setPrice(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      step="0.00001"
                      className="w-full rounded-lg border border-[var(--border-soft)] bg-transparent px-3 py-2 text-center text-lg outline-none"
                      placeholder="PRICE"
                    />
                    <button
                      className="h-10 w-10 rounded-lg border border-[var(--border-soft)] text-lg text-[var(--mt-blue)]"
                      onClick={() => {
                        const base = price ?? order.price;
                        setPrice(Number((base + STEP).toFixed(5)));
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--warning)]/40 bg-[var(--bg-plan)]/40 p-4">
                  <div className="mb-2 text-xs uppercase tracking-widest text-[var(--text-soft)]">
                    Stop Loss
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="h-10 w-10 rounded-lg border border-[var(--border-soft)] text-lg text-[var(--mt-blue)]"
                      onClick={() => {
                        const base = stopLoss ?? price ?? order.price;
                        setStopLoss(Number((base - STEP).toFixed(5)));
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={stopLoss ?? ""}
                      onChange={(e) =>
                        setStopLoss(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      step="0.00001"
                      className="w-full rounded-lg border border-[var(--border-soft)] bg-transparent px-3 py-2 text-center text-lg outline-none"
                      placeholder="SL"
                    />
                    <button
                      className="h-10 w-10 rounded-lg border border-[var(--border-soft)] text-lg text-[var(--mt-blue)]"
                      onClick={() => {
                        const base = stopLoss ?? price ?? order.price;
                        setStopLoss(Number((base + STEP).toFixed(5)));
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--success)]/40 bg-[var(--bg-plan)]/40 p-4">
                  <div className="mb-2 text-xs uppercase tracking-widest text-[var(--text-soft)]">
                    Take Profit
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="h-10 w-10 rounded-lg border border-[var(--border-soft)] text-lg text-[var(--mt-blue)]"
                      onClick={() => {
                        const base = takeProfit ?? price ?? order.price;
                        setTakeProfit(Number((base - STEP).toFixed(5)));
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={takeProfit ?? ""}
                      onChange={(e) =>
                        setTakeProfit(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      step="0.00001"
                      className="w-full rounded-lg border border-[var(--border-soft)] bg-transparent px-3 py-2 text-center text-lg outline-none"
                      placeholder="TP"
                    />
                    <button
                      className="h-10 w-10 rounded-lg border border-[var(--border-soft)] text-lg text-[var(--mt-blue)]"
                      onClick={() => {
                        const base = takeProfit ?? price ?? order.price;
                        setTakeProfit(Number((base + STEP).toFixed(5)));
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)]/60 p-5 backdrop-blur">
              <div className="mb-3 text-xs uppercase tracking-widest text-[var(--text-soft)]">
                Order Actions
              </div>
              <button
                onClick={handleModify}
                disabled={isPending}
                className="w-full rounded-xl bg-[var(--mt-grey)] py-3 text-[var(--text-main)] font-semibold"
              >
                {isPending ? "Modifying..." : "Modify Order"}
              </button>
              <div className="mt-3 text-xs text-[var(--text-soft)]">
                Confirming will update price, SL, and TP for this pending order.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {toast && <Toast message={toast.message} type={toast.type} />}
    {modifyResult && (
  <div className="fixed inset-0 z-[9999] bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col items-center justify-center text-[var(--text-main)]">

    {/* LOADING */}
    {modifyResult.status === "loading" && (
      <>
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-[var(--mt-blue)] flex items-center justify-center">
            <FilePlus size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>

        <div className="text-xl font-semibold">
          Modifying order...
        </div>

        <div className="text-gray-400 text-sm mt-2">
          #{id.slice(0, 10)}
        </div>
      </>
    )}

    {/* SUCCESS */}
    {modifyResult.status === "success" && (
      <>
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-[var(--success)] flex items-center justify-center">
            <FilePlus size={36} className="text-white" />
          </div>
        </div>

        <div className="text-3xl font-bold mb-4">
          Order Modified
        </div>

        <div className="text-gray-400 text-lg">
          #{id.slice(0, 10)}
        </div>
      </>
    )}

    {/* ERROR */}
    {modifyResult.status === "error" && (
      <>
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-[var(--mt-red)] flex items-center justify-center">
            <FileX size={36} className="text-white" />
          </div>
        </div>

        <div className="text-3xl font-bold mb-4">
          Modify Failed
        </div>

        <div className="text-[var(--mt-red)] text-lg text-center max-w-md px-6">
          {modifyResult.message}
        </div>
      </>
    )}
  </div>
)}

  </>
);

}
