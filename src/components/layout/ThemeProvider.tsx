"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
interface ThemeCtx {
  theme:         Theme;
  resolvedTheme: "light" | "dark";
  setTheme:      (t: Theme) => void;
  toggle:        () => void;
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
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,         setThemeState ] = useState<Theme>("system");
  const [resolvedTheme, setResolved   ] = useState<"light" | "dark">("light");

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const saved = (localStorage.getItem("finflow-theme") as Theme) ?? "system";
    const r = resolve(saved);
    setThemeState(saved);
    setResolved(r);
    applyTheme(r);
  }, []);

  // Re-apply whenever theme state changes
  useEffect(() => {
    const r = resolve(theme);
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
