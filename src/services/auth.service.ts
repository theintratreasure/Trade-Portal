import api from "@/api/axios";
import axios from "axios";

/* ---------- TYPES ---------- */

export type SignupPayload = {
  name: string;
  email: string;
  phone: string; // +919876543789
  password: string;
  confirmPassword: string;
  referral_code?: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  fcmToken?: string | null;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type LogoutPayload = {
  refreshToken: string;
};

export type VerifyEmailPayload = {
  token: string;
};
/* ---------- SERVICE ---------- */

export const authService = {
  signup: async (payload: any) => {
    const { data } = await api.post("/auth/signup", payload);
    return data;
  },

  verifySignupOtp: async (payload: any) => {
    const { data } = await api.post("/auth/verify-otp", payload);
    return data;
  },

  login: async (payload: LoginPayload) => {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const { data } = await api.post(
      "/auth/forgot-password",
      payload
    );
    return data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const { data } = await api.post(
      "/auth/reset-password",
      payload
    );
    return data;
  },

  refreshToken: async (payload: RefreshTokenPayload) => {
    const { data } = await api.post(
      "/auth/refresh-token",
      payload
    );
    return data;
  },

  logout: async (payload: LogoutPayload) => {
    const { data } = await api.post(
      `/auth/logout`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          // ❌ NO Authorization header
        },
      }
    );

    return data;
  },

  verifyEmail: async (payload: VerifyEmailPayload) => {
    const { data } = await api.post("/auth/verify-email", payload);
    return data;
  },
};
