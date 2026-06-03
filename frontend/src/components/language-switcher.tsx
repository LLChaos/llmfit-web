"use client";

import { useLocaleStore } from "@/stores/locale-store";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const isZh = locale === "zh";

  return (
    <div
      role="radiogroup"
      aria-label={t("lang.switch")}
      className="relative flex h-8 rounded-full bg-muted p-0.5"
    >
      {/* Sliding indicator */}
      <span
        className={cn(
          "absolute top-0.5 h-7 w-11 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out dark:ring-white/10",
          isZh ? "translate-x-0" : "translate-x-11"
        )}
        aria-hidden="true"
      />

      {/* ZH option */}
      <button
        role="radio"
        aria-checked={isZh}
        aria-label={t("lang.zh")}
        onClick={() => setLocale("zh")}
        className={cn(
          "relative z-10 flex h-7 w-11 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors duration-200",
          isZh ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t("lang.zh")}
      </button>

      {/* EN option */}
      <button
        role="radio"
        aria-checked={!isZh}
        aria-label={t("lang.en")}
        onClick={() => setLocale("en")}
        className={cn(
          "relative z-10 flex h-7 w-11 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors duration-200",
          !isZh ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
