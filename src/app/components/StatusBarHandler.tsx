"use client";

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function StatusBarHandler() {
  useEffect(() => {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setStyle({ style: Style.Dark });
  }, []);

  return null;
}
