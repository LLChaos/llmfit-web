"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Monitor } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface GpuSummary {
  id: string;
  name: string;
  vendor: string;
  vram_gb: number;
  tier: string;
  benchmark_score?: number;
}

const TIER_COLORS: Record<string, string> = {
  entry: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  mid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  enthusiast: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export function FeaturedGpusSection() {
  const { t } = useTranslation();
  const [gpus, setGpus] = useState<GpuSummary[]>([]);

  useEffect(() => {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${API_BASE}/gpus?sort_by=benchmark_score&order=desc&size=3`)
      .then((res) => res.json())
      .then((json) => {
        setGpus(json.data?.items ?? []);
      })
      .catch(() => setGpus([]));
  }, []);

  if (gpus.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {/* Section header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">
            🖥️ {t("home.featured_gpus")}
          </h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {t("home.top_n_gpus")}
          </span>
        </div>
        <Link
          href="/gpus"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("home.view_all_gpus")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 3-card horizontal row */}
      <div className="grid gap-5 sm:grid-cols-3">
        {gpus.map((gpu, i) => (
          <Card
            key={gpu.id || gpu.name}
            className={cn(
              "group transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40",
            )}
          >
            <CardContent className="flex flex-col gap-3 p-5">
              {/* Rank + Name */}
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                    {gpu.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{gpu.vendor}</p>
                </div>
              </div>

              {/* Tier badge */}
              {gpu.tier && (
                <Badge
                  variant="outline"
                  className={cn("w-fit text-[11px]", TIER_COLORS[gpu.tier] || "")}
                >
                  {t(`hardware.tier.${gpu.tier}` as TranslationKey)}
                </Badge>
              )}

              {/* VRAM stat */}
              <div className="mt-auto flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("common.gb_vram")}</span>
                <span className="font-semibold tabular-nums">
                  {gpu.vram_gb} GB
                </span>
              </div>

              {/* Benchmark bar */}
              {gpu.benchmark_score != null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("common.benchmark")}</span>
                    <span className="tabular-nums">
                      {gpu.benchmark_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (gpu.benchmark_score / 100) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
