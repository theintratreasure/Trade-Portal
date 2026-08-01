"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App as CapacitorApp, BackButtonListenerEvent } from "@capacitor/app";

export default function BackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handler: PluginListenerHandle | undefined;

    const setupListener = async () => {
      handler = await CapacitorApp.addListener(
        "backButton",
        (event: BackButtonListenerEvent) => {
          if (pathname?.startsWith("/trade-login")) {
            const tradeAuthState =
              typeof window !== "undefined"
                ? localStorage.getItem("trade-auth-state")
                : null;
            if (tradeAuthState === "trade-logged-out") {
              router.replace("/");
              return;
            }
          }

          if (pathname?.startsWith("/trade") && pathname !== "/trade/quotes") {
            router.replace("/trade/quotes");
            return;
          }

          if (pathname?.startsWith("/dashboard") && pathname !== "/dashboard") {
            router.replace("/dashboard");
            return;
          }

          if (event.canGoBack && window.history.length > 1) {
            window.history.back();
          } else {
            router.replace("/");
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
