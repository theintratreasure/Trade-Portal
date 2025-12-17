"use client";

import { useEffect } from "react";

export default function FcmRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("✅ FCM Service Worker registered:", registration.scope);
        })
        .catch((err) => {
          console.error("❌ FCM Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
