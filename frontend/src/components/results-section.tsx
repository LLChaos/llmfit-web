"use client";

import { HardwareCard } from "@/components/hardware-card";
import { RecommendationList } from "@/components/recommendation-list";
import { UpgradeSuggestions } from "@/components/upgrade-suggestions";
import { ModelDetailModal } from "@/components/model-detail-modal";
import type { RecommendationResponse } from "@/types/recommendation";

interface ResultsSectionProps {
  data: RecommendationResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ResultsSection({
  data,
  isLoading,
  isError,
  onRetry,
}: ResultsSectionProps) {
  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-destructive">Error</p>
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <HardwareCard hardware={data?.hardware ?? null} isLoading={isLoading} />

      <RecommendationList
        models={data?.recommendations ?? []}
        isLoading={isLoading}
      />

      <UpgradeSuggestions suggestions={data?.upgradeSuggestions ?? []} />

      <ModelDetailModal />
    </div>
  );
}
