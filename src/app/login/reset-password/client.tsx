"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      router.replace(`/login?token=${token}`);
    } else {
      router.replace("/login");
    }
  }, [params, router]);

  return null;
}
