"use client";

import { create } from "zustand";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "llmfit-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
  return "system";
}

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = readStoredTheme();
  const resolved = resolveTheme(initial);

  // Apply on creation (client-side only)
  if (typeof window !== "undefined") {
    applyThemeClass(resolved);
  }

  // Listen for system preference changes
  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        const current = get().theme;
        if (current === "system") {
          const newResolved = e.matches ? "dark" : "light";
          applyThemeClass(newResolved);
          set({ resolved: newResolved });
        }
      });
  }

  return {
    theme: initial,
    resolved,
    setTheme: (theme: Theme) => {
      const resolved = resolveTheme(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore
      }
      applyThemeClass(resolved);
      set({ theme, resolved });
    },
    toggle: () => {
      const { resolved } = get();
      // Toggle between light and dark (leaves "system" if currently system)
      const nextResolved = resolved === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, nextResolved);
      } catch {
        // ignore
      }
      applyThemeClass(nextResolved);
      set({ theme: nextResolved, resolved: nextResolved });
    },
  };
});
