import api from "@/api/axios";

export const notificationService = {
  saveFcmToken: async (token: string) => {
    const res = await api.post("/user/save-fcm-token", {
      token,
    });
    return res.data;
  },
};
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface NotificationResponse {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getNotifications = async (
  page: number,
  limit: number
): Promise<NotificationResponse> => {
  const accessToken = localStorage.getItem("accessToken");

  const res = await api.get(
    `/notification?page=${page}&limit=${limit}`,
  );

  return res.data;
};
