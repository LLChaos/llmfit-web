"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { useHardwareStore } from "@/stores/hardware-store";
import { ArrowRight, Loader2 } from "lucide-react";

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

          {/* Hero CTA button — gradient + glow + animated ring */}
          <div className="relative mt-12">
            {/* Pulsing outer ring to draw attention */}
            <span
              className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75"
              style={{ animationDuration: "3s" }}
              aria-hidden="true"
            />
            <button
              onClick={handleClick}
              disabled={isDetecting}
              className="group relative inline-flex h-16 cursor-pointer items-center gap-3 overflow-hidden rounded-full border-0 bg-gradient-to-r from-primary via-primary to-violet-500 px-10 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            >
              {/* Shine overlay on hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              {isDetecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t("hero.detecting")}</span>
                </>
              ) : (
                <>
                  <span>{t("hero.button")}</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {isDetected && (
        <div className="relative mt-4">
          <button
            onClick={handleClick}
            disabled={isDetecting}
            className="group relative inline-flex h-10 cursor-pointer items-center gap-2 overflow-hidden rounded-full border-0 bg-gradient-to-r from-primary via-primary to-violet-500 px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("hero.detecting")}</span>
              </>
            ) : (
              <>
                <span>{t("hero.re_scan")}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
