export async function getFcmToken(): Promise<string | null> {
  try {
    if (!("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    
    return localStorage.getItem("fcmToken");
  } catch {
    return null;
  }
}
