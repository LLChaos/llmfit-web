"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { NewsCard } from "@/components/news-card";
import { Pagination } from "@/components/pagination";
import type { NewsPostListItem } from "@/types/news";
import type { PaginatedData } from "@/services/api-client";

const ITEMS_PER_PAGE = 12;

function filterPosts(
  posts: NewsPostListItem[],
  category: string | null,
): NewsPostListItem[] {
  if (!category) return posts;
  return posts.filter((p) => p.category === category);
}

function getCategoryKey(category: string): TranslationKey {
  switch (category) {
    case "guide":
      return "news.category.guide";
    case "tutorial":
      return "news.category.tutorial";
    case "announcement":
      return "news.category.announcement";
    default:
      return "news.category.news";
  }
}

interface NewsPageContentProps {
  initialData: PaginatedData<NewsPostListItem>;
}

export function NewsPageContent({ initialData }: NewsPageContentProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterPosts(initialData.items, category),
    [initialData.items, category]
  );

  // Reset to page 1 when category changes
  useEffect(() => { setPage(1); }, [category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pagedItems = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const catLabel = category ? t(getCategoryKey(category)) : "";

  const CATEGORY_OPTIONS = [
    { value: "guide", label: t("news.category.guide") },
    { value: "tutorial", label: t("news.category.tutorial") },
    { value: "news", label: t("news.category.news") },
    { value: "announcement", label: t("news.category.announcement") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("news.title") }]} />
      <PageHeader
        title={t("news.title")}
        description={t("news.description")}
        badge={t("news.badge")}
      />

      {/* Category filter */}
      <div className="mb-8">
        <FilterBar
          options={CATEGORY_OPTIONS}
          selected={category}
          onSelect={setCategory}
          label={t("news.category.all")}
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {category
          ? t("news.showing_in")
              .replace("{filtered}", String(filtered.length))
              .replace("{total}", String(initialData.total))
              .replace("{category}", catLabel)
          : t("news.showing")
              .replace("{filtered}", String(filtered.length))
              .replace("{total}", String(initialData.total))
        }
      </p>

      {/* Grid */}
      {pagedItems.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pagedItems.map((post) => (
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
          <p className="text-lg font-medium">{t("news.no_articles")}</p>
          <p className="text-sm mt-1">{t("news.no_articles_hint")}</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-8"
      />
    </div>
  );
}
