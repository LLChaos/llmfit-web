"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { useHardwareStore } from "@/stores/hardware-store";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

interface HeroSectionProps {
  onDetected?: () => void;
}

export function HeroSection({ onDetected }: HeroSectionProps) {
  const { t } = useTranslation();
  const { analyze } = useHardwareDetection();
  const status = useHardwareStore((s) => s.status);

  const isDetecting = status === "detecting";
  const isDetected = status === "detected";

  const handleClick = async () => {
    await analyze();
    onDetected?.();
  };

  return (
    <section
      className={`relative flex flex-col items-center justify-center px-4 text-center transition-all duration-500 ${
        isDetected ? "min-h-0 py-16" : "min-h-screen"
      }`}
    >
      {/* Language switcher — top right */}
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      {/* Hero content */}
      <h1
        className={`max-w-3xl font-bold tracking-tight transition-all ${
          isDetected
            ? "text-2xl sm:text-3xl"
            : "text-4xl sm:text-5xl md:text-6xl"
        }`}
      >
        {t("hero.title")}
      </h1>

      {!isDetected && (
        <>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <Button
            size="lg"
            className="mt-10 h-14 px-10 text-lg"
            onClick={handleClick}
            disabled={isDetecting}
          >
            {isDetecting ? t("hero.detecting") : t("hero.button")}
          </Button>
        </>
      )}

      {isDetected && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={handleClick}
          disabled={isDetecting}
        >
          {isDetecting ? t("hero.detecting") : "Re-scan Hardware"}
        </Button>
      )}
    </section>
  );
}
