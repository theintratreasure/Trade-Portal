"use client";

import { useEffect, useState } from "react";

let deferredPrompt: any = null;

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua);
  // ensure it's Safari (not Chrome/Firefox WebView etc)
  const safari = /Version\/[\d.]+.*Safari/.test(ua);
  // avoid in-app browsers (Twitter, FB, IG etc)
  const inapp = /FBAN|FBAV|Instagram|Twitter|Line|LinkedIn/.test(ua);
  return iOS && safari && !inapp;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const iosSafari = isIosSafari();
    const standalone = isStandalone();

    if (standalone || localStorage.getItem("pwa-dismissed") === "true") return;

    setPlatform(iosSafari ? "ios" : isIos() ? "ios" : "android");

    // Android: listen for native beforeinstallprompt
    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      // show if not installed and not dismissed
      if (!isStandalone() && localStorage.getItem("pwa-dismissed") !== "true") {
        setPlatform("android");
        setShow(true);
      }
    });

    // iOS Safari: show custom instructions (no native prompt)
    if (iosSafari && localStorage.getItem("pwa-dismissed") !== "true") {
      // give the page some time to feel like user landed
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const close = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setShow(false);
  };

  const handleInstall = async () => {
    if (platform === "android") {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      setShow(false);
    } else {
      // iOS case: we only show help text — nothing to `install` programmatically
      // Consider showing a visual guide or dismiss
      // (we keep this button but it only closes the modal)
      setShow(false);
    }
  };

  if (!show) return null;

return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
    <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-soft)] shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-6 space-y-5 transform transition-all duration-300 scale-100">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[var(--text-main)]">
            Install FP Trades
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {platform === "android"
              ? "Install the app for faster access and a smoother trading experience."
              : "Add this app to your iPhone Home Screen for quick access."}
          </p>
        </div>

        <button
          onClick={close}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-[var(--text-muted)]"
        >
          ✕
        </button>
      </div>

      {/* iOS Instructions */}
      {platform === "ios" ? (
        <div className="space-y-3 text-sm">

          <div className="flex items-center gap-3 bg-[var(--bg-glass)] p-3 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
              1
            </div>
            <div>Tap the <strong>Share</strong> button in Safari</div>
          </div>

          <div className="flex items-center gap-3 bg-[var(--bg-glass)] p-3 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold">
              2
            </div>
            <div>Select <strong>Add to Home Screen</strong></div>
          </div>

          <div className="flex items-center gap-3 bg-[var(--bg-glass)] p-3 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold">
              3
            </div>
            <div>Tap <strong>Add</strong> to confirm</div>
          </div>

          <button
            onClick={close}
            className="w-full mt-2 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold transition hover:opacity-90"
          >
            Got it
          </button>

        </div>
      ) : (
        /* Android UI */
        <div className="space-y-4">
          <div className="text-sm text-[var(--text-muted)]">
            Install this app on your device for the best experience.
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold transition hover:scale-[1.02]"
            >
              Install
            </button>

            <button
              onClick={close}
              className="flex-1 py-3 rounded-xl border border-[var(--border-soft)] text-[var(--text-main)] font-medium transition hover:bg-white/5"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

}
