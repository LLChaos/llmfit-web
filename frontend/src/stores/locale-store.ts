"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Locale = "zh" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "zh",
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: "llmfit-locale",
    }
  )
);
