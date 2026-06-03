import Link from "next/link";
import { cn } from "@/lib/utils";
import { HardDrive, BarChart3, Zap } from "lucide-react";

interface GpuCardProps {
  id: string;
  name: string;
  vendor: string;
  vramGb: number;
  tier: string;
  benchmarkScore?: number;
  flopsTflops?: number;
  memoryBandwidthGbS?: number;
  className?: string;
}

const TIER_LABELS: Record<string, string> = {
  entry: "Entry",
  mid: "Mid-Range",
  high: "High-End",
  enthusiast: "Enthusiast",
};

const TIER_COLORS: Record<string, string> = {
  entry: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  mid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  enthusiast: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export function GpuCardLink({
  id,
  name,
  vendor,
  vramGb,
  tier,
  benchmarkScore,
  flopsTflops,
  memoryBandwidthGbS,
  className,
}: GpuCardProps) {
  return (
    <Link
      href={`/gpus/${encodeURIComponent(id)}`}
      className={cn(
        "group block rounded-xl border border-border bg-card p-5",
        "hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5",
        "transition-all duration-200",
        className
      )}
    >
      {/* Top: vendor + tier */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
          {vendor}
        </span>
        <span
          className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded",
            TIER_COLORS[tier] ?? TIER_COLORS.entry
          )}
        >
          {TIER_LABELS[tier] ?? tier}
        </span>
      </div>

      {/* GPU name */}
      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
        {name}
      </h3>

      {/* Specs grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HardDrive className="h-3 w-3 flex-shrink-0" />
          <span>{vramGb} GB VRAM</span>
        </div>
        {benchmarkScore != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3 flex-shrink-0" />
            <span>{benchmarkScore.toLocaleString()}</span>
          </div>
        )}
        {flopsTflops != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 flex-shrink-0" />
            <span>{flopsTflops} TFLOPS</span>
          </div>
        )}
        {memoryBandwidthGbS != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{memoryBandwidthGbS} GB/s</span>
          </div>
        )}
      </div>
    </Link>
  );
}
