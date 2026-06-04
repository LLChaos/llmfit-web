import Link from "next/link";
import { cn } from "@/lib/utils";
import { Cpu, HardDrive, Zap } from "lucide-react";

interface ModelCardProps {
  id: string;
  name: string;
  family: string;
  parameterCountB: number;
  quantization: string;
  recommendedVramGb: number;
  contextLength: number;
  qualityScore: number;
  className?: string;
}

function formatParams(b: number): string {
  if (b >= 1) return `${b.toFixed(1)}B`;
  return `${(b * 1000).toFixed(0)}M`;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

export function ModelCardLink({
  id,
  name,
  family,
  parameterCountB,
  quantization,
  recommendedVramGb,
  contextLength,
  qualityScore,
  className,
}: ModelCardProps) {
  return (
    <Link
      href={`/models/${encodeURIComponent(id)}`}
      className={cn(
        "group block rounded-xl border border-border/60 bg-card p-5",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_8px_rgba(0,0,0,0.06)]",
        "dark:border-border/40 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3)]",
        "hover:border-primary/30 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_6px_18px_rgba(0,0,0,0.35)]",
        "transition-all duration-200",
        className
      )}
    >
      {/* Top: family badge + quality score */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
          {family}
        </span>
        <span
          className={cn("text-xs font-bold", scoreColor(qualityScore))}
        >
          {qualityScore}%
        </span>
      </div>

      {/* Model name */}
      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
        {name}
      </h3>

      {/* Specs grid — 2x2 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cpu className="h-3 w-3 flex-shrink-0" />
          <span>{formatParams(parameterCountB)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HardDrive className="h-3 w-3 flex-shrink-0" />
          <span>{recommendedVramGb} GB</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 flex-shrink-0" />
          <span>{quantization}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{contextLength.toLocaleString()} ctx</span>
        </div>
      </div>
    </Link>
  );
}
