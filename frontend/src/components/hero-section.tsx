"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { useHardwareStore } from "@/stores/hardware-store";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function HeroSection() {
  const { t } = useTranslation();
  const { analyze } = useHardwareDetection();
  const status = useHardwareStore((s) => s.status);

  const isDetecting = status === "detecting";

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Language switcher — top right */}
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      {/* Hero content */}
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        {t("hero.title")}
      </h1>

      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        {t("hero.subtitle")}
      </p>

      <Button
        size="lg"
        className="mt-10 h-14 px-10 text-lg"
        onClick={analyze}
        disabled={isDetecting}
      >
        {isDetecting ? t("hero.detecting") : t("hero.button")}
      </Button>
    </section>
  );
}
