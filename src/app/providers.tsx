"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

const queryClient = new QueryClient();

/* =========================
   THEME CONTEXT
========================= */

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

/* =========================
   APP PROVIDERS
========================= */

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    const saved =
      (localStorage.getItem("theme") as Theme) ?? "light";

    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.toggle(
      "dark",
      t === "dark"
    );
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

/* =========================
   THEME HOOK
========================= */

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside AppProviders");
  }
  return ctx;
}
