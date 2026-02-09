"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useSaveDeviceToken } from "@/hooks/useDevice";

export default function PushRegister() {
  const saveDevice = useSaveDeviceToken();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPush = async () => {
      await PushNotifications.createChannel({
        id: "default",
        name: "Default",
        importance: 5,
        visibility: 1,
        sound: "default",
      });

      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === "granted") {
        await PushNotifications.register();
      }
    };

    PushNotifications.addListener("registration", (token) => {
      alert("FCM Registered: " + token.value);

      saveDevice.mutate({
        fcmToken: token.value,
        platform: "android",
      });
    });

    initPush();
  }, []);

  return null;
}
