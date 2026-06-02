"use client";

import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHardwareStore } from "@/stores/hardware-store";
import { cn } from "@/lib/utils";
import type { HardwareInfo } from "@/types/hardware";
import { Monitor, Cpu, HardDrive, Microchip, Zap, Layers } from "lucide-react";

const TIER_KEY: Record<string, string> = {
  entry: "hardware.tier.entry",
  mid: "hardware.tier.mid",
  high: "hardware.tier.high",
  enthusiast: "hardware.tier.enthusiast",
};

interface HardwareCardProps {
  hardware: HardwareInfo | null;
  isLoading: boolean;
}

export function HardwareCard({ hardware, isLoading }: HardwareCardProps) {
  const { t } = useTranslation();

  // Frontend's effective GPU name always wins — it's what the browser
  // actually detected (or what the user manually selected). The API
  // enriches with VRAM / tier but may fuzzy-match to a shorter name.
  const detectedInput = useHardwareStore((s) => s.input);
  const manualGpu = useHardwareStore((s) => s.manualGpu);
  const frontendGpu = manualGpu || detectedInput?.gpuName || "";

  const display: HardwareInfo | null = hardware
    ? { ...hardware, gpuName: frontendGpu || hardware.gpuName }
    : detectedInput
      ? {
          gpuName: detectedInput.gpuName,
          vramGb: 0,
          gpuTier: "entry",
          ramGb: detectedInput.ramGb,
          cpuCores: detectedInput.cpuCores,
          os: detectedInput.os,
        }
      : null;

  if (isLoading && !detectedInput) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Placeholder: shown before any detection, keeps the page complete
  const placeholder = !display;
  const gpuName = display?.gpuName ?? "—";
  const vramText = display && display.vramGb > 0 ? `${display.vramGb} GB` : "—";
  const ramText = display ? `${display.ramGb} GB` : "—";
  const cpuText = display ? `${display.cpuCores} ${t("hardware.cpu_unit")}` : "—";
  const osText = display?.os ?? "—";
  const tierRaw = display ? (TIER_KEY[display.gpuTier] ?? display.gpuTier) : "—";
  const tierText = display && display.vramGb > 0 ? t(tierRaw as TranslationKey) : "—";

  const specs = [
    { icon: Monitor,   label: t("hardware.gpu"),  value: gpuName },
    { icon: Zap,       label: t("hardware.vram"), value: vramText },
    { icon: HardDrive, label: t("hardware.ram"),  value: ramText },
    { icon: Cpu,       label: t("hardware.cpu"),  value: cpuText },
    { icon: Microchip, label: t("hardware.os"),   value: osText },
    { icon: Layers,    label: t("hardware.tier"), value: tierText },
  ];

  return (
    <Card className={cn("w-full", placeholder && "opacity-50")}>
      <CardHeader>
        <CardTitle className="text-lg">{t("hardware.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {specs.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-lg border p-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-medium truncate">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
