"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import type { UpgradeSuggestion } from "@/types/recommendation";
import { ArrowRight, TrendingUp, Cpu } from "lucide-react";

interface UpgradeSuggestionsProps {
  suggestions: UpgradeSuggestion[];
}

export function UpgradeSuggestions({ suggestions }: UpgradeSuggestionsProps) {
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{t("upgrade.title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => (
          <Card key={s.suggestedGpu} className="border-dashed">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("upgrade.current")}:{" "}
                </span>
                <span className="truncate font-medium">{s.currentGpu}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="truncate font-semibold text-primary">
                  {s.suggestedGpu}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t("upgrade.vram_gain")}: +{s.improvement.vramDeltaGb} GB
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <TrendingUp className="mr-0.5 inline h-3 w-3" />
                  {t("upgrade.speed_boost")}: +{s.improvement.speedBoostPct}%
                </span>
              </div>
              {s.improvement.unlocksModels.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("upgrade.unlocks")}:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {s.improvement.unlocksModels.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        {id}
                      </span>
                    ))}
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
