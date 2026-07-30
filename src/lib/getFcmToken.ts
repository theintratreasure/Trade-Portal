import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./firebase";
import { Capacitor } from "@capacitor/core";

export const getFcmToken = async (): Promise<string | null> => {
  // ✅ SSR safety
  if (typeof window === "undefined") return null;

  // ✅ Disable inside Capacitor Android/iOS app
  if (Capacitor.isNativePlatform()) {
    console.log("FCM skipped: running in native app");
    return null;
  }

  // ✅ Browser support check
  if (!("Notification" in window)) return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!(await isSupported())) return null;

  try {
    // ✅ Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token ?? null;
  } catch (error) {
    console.log("FCM token error:", error);
    return null;
  }
};
