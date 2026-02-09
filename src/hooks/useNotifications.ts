import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/services/notification.service";

export const useNotifications = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: () => getNotifications(page, limit),
  });
};
