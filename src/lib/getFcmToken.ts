import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export const getFcmToken = async (): Promise<string | null> => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    
    return token ?? null;
  } catch (error) {
    console.error("FCM error:", error);
    return null;
  }
};
