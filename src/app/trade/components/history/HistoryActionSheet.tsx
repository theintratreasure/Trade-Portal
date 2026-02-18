"use client";

import { useRouter } from "next/navigation";
import ActionItem from "../trade/ActionItem";

type Props = {
  item: any;
  type: "position" | "order" | "deal" | null;
  open: boolean;
  onClose: () => void;
};

export default function HistoryActionSheet({
  item,
  type,
  open,
  onClose,
}: Props) {
  const router = useRouter();

  if (!open || !item || !type) return null;

  const symbol = item.symbol;

  return (
    <div className="fixed inset-0 z-[999] flex items-end bg-black/40 md:items-center md:justify-center">

      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full bg-[var(--bg-plan)] md:w-[420px] md:bg-[var(--bg-card)] max-h-[85dvh] overflow-y-auto ios-momentum-scroll pb-[env(safe-area-inset-bottom)]">

        {/* HEADER */}
        <div className="p-3 border-b border-[var(--border-soft)]">
          <div className="font-semibold">
            {symbol}
          </div>

          <div className="text-[12px] text-[var(--text-muted)] mt-1">
            #{item.orderId?.slice(0, 10) || item.tradeId?.slice(0, 10)}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="divide-y divide-[var(--border-soft)] text-[15px]">

          <ActionItem
            label="Chart"
            onClick={() => {
              router.push(`/trade/charts?symbol=${symbol}`);
              onClose();
            }}
          />

          <ActionItem
            label="New Order"
            onClick={() => {
              router.push(`/trade/new-order?symbol=${symbol}`);
              onClose();
            }}
          />

        </div>

      </div>
    </div>
  );
}
