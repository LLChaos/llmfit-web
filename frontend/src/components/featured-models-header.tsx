"use client";

import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

/**
 * Client-side section header for FeaturedModelsSection.
 * Uses i18n for localized text while the parent server component
 * handles data fetching with ISR.
 */
export function FeaturedModelsHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Rocket className="h-5 w-5 text-amber-500" />
        <h2 className="text-2xl font-bold tracking-tight">
          {"🔥"}{t("home.featured_models")}
        </h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {t("home.top_n_models")}
        </span>
      </div>
      <Link
        href="/models"
        className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {t("home.view_all_models")}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
