"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp, BackButtonListenerEvent } from "@capacitor/app";

export default function BackHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handler: any;

    const setupListener = async () => {
      handler = await CapacitorApp.addListener(
        "backButton",
        (event: BackButtonListenerEvent) => {
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
  }, []);

  return null;
}
