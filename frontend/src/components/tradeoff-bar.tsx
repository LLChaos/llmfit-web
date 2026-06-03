"use client";

import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface TradeoffBarProps {
  /** Label shown above the bar cluster */
  label: string;
  /** Value 0–100 */
  value: number;
  /** Bar color class */
  color: string;
  className?: string;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface TradeoffBarsProps {
  /** Values 0–100 */
  quality: number;
  speed: number;
  compatibility: number;
  context: number;
  className?: string;
}

/**
 * Compact 4-bar trade-off visualization.
 * Each bar represents a scoring dimension as a percentage of 100.
 */
export function TradeoffBars({
  quality,
  speed,
  compatibility,
  context,
  className,
}: TradeoffBarsProps) {
  const { t } = useTranslation();

  const bars = [
    { label: t("tradeoff.quality"), value: quality, color: "bg-blue-500" },
    { label: t("tradeoff.speed"), value: speed, color: "bg-green-500" },
    { label: t("tradeoff.compat"), value: compatibility, color: "bg-amber-500" },
    { label: t("tradeoff.context"), value: context, color: "bg-purple-500" },
  ];

  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {bars.map((bar) => (
        <div key={bar.label} className="space-y-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{bar.label}</span>
            <span className="tabular-nums font-medium">{Math.round(bar.value)}</span>
          </div>
          <MiniBar value={bar.value} color={bar.color} />
        </div>
      ))}
    </div>
  );
}
