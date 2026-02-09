import api from "@/api/axios";

export const saveDeviceTokenService = async (fcmToken: string, platform: string) => {
  const res = await api.post("/device/save-device-token", {
    fcmToken,
    platform,
  });

  return res.data;
};
