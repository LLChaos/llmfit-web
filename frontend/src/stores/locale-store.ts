"use client";

import { create } from "zustand";

type Locale = "zh" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "zh",
  setLocale: (locale: Locale) => set({ locale }),
}));
