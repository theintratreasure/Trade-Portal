import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  UpdateProfilePayload,
  UserProfile,
} from "@/services/user/user.service";

/* ================= GET PROFILE ================= */

export const useUserMe = () =>
  useQuery<UserProfile>({
    queryKey: ["user-me"],
    queryFn: userService.getMe,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

/* ================= UPDATE PROFILE ================= */

export const useUpdateProfile = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      userService.updateMe(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};

/* ================= RESEND VERIFY EMAIL ================= */

export const useResendVerifyEmail = () =>
  useMutation({
    mutationFn: (email: string) => userService.resendVerifyEmail(email),
  });

  export function useAuthGuard() {
  return useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    retry: false,        // ❌ retry nahi
    staleTime: 0,        // ❌ cache nahi
    refetchOnWindowFocus: false,
  });
}