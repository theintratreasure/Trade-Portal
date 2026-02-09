"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PushRegister() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPush = async () => {
      // 🔥 Create Android notification channel (important for Android 8+)
      await PushNotifications.createChannel({
        id: "default",
        name: "Default",
        importance: 5,
        visibility: 1,
        sound: "default"
      });

      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === "granted") {
        await PushNotifications.register();
      }
    };

    PushNotifications.addListener("registration", (token) => {
      console.log("FCM Token:", token.value);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push received:", notification);
    });

    initPush();
  }, []);

  return null;
}
