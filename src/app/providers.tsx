"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
   APP PROVIDERS (FINAL)
========================= */

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  // 🔥 Apply theme BEFORE paint (important for not-found, auth pages)
  useLayoutEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as Theme | null) ?? "light";

    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme =
      theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider
          value={{ theme, toggleTheme }}
        >
          {children}
        </ThemeContext.Provider>
      </QueryClientProvider>
    </Provider>
  );
}

/* =========================
   THEME HOOK
========================= */

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      "useTheme must be used inside AppProviders"
    );
  }
  return ctx;
}
