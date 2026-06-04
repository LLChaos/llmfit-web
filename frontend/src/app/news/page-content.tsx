"use client";

import { useState } from "react";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { NewsCard } from "@/components/news-card";
import type { NewsPostListItem } from "@/types/news";
import type { PaginatedData } from "@/services/api-client";

function filterPosts(
  posts: NewsPostListItem[],
  category: string | null,
): NewsPostListItem[] {
  if (!category) return posts;
  return posts.filter((p) => p.category === category);
}

interface NewsPageContentProps {
  initialData: PaginatedData<NewsPostListItem>;
}

export function NewsPageContent({ initialData }: NewsPageContentProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string | null>(null);

  const allPosts = initialData.items;
  const filtered = filterPosts(allPosts, category);
  const catLabel = category
    ? t(`news_page.category_${category === "announcement" ? "announcements" : category + "s"}` as TranslationKey)
    : "";

  const CATEGORY_OPTIONS = [
    { value: "guide", label: t("news_page.category_guides") },
    { value: "tutorial", label: t("news_page.category_tutorials") },
    { value: "news", label: t("news_page.category_news") },
    { value: "announcement", label: t("news_page.category_announcements") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("news.title") }]} />
      <PageHeader
        title={t("news_page.title")}
        description={t("news_page.description")}
        badge={t("news_page.badge")}
      />

      {/* Category filter */}
      <div className="mb-8">
        <FilterBar
          options={CATEGORY_OPTIONS}
          selected={category}
          onSelect={setCategory}
          label={t("news_page.category")}
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {category
          ? t("news_page.showing_in")
              .replace("{filtered}", String(filtered.length))
              .replace("{total}", String(initialData.total))
              .replace("{category}", catLabel)
          : t("news_page.showing")
              .replace("{filtered}", String(filtered.length))
              .replace("{total}", String(initialData.total))
        }
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <NewsCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              summary={post.summary}
              category={post.category}
              publishedAt={post.publishedAt}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">{t("news_page.no_articles_title")}</p>
          <p className="text-sm mt-1">{t("news_page.no_articles_hint")}</p>
        </div>
      )}
    </div>
  );
}
