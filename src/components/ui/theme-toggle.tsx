"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { IconButton } from "./icon-button";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  window.addEventListener("theme-change", callback);
  return () => {
    mediaQuery.removeEventListener("change", callback);
    window.removeEventListener("theme-change", callback);
  };
}

function getSnapshot(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Initialize theme from saved preference on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    window.dispatchEvent(new Event("theme-change"));
  }, []);

  const toggleTheme = () => {
    const currentlyDark = document.documentElement.classList.contains("dark");
    const nextDark = !currentlyDark;

    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }

    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <IconButton
      size="sm"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={className}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 hover:text-[var(--color-brand-navy)] transition-colors" />
      )}
    </IconButton>
  );
}
