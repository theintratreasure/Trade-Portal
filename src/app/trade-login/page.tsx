"use client";

import dynamic from "next/dynamic";

const TradeLoginContent = dynamic(() => import("./TradeLoginContent"), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return <TradeLoginContent />;
}
