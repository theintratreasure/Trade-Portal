"use client";

import { useActivePaymentMethods } from "@/hooks/useActivePaymentMethods";
import PaymentMethodCard from "../../components/payments/PaymentMethodCard";
import MobileBottomBar from "../../components/payments/MobileBottomBar";
import GlobalLoader from "@/app/components/ui/GlobalLoader";
import DepositForm from "../../components/payments/DepositForm";
import TipBanner from "@/app/components/ui/TipBanner";
import DepositHistory from "../../components/payments/DepositHistory";

export default function DepositPage() {
  const { data, isLoading } = useActivePaymentMethods();

  return (
    <div className="space-y-6 p-4 md:p-6 pb-28 md:pb-6">
      <h1 className="text-2xl font-semibold">Deposit funds</h1>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <GlobalLoader />
        </div>
      ) : (
        <div className="space-y-4">
          {data?.map((method) => (
            <PaymentMethodCard key={method._id} method={method} />
          ))}
        </div>
      )}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  
  {/* LEFT SIDE — FORM */}
  <div className="w-full mt-4">
    <DepositForm />
  </div>

  {/* RIGHT SIDE — TIPS */}
  <div className="w-full space-y-3 mt-4">
    <TipBanner
      title="Processing Time"
      message="INR deposits may take up to 6 hours. USD and Crypto deposits are usually credited within 1 hour."
    />

    <TipBanner
      title="First Deposit Rule"
      message="Your first deposit must meet the minimum deposit requirement of your selected account plan."
    />

    <TipBanner
      title="Payment Proof"
      message="Upload a clear screenshot showing amount, date, time, and transaction ID. Incorrect proofs may lead to rejection."
    />
  </div>

</div>
      <div className="mt-8">
  <h2 className="text-lg font-semibold">Deposit History</h2>
  <DepositHistory />
</div>

      {/* 👇 ALWAYS BOTTOM, NEVER OVERLAP */}
      <MobileBottomBar />
    </div>
  );
}
