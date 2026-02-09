import { Suspense } from "react";
import DepositPage from "./DepositContent";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DepositPage />
    </Suspense>
  );
}
