import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import FcmRegister from "./components/FcmRegister";
import InitNotifications from "./components/InitNotifications";
import { Roboto } from "next/font/google";
import InstallPrompt from "./components/InstallPrompt";
import SWRegister from "./sw-register";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary";
import BackHandler from "./components/BackHandler";
import CapacitorStatusBar from "./components/CapacitorStatusBar";
import PushRegister from "./components/PushRegister";
import NetworkStatusGuard from "./components/NetworkStatusGuard";

const mtFont = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://user.fptradess.com"),
  title: "FP Trades",
  description: "Advanced Trading Platform for FP Tokens",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/fp-logo.png?v=fp-trades-20260730-2", type: "image/png", sizes: "1024x1024" }],
    shortcut: ["/fp-logo.png?v=fp-trades-20260730-2"],
    apple: [{ url: "/fp-logo.png?v=fp-trades-20260730-2", type: "image/png", sizes: "1024x1024" }],
  },
  openGraph: {
    title: "FP Trades",
    description: "Advanced Trading Platform for FP Tokens",
    url: "https://user.fptradess.com",
    siteName: "FP Trades",
    type: "website",
    images: [
      {
        url: "/fp-logo.png?v=fp-trades-20260730-2",
        width: 1024,
        height: 1024,
        alt: "FP Trades logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FP Trades",
    description: "Advanced Trading Platform for FP Tokens",
    images: ["/fp-logo.png?v=fp-trades-20260730-2"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <link rel="manifest" href="/manifest.json" /> */}
      {/* <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
      {/* <meta name="apple-mobile-web-app-capable" content="yes" /> */}
      {/* <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> */}

      <head className={mtFont.className}>
        <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="Surrogate-Control" content="no-store" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/fp-logo.png?v=fp-trades-20260730-2" type="image/png" />

        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FP Trades" />
        <link rel="apple-touch-icon" href="/fp-logo.png?v=fp-trades-20260730-2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />


        <link rel="apple-touch-icon" href="/fp-logo.png?v=fp-trades-20260730-2" />
        {/* 🔥 THEME INIT SCRIPT (RUNS BEFORE REACT) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
            `,
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased mt-font`}
      >
        <AppProviders>
        <NetworkStatusGuard />
        <CapacitorStatusBar />
        {/* <PushRegister /> */}
        <InstallPrompt />
        <BackHandler />
        {/* <SWRegister /> */}
          <ChunkErrorBoundary/>
          <FcmRegister />
          <InitNotifications />
          {children}</AppProviders>
      </body>
    </html>
  );
}
