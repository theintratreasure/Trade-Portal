"use client";

import { useMutation } from "@tanstack/react-query";
import {
  authService,
  SignupPayload,
  VerifyOtpPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
  LogoutPayload,
} from "@/services/auth.service";

export const useSignup = () =>
  useMutation({
    mutationFn: (payload: SignupPayload) =>
      authService.signup(payload),
  });

export const useVerifySignupOtp = () =>
  useMutation({
    mutationFn: (payload: VerifyOtpPayload) =>
      authService.verifySignupOtp(payload),
  });

/* ---------- LOGIN ---------- */
export const useLogin = () =>
  useMutation({
    mutationFn: (payload: LoginPayload) =>
      authService.login(payload),
  });

/* ---------- FORGOT PASSWORD ---------- */
export const useForgotPassword = () =>
  useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authService.forgotPassword(payload),
  });

/* ---------- RESET PASSWORD ---------- */
export const useResetPassword = () =>
  useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authService.resetPassword(payload),
  });

/* ---------- REFRESH TOKEN ---------- */
export const useRefreshToken = () =>
  useMutation({
    mutationFn: (payload: RefreshTokenPayload) =>
      authService.refreshToken(payload),
  });

/* ---------- LOGOUT ---------- */
export const useLogout = () =>
  useMutation({
    mutationFn: (payload: LogoutPayload) =>
      authService.logout(payload),
  });

export const useVerifyEmail = () =>
  useMutation({
    mutationFn: (payload: { token: string }) =>
      authService.verifyEmail(payload),
  });
