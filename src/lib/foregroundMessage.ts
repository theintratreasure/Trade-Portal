import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

export const listenForegroundMessages = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
  console.log("🔥 FOREGROUND FCM RECEIVED:", payload);

  new Notification(payload.data?.title || "Notification", {
    body: payload.data?.body || "",
    icon: "/icon.png",
  });
});
};
