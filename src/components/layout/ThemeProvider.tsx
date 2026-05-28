"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
interface ThemeCtx {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

function applyTheme(resolved: "light" | "dark") {
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage synchronously on client to avoid hydration effects
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("finflow-theme") as Theme) ?? "system";
    } catch {
      return "system";
    }
  });
  const [resolvedTheme, setResolved] = useState<"light" | "dark">(() => {
    try {
      const saved =
        (localStorage.getItem("finflow-theme") as Theme) ?? "system";
      return resolve(saved);
    } catch {
      return "light";
    }
  });
  // Apply initial theme and re-apply when resolvedTheme changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Re-apply whenever theme state changes
  useEffect(() => {
    const r = resolve(theme);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolved(r);
    applyTheme(r);
  }, [theme]);

  // Follow system preference when set to "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const r = mq.matches ? "dark" : "light";
        setResolved(r);
        applyTheme(r);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("finflow-theme", t);
  }

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
