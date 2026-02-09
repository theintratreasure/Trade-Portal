import { Suspense } from "react";
import WithdrawPage from "./WithdrawContent";

export default function WithDraw() {
  return (
    <Suspense fallback={null}>
      <WithdrawPage />
    </Suspense>
  );
}
