"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp, BackButtonListenerEvent } from "@capacitor/app";

export default function BackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handler: any;

    const setupListener = async () => {
      handler = await CapacitorApp.addListener(
        "backButton",
        (event: BackButtonListenerEvent) => {
          if (pathname?.startsWith("/trade") && pathname !== "/trade/quotes") {
            router.replace("/trade/quotes");
            return;
          }

          if (pathname?.startsWith("/dashboard") && pathname !== "/dashboard") {
            router.replace("/dashboard");
            return;
          }

          if (event.canGoBack) {
            window.history.back();
          } else {
            CapacitorApp.exitApp();
          }
        }
      );
    };

    setupListener();

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, [pathname, router]);

  return null;
}
