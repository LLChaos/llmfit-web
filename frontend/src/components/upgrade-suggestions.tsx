"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import type { UpgradeSuggestion } from "@/types/recommendation";
import { ArrowRight, TrendingUp,  ExternalLink, Gpu } from "lucide-react";

interface UpgradeSuggestionsProps {
  suggestions: UpgradeSuggestion[];
  /** Whether to show a link to /more-recommendations. Defaults to true. */
  showMoreLink?: boolean;
}

export function UpgradeSuggestions({
  suggestions,
  showMoreLink = true,
}: UpgradeSuggestionsProps) {
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-5">
      <h2 className="text-xl font-bold">{t("upgrade.title")}</h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {suggestions.map((s) => (
          <Card key={s.suggestedGpu} className="border-dashed">
            <CardContent className="space-y-4 p-5">
              {/* Current GPU */}
              <div className="flex items-start gap-2">
                <Gpu className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t("upgrade.current")}
                  </p>
                  <p className="text-sm font-medium break-words">{s.currentGpu}</p>
                </div>
              </div>

              {/* Arrow + Suggested GPU */}
              <div className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t("upgrade.suggested")}
                  </p>
                  <p className="text-base font-semibold text-primary break-words">
                    {s.suggestedGpu}
                  </p>
                </div>
              </div>

              {/* VRAM gain + Speed boost */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t("upgrade.vram_gain")}: +{s.improvement.vramDeltaGb} GB
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <TrendingUp className="mr-0.5 inline h-3.5 w-3.5" />
                  {t("upgrade.speed_boost")}: +{s.improvement.speedBoostPct}%
                </span>
              </div>

              {/* Unlocked models */}
              {s.improvement.unlocksModels.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm text-muted-foreground">
                    {t("upgrade.unlocks")}:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.improvement.unlocksModels.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-muted px-2 py-0.5 text-xs font-medium"
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

      {/* Link to more recommendations */}
      {showMoreLink && (
        <div className="flex justify-center pt-2">
          <Link
            href="/more-recommendations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/50"
          >
            {t("upgrade.view_more")}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
