"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PushRegister() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPush = async () => {
      const permStatus = await PushNotifications.requestPermissions();
      console.log("Permission status:", permStatus);

      if (permStatus.receive === "granted") {
        await PushNotifications.register();
      } else {
        alert("Notification permission denied");
      }
    };

    PushNotifications.addListener("registration", token => {
      alert("FCM TOKEN: " + token.value);
      console.log("FCM Token:", token.value);
    });

    PushNotifications.addListener("registrationError", err => {
      alert("Registration error: " + JSON.stringify(err));
      console.error("Registration error:", err);
    });

    PushNotifications.addListener("pushNotificationReceived", notification => {
      alert("Push received: " + JSON.stringify(notification));
    });

    initPush();
  }, []);

  return null;
}
