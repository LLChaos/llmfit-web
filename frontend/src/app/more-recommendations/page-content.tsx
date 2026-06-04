"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { useHardwareStore } from "@/stores/hardware-store";
import { useRecommendations } from "@/hooks/use-recommendations";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { HardwareCard } from "@/components/hardware-card";
import { RecommendationList } from "@/components/recommendation-list";
import { UpgradeSuggestions } from "@/components/upgrade-suggestions";
import { ModelDetailModal } from "@/components/model-detail-modal";
import { ScoreBarChart } from "@/components/score-bar-chart";
import { Button } from "@/components/ui/button";
import type { HardwareInput } from "@/types/hardware";

// Sensible default for first-time visitors
const DEFAULT_HARDWARE: HardwareInput = {
  gpuName: "NVIDIA GeForce RTX 3060",
  ramGb: 16,
  cpuCores: 8,
  os: "Windows",
};

function MoreRecommendationsContent() {
  const { t } = useTranslation();
  const hardwareInput = useHardwareStore((s) => s.input);
  const manualGpu = useHardwareStore((s) => s.manualGpu);
  const manualVram = useHardwareStore((s) => s.manualVram);
  const manualRam = useHardwareStore((s) => s.manualRam);

  // Build effective input: manual overrides > detected > default
  const effectiveInput = useMemo<HardwareInput>(() => {
    if (!hardwareInput) return DEFAULT_HARDWARE;
    const gpuName = manualGpu || hardwareInput.gpuName;
    return {
      ...hardwareInput,
      gpuName,
      ramGb: manualRam ?? hardwareInput.ramGb,
      vramGb: manualVram ?? undefined,
    };
  }, [hardwareInput, manualGpu, manualVram, manualRam]);

  // Fetch ALL compatible models (limit=0)
  const { data, isLoading, isError, refetch } = useRecommendations(
    effectiveInput,
    0,
  );

  // ── 300ms debounced auto-refetch on hardware change ──────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refetch();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [effectiveInput, refetch]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb
        segments={[{ label: t("breadcrumb.more_recommendations") }]}
      />

      <PageHeader
        title={t("more_recommendations.title")}
        description={t("more_recommendations.subtitle")}
      />

      <div className="space-y-8">
        {/* Hardware configuration panel */}
        <HardwareCard hardware={data?.hardware ?? null} isLoading={isLoading} />

        {/* Error state */}
        {isError && (
          <div className="py-16 text-center">
            <p className="text-lg text-destructive">{t("common.error")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              {t("common.retry")}
            </Button>
          </div>
        )}

        {/* Horizontal bar chart — Top 10 by comprehensive score */}
        {data && data.recommendations.length > 0 && (
          <ScoreBarChart models={data.recommendations} />
        )}

        {/* Full model recommendation list */}
        <RecommendationList
          models={data?.recommendations ?? []}
          isLoading={isLoading}
        />

        {/* Upgrade suggestions */}
        <UpgradeSuggestions suggestions={data?.upgradeSuggestions ?? []} />

        <ModelDetailModal />
      </div>
    </div>
  );
}

export function MoreRecommendationsPageContent() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <MoreRecommendationsContent />
    </QueryClientProvider>
  );
}
