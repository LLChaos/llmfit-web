"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { ModelCard } from "@/components/model-card";
import type { RecommendedModel } from "@/types/recommendation";

interface RecommendationListProps {
  models: RecommendedModel[];
  isLoading: boolean;
}

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

  const sortOptions = [
    { key: "total" as const, label: t("recommendation.sort_total") },
    { key: "quality" as const, label: t("recommendation.sort_quality") },
    { key: "speed" as const, label: t("recommendation.sort_speed") },
  ];

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
        <div className="flex gap-1">
          <span className="mr-2 self-center text-sm text-muted-foreground">
            {t("recommendation.sort_by")}:
          </span>
          {sortOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((model) => (
          <ModelCard
            key={model.modelId}
            model={model}
            onClick={selectModel}
          />
        ))}
      </div>
    </section>
  );
}
