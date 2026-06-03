"use client";

import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { useRecommendationStore, type SortKey } from "@/stores/recommendation-store";
import { ModelCard } from "@/components/model-card";
import { ScoringExplanation } from "@/components/scoring-explanation";
import { cn } from "@/lib/utils";
import type { RecommendedModel } from "@/types/recommendation";

interface RecommendationListProps {
  models: RecommendedModel[];
  isLoading: boolean;
}

const SORT_KEYS: readonly SortKey[] = ["total", "quality", "speed"] as const;

const SORT_KEY_TO_I18N: Record<SortKey, string> = {
  total: "recommendation.sort_total",
  quality: "recommendation.sort_quality",
  speed: "recommendation.sort_speed",
};

// Each button is exactly 120px wide, p-0.5 = 2px padding on container.
// Indicator: total starts at 2px, quality at 122px, speed at 242px.
const INDICATOR_POSITION: Record<SortKey, string> = {
  total: "left-0.5 w-[120px]",
  quality: "left-[122px] w-[120px]",
  speed: "left-[242px] w-[120px]",
};

export function RecommendationList({
  models,
  isLoading,
}: RecommendationListProps) {
  const { t } = useTranslation();
  const { sortBy, setSortBy, selectModel } = useRecommendationStore();

  const sorted = [...models].sort((a, b) => {
    switch (sortBy) {
      case "quality":
        return b.scores.quality - a.scores.quality;
      case "speed":
        return b.scores.speed - a.scores.speed;
      default:
        return b.scores.total - a.scores.total;
    }
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t("recommendation.title")}</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  if (models.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t("recommendation.title")}</h2>
        <p className="py-12 text-center text-muted-foreground">
          {t("recommendation.empty")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("recommendation.title")}</h2>

        {/* Segmented sort control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("recommendation.sort_by")}:
          </span>
          <div
            role="radiogroup"
            aria-label={t("recommendation.sort_by")}
            className="relative inline-flex rounded-lg bg-muted p-0.5"
          >
            {/* Sliding indicator */}
            <span
              className={cn(
                "absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-background shadow-sm ring-1 ring-black/5 transition-all duration-200 ease-out dark:ring-white/10",
                INDICATOR_POSITION[sortBy]
              )}
              aria-hidden="true"
            />

            {SORT_KEYS.map((key) => (
              <button
                key={key}
                role="radio"
                aria-checked={sortBy === key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "relative z-10 w-[120px] py-1.5 text-xs font-medium text-center transition-colors duration-200 cursor-pointer rounded-md",
                  sortBy === key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(SORT_KEY_TO_I18N[key] as TranslationKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring explanation */}
      <ScoringExplanation />

      <div className="space-y-3">
        {sorted.map((model, index) => (
          <ModelCard
            key={model.modelId}
            model={model}
            rank={index + 1}
            sortBy={sortBy}
            onClick={selectModel}
          />
        ))}
      </div>
    </section>
  );
}
