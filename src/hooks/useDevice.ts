import { useMutation } from "@tanstack/react-query";
import { saveDeviceTokenService } from "@/services/device.service";

export const useSaveDeviceToken = () => {
  return useMutation({
    mutationFn: ({ fcmToken, platform }: { fcmToken: string; platform: string }) =>
      saveDeviceTokenService(fcmToken, platform),
  });
};
