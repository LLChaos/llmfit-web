"use client";

import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (isLoading) {
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

  if (!hardware) return null;

  const tierKey = TIER_KEY[hardware.gpuTier] ?? hardware.gpuTier;

  const specs = [
    { icon: Monitor, label: t("hardware.gpu"), value: hardware.gpuName },
    { icon: Zap, label: t("hardware.vram"), value: `${hardware.vramGb} GB` },
    { icon: HardDrive, label: t("hardware.ram"), value: `${hardware.ramGb} GB` },
    { icon: Cpu, label: t("hardware.cpu"), value: `${hardware.cpuCores} ${t("hardware.cpu_unit")}` },
    { icon: Microchip, label: t("hardware.os"), value: hardware.os },
    { icon: Layers, label: t("hardware.tier"), value: t(tierKey as TranslationKey) },
  ];

  return (
    <Card className="w-full">
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
