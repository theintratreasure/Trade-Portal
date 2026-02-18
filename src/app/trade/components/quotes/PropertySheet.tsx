"use client";

import { ArrowLeft } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSymbolProperty } from "@/hooks/useSymbolProperty";
import { createPortal } from "react-dom";

export default function PropertySheet({
  open,
  symbol,
  onClose,
}: {
  open: boolean;
  symbol: string;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data, isLoading } = useSymbolProperty(symbol);

  if (!open) return null;

  const content = (
    <div className="w-full h-full bg-[var(--bg-plan)] md:bg-[var(--bg-card)] flex flex-col">

      {/* HEADER (fixed) */}
      <div className="flex items-center px-4 py-3 border-b border-[var(--border-soft)]">
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-glass)] transition"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="ml-3">
          <div className="text-sm font-semibold">{symbol}</div>
          <div className="text-xs text-[var(--text-muted)]">
            Instrument Properties
          </div>
        </div>
      </div>

      {/* BODY (scrollable area only) */}
      <div className="flex-1 overflow-y-auto ios-momentum-scroll p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-8 text-sm">

        {isLoading && (
          <div className="text-center text-[var(--text-muted)]">
            Loading properties...
          </div>
        )}

        {data?.data && (
          <>
            {/* ================= INSTRUMENT ================= */}
            <Section title="INSTRUMENT">
              <Row label="Code" value={data.data.instrument.code} />
              <Row label="Name" value={data.data.instrument.name} />
              <Row label="Segment" value={data.data.instrument.segment} />
              <Row label="Lot Size" value={data.data.instrument.lotSize} />
              <Row label="Min Quantity" value={data.data.instrument.minQty} />
              <Row label="Max Quantity" value={data.data.instrument.maxQty} />
              <Row label="Qty Precision" value={data.data.instrument.qtyPrecision} />
              <Row label="Price Precision" value={data.data.instrument.pricePrecision} />
              <Row label="Tick Size" value={data.data.instrument.tickSize} />
              <Row label="Spread" value={data.data.instrument.spread} />
              <Row label="Contract Size" value={data.data.instrument.contractSize} />
              <Row label="Swap Enabled" value={data.data.instrument.swapEnabled ? "Yes" : "No"} />
              <Row label="Swap Long" value={data.data.instrument.swapLong} />
              <Row label="Swap Short" value={data.data.instrument.swapShort} />
              <Row label="Active" value={data.data.instrument.isActive ? "Yes" : "No"} />
              <Row label="Tradeable" value={data.data.instrument.isTradeable ? "Yes" : "No"} />
            </Section>

            {/* ================= SWAP CHARGES ================= */}
            <Section title="SWAP CHARGES">
              {Object.keys(data.data.swapCharges || {}).length === 0 ? (
                <div className="text-[var(--text-muted)]">
                  No swap charges configured
                </div>
              ) : (
                Object.entries(data.data.swapCharges).map(([key, value]) => (
                  <Row key={key} label={key} value={String(value)} />
                ))
              )}
            </Section>

            {/* ================= MARKET SCHEDULE ================= */}
            <Section title="MARKET SCHEDULE">
              <Row label="Segment" value={data.data.marketSchedule.segment} />
              <Row label="Timezone" value={data.data.marketSchedule.timezone} />
              <Row label="Open Time" value={data.data.marketSchedule.openTime} />
              <Row label="Close Time" value={data.data.marketSchedule.closeTime} />

              <Row
                label="Weekly Off"
                value={
                  data.data.marketSchedule.weeklyOff?.length
                    ? data.data.marketSchedule.weeklyOff.join(", ")
                    : "None"
                }
              />

              <Row
                label="Holidays"
                value={
                  data.data.marketSchedule.holidays?.length
                    ? data.data.marketSchedule.holidays.join(", ")
                    : "None"
                }
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );

  /* ================= DESKTOP ================= */
  if (isDesktop) {
    return (
      <div className="absolute inset-0 z-[60] bg-[var(--bg-card)] mt-4">
        {content}
      </div>
    );
  }

  /* ================= MOBILE ================= */
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {content}
    </div>,
    document.body
  );
}

/* ================= UI HELPERS ================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-[var(--text-muted)] mb-3">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="flex justify-between border-b border-[var(--border-soft)] pb-2">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-medium text-[var(--text-main)] text-right break-words max-w-[55%]">
        {value}
      </span>
    </div>
  );
}
