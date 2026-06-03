"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { NewsCard } from "@/components/news-card";
import type { NewsPostListItem } from "@/types/news";
import type { PaginatedData } from "@/services/api-client";

const CATEGORY_OPTIONS = [
  { value: "guide", label: "Guides" },
  { value: "tutorial", label: "Tutorials" },
  { value: "news", label: "News" },
  { value: "announcement", label: "Announcements" },
];

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
  const [category, setCategory] = useState<string | null>(null);

  const allPosts = initialData.items;
  const filtered = filterPosts(allPosts, category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="Latest News & Guides"
        description="Industry updates, site announcements, and step-by-step tutorials for running AI models on your own hardware."
        badge="News"
      />

      {/* Category filter */}
      <div className="mb-8">
        <FilterBar
          options={CATEGORY_OPTIONS}
          selected={category}
          onSelect={setCategory}
          label="Category"
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        Showing {filtered.length} of {initialData.total} articles
        {category && ` in "${CATEGORY_OPTIONS.find((o) => o.value === category)?.label}"`}
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
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  );
}
