"use client";

import PaymentTabs from "./PaymentTabs";

export default function MobileBottomBar() {
  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-40
        md:hidden
        border-t border-[var(--border-soft)]
        bg-[var(--bg-main)]
        px-2 min-[360px]:px-4 py-3
        safe-area-bottom
      "
    >
      <PaymentTabs />
    </div>
  );
}
