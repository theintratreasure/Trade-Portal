import withPWAInit from "next-pwa";
import type { FallbackRoutes } from "next-pwa";

const isCapacitor = process.env.NEXT_PUBLIC_CAPACITOR === "true";
const pwaInDev = process.env.NEXT_PUBLIC_PWA_DEV === "true";

const withPWA = withPWAInit({
  dest: "public",
  disable: isCapacitor || (process.env.NODE_ENV === "development" && !pwaInDev),
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  } as FallbackRoutes,
});

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default withPWA(nextConfig);
