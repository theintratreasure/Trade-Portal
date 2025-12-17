import { Suspense } from "react";
import LoginPage from "../components/Login/Login";

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
