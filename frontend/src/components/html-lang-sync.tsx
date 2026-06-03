"use client";

import { useLocaleStore } from "@/stores/locale-store";
import { useEffect } from "react";

/**
 * Syncs the <html lang> attribute with the current locale from the Zustand store.
 * Renders nothing — purely a side-effect component.
 */
export function HtmlLangSync() {
  const locale = useLocaleStore((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
