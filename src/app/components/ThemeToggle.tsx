"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/providers";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-[var(--bg-glass)] transition"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-sm">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
