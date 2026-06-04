"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string | null;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  news: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  guide: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  tutorial:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  announcement:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function getCategoryI18nKey(category: string): string {
  const map: Record<string, string> = {
    news: "news.category.news",
    guide: "news.category.guide",
    tutorial: "news.category.tutorial",
    announcement: "news.category.announcement",
  };
  return map[category] ?? category;
}

export function NewsCard({
  slug,
  title,
  summary,
  category,
  publishedAt,
  className,
}: NewsCardProps) {
  const { t } = useTranslation();
  const badgeColor =
    CATEGORY_COLORS[category] ?? CATEGORY_COLORS.guide;
  const badgeLabel = t(getCategoryI18nKey(category) as TranslationKey);

  return (
    <Link
      href={`/news/${slug}`}
      className={cn(
        "group block rounded-lg border border-border/60 bg-card p-5 transition-all",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_8px_rgba(0,0,0,0.06)]",
        "dark:border-border/40 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3)]",
        "hover:border-primary/30 hover:shadow-sm",
        className,
      )}
    >
      {/* Category badge + date */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("inline-block text-xs font-medium px-2 py-0.5 rounded-full", badgeColor)}>
          {badgeLabel}
        </span>
        {publishedAt && (
          <time dateTime={publishedAt} className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(publishedAt).toLocaleDateString(
              typeof navigator !== "undefined" ? navigator.language : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )}
          </time>
        )}
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2">
        {title}
      </h2>

      {/* Summary */}
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
        {summary}
      </p>

      {/* Read more */}
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-1.5 transition-all">
        {t("common.read_more")}
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
