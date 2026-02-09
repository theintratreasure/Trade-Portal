"use client";

import TipBanner from "@/app/components/ui/TipBanner";
import WithdrawForm from "../../components/payments/WithdrawForm";
import WithdrawHistory from "../../components/payments/WithdrawHistory";
import MobileBottomBar from "../../components/payments/MobileBottomBar";

export default function WithdrawPage() {
  return (
    <div className="bg-[var(--bg-main)] min-h-screen space-y-6 p-4 sm:p-6 pb-28 sm:pb-6">
      <h1 className="text-xl sm:text-2xl font-semibold">
        Withdraw Funds
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WithdrawForm />

        <div className="space-y-4">
          <TipBanner
            title="Processing Time"
            message="Withdrawals are processed within 24 hours depending on the selected method."
          />
          <TipBanner
            title="Minimum Withdrawal"
            message="Make sure your balance meets the minimum withdrawal limit."
          />
          <TipBanner
            title="Important"
            message="Incorrect payout details may result in rejection."
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mt-6">
          Withdrawal History
        </h2>
        <WithdrawHistory />
      </div>

      <MobileBottomBar />
    </div>
  );
}
