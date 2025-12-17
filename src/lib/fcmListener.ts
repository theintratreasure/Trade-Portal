import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

export const initFcmListener = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("🔥 FOREGROUND FCM RECEIVED:", payload);

    // Optional browser notification (foreground)
    if (Notification.permission === "granted") {
      new Notification(
        payload.notification?.title || "Notification",
        {
          body: payload.notification?.body || "",
          icon: "/icon.png",
        }
      );
    }
  });
};
