"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PushRegister() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      alert("❌ Not running in native app");
      return;
    }

    alert("✅ Running inside native app");

    const initPush = async () => {
      try {
        // Create Android channel
        await PushNotifications.createChannel({
          id: "default",
          name: "Default",
          importance: 5,
          visibility: 1,
          sound: "default",
        });

        alert("✅ Notification channel created");

        const permStatus = await PushNotifications.requestPermissions();
        alert("🔔 Permission: " + permStatus.receive);

        if (permStatus.receive === "granted") {
          await PushNotifications.register();
          alert("📡 Register called");
        } else {
          alert("❌ Permission denied");
        }
      } catch (err) {
        alert("Init error: " + JSON.stringify(err));
      }
    };

    // 🔑 When token generated
    PushNotifications.addListener("registration", (token) => {
      alert("🔥 FCM REGISTERED\n\nTOKEN:\n\n" + token.value);
    });

    // ❌ If registration fails
    PushNotifications.addListener("registrationError", (error) => {
      alert("❌ Registration error:\n" + JSON.stringify(error));
    });

    // 📩 When push received (foreground)
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      alert("📩 PUSH RECEIVED:\n\n" + JSON.stringify(notification, null, 2));
    });

    // 👆 When notification tapped
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        alert("👉 Notification tapped:\n\n" + JSON.stringify(action, null, 2));
      }
    );

    initPush();
  }, []);

  return null;
}
