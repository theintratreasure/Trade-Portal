"use client";

import { useEffect } from "react";
import { getFcmToken } from "@/lib/getFcmToken";
import { listenForegroundMessages } from "@/lib/listenForegroundMessages";

export default function InitNotifications() {
  useEffect(() => {
    // 1️⃣ Get token & save to backend
    getFcmToken().then((token) => {
      if (!token) return;

      fetch("/api/v1/user/save-fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    });

    // 2️⃣ Start foreground listener
    listenForegroundMessages();
  }, []);

  return null;
}
