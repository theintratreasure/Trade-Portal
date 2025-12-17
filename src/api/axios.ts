import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  const isAuthRoute =
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/signup") ||
    config.url?.includes("/auth/verify-otp") ||
    config.url?.includes("/auth/verify-email") ||
    config.url?.includes("/auth/forgot-password") ||
    config.url?.includes("/auth/reset-password") ||
    config.url?.includes("/auth/refresh-token");

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
