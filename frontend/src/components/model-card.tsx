"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type SortKey } from "@/stores/recommendation-store";
import type { RecommendedModel } from "@/types/recommendation";
import { CheckCircle, XCircle } from "lucide-react";

interface ModelCardProps {
  model: RecommendedModel;
  rank: number;
  sortBy: SortKey;
  onClick: (model: RecommendedModel) => void;
}

export function ModelCard({ model, rank, sortBy, onClick }: ModelCardProps) {
  const { t } = useTranslation();

  const scorePercent = Math.round(model.scores[sortBy]);
  const ringColor =
    scorePercent >= 80
      ? "text-green-500"
      : scorePercent >= 60
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <Card
      className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white shadow-md ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg dark:border-gray-700 dark:bg-card dark:hover:border-gray-600"
      onClick={() => onClick(model)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Rank badge */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {rank}
        </span>

        {/* Model info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{model.modelId}</h3>
            {model.runnable ? (
              <Badge variant="outline" className="gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                {t("recommendation.runnable")}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {t("recommendation.not_runnable")}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t("model.estimated_speed")}: {model.estimatedTokensPerSec} tok/s
            </span>
            <span>
              {t("model.vram_required")}: {model.estimatedVramGb} GB
            </span>
          </div>
        </div>

        {/* Score ring */}
        <div className="flex shrink-0 flex-col items-center">
          <svg className="h-12 w-12" viewBox="0 0 36 36">
            <path
              className="stroke-muted/30 fill-none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`fill-none ${ringColor}`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${scorePercent}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text
              x="18"
              y="20.5"
              textAnchor="middle"
              className="fill-foreground text-[10px] font-bold"
            >
              {scorePercent}
            </text>
          </svg>
          <span className="text-[10px] text-muted-foreground">
            {sortBy === "quality" ? t("score.quality") : sortBy === "speed" ? t("score.speed") : t("score.total")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
