"use client";

import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      aria-label="Switch language"
    >
      {locale === "zh" ? "EN" : "中文"}
    </Button>
  );
}
