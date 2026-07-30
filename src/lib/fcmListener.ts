import { getMessaging, isSupported, onMessage } from "firebase/messaging";
import { app } from "./firebase";

export const initFcmListener = async () => {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  try {
    if (!(await isSupported())) return;

    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      console.log("🔥 FOREGROUND FCM RECEIVED:", payload);

      if (Notification.permission === "granted") {
        new Notification(
          payload.notification?.title || "Notification",
          {
            body: payload.notification?.body || "",
            icon: "/fp-logo.png?v=fp-trades-20260730",
          }
        );
      }
    });
  } catch (err) {
    console.error("FCM listener error:", err);
  }
};
