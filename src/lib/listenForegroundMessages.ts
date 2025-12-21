import { getMessaging, onMessage } from "firebase/messaging";
import { app } from "./firebase";

export const listenForegroundMessages = () => {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    console.log("🔥 FCM RECEIVED:", payload);

    const title = payload.data?.title || "Notification";
    const body = payload.data?.body || "";

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icon.png",
      });
    }

    // OPTIONAL: KYC specific handling
    if (payload.data?.type === "KYC") {
      console.log("KYC STATUS:", payload.data.status);
    }
  });
};
