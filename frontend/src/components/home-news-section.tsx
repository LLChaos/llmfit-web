"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { NewsPostListItem } from "@/types/news";
import { NewsCard } from "@/components/news-card";

export function HomeNewsSection() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<NewsPostListItem[]>([]);

  useEffect(() => {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${API_BASE}/news?size=3`)
      .then((res) => res.json())
      .then((json) => {
        setPosts(json.data?.items ?? []);
      })
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {/* Section header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="h-5 w-5 text-green-500" />
          <h2 className="text-2xl font-bold tracking-tight">
            📰 {t("home.latest_news")}
          </h2>
        </div>
        <Link
          href="/news"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("home.view_all_news")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <NewsCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            summary={post.summary}
            category={post.category}
            publishedAt={post.publishedAt}
          />
        ))}
      </div>
    </section>
  );
}
