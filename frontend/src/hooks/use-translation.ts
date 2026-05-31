"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import zh from "@/lib/i18n/zh.json";
import en from "@/lib/i18n/en.json";

const dictionaries: Record<string, Record<string, string>> = { zh, en };

export type TranslationKey = keyof typeof zh;

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = dictionaries[locale] ?? dictionaries.zh;
      return dict[key] ?? key;
    },
    [locale]
  );

  return { t, locale };
}
