"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { useHardwareStore } from "@/stores/hardware-store";
import { GpuSelector } from "@/components/gpu-selector";
import { TerminalAnimation } from "@/components/terminal-animation";
import { ArrowRight, Loader2 } from "lucide-react";

export function HeroSection() {
  const { t } = useTranslation();
  const { analyze } = useHardwareDetection();
  const status = useHardwareStore((s) => s.status);
  const detectedGpu = useHardwareStore((s) => s.input?.gpuName ?? "");
  const setManualGpu = useHardwareStore((s) => s.setManualGpu);

  const isDetecting = status === "detecting";
  const isDetected = status === "detected";

  const handleClick = async () => {
    await analyze();
  };

  return (
    <section className="flex flex-col items-center justify-start px-4 pt-20 text-center">
      {/* Title */}
      <h1
        className={`max-w-3xl font-bold tracking-tight transition-all duration-500 ${
          isDetected ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl md:text-6xl"
        }`}
      >
        {t("hero.title")}
      </h1>

      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {t("hero.subtitle")}
      </p>

      {/* CTA button — mechanical keycap style */}
      <div className="relative mt-12">
        {/* Ambient glow ring */}
        <div
          className="absolute -inset-4 rounded-[2.5rem] bg-primary/5 blur-xl"
          aria-hidden="true"
        />
        <button
          onClick={handleClick}
          disabled={isDetecting}
          className="group relative cursor-pointer select-none outline-none disabled:pointer-events-none"
        >
          {/*
            Keycap body — built with layered box-shadows:
            • outer-bottom: dark edge simulating the key switch housing
            • mid: the "side wall" of the keycap (visible bevel)
            • top-highlight: subtle light edge on the top surface
            • inner: subtle inset highlight for concave top illusion
          */}
          <span
            className={`
              relative flex items-center gap-3 rounded-2xl border-0 px-10 py-4
              text-lg font-semibold tracking-wide
              /* Keycap surface gradient */
              bg-gradient-to-b from-[#f0f0f0] via-[#e6e6e6] to-[#d4d4d4]
              text-slate-700
              /* Layered shadows = keycap depth */
              shadow-[0_6px_0_#b0b0b0,0_8px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]
              /* Smooth transitions for press */
              transition-all duration-100 ease-out
              /* Hover: lift slightly */
              group-hover:-translate-y-0.5
              group-hover:shadow-[0_8px_0_#b0b0b0,0_12px_20px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)]
              /* Active: press down — key sinks, shadows compress */
              active:translate-y-1
              active:shadow-[0_2px_0_#b0b0b0,0_3px_6px_rgba(0,0,0,0.15)]
              active:duration-75
              /* Focus */
              focus-visible:ring-4 focus-visible:ring-primary/40
              /* Disabled */
              disabled:opacity-50
              /* Dark mode */
              dark:bg-gradient-to-b dark:from-[#3a3a3a] dark:via-[#333] dark:to-[#2a2a2a]
              dark:text-slate-200
              dark:shadow-[0_6px_0_#555,0_8px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.15)]
              dark:group-hover:shadow-[0_8px_0_#555,0_12px_20px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.15)]
              dark:active:shadow-[0_2px_0_#555,0_3px_6px_rgba(0,0,0,0.3)]
            `}
          >
            {/* Top surface highlight — subtle sheen */}
            <span
              className="pointer-events-none absolute inset-x-2 top-1 h-[30%] rounded-full bg-gradient-to-b from-white/40 to-transparent dark:from-white/10"
              aria-hidden="true"
            />

            {isDetecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("hero.detecting")}</span>
              </>
            ) : (
              <>
                <span>{isDetected ? t("hero.re_scan") : t("hero.button")}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </span>
        </button>
      </div>

      {/* GPU selector — appears after detection */}
      {isDetected && detectedGpu && (
        <div className="mt-4">
          <GpuSelector detectedGpu={detectedGpu} onChange={setManualGpu} />
        </div>
      )}

      {/* Terminal animation */}
      <div className="mt-12 mb-24 w-full">
        <TerminalAnimation
          gpu={detectedGpu || undefined}
          vram={0}
          modelCount={50}
        />
      </div>
    </section>
  );
}
