"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Locale = "zh" | "en";

interface LocaleState {
  locale: Locale;
  _hasHydrated: boolean;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "zh",
      _hasHydrated: false,
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: "llmfit-locale",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
