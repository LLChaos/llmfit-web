import type { Metadata } from "next";
import { NEWS_META } from "@/lib/seo";
import { NewsPageContent } from "./page-content";

export const metadata: Metadata = NEWS_META;

async function fetchPublishedPosts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/news?page=1&size=24`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      return { items: [], total: 0, page: 1, size: 24 };
    }
    const json = await res.json();
    if (json.success && json.data) {
      // Map snake_case API response to camelCase
      const d = json.data;
      return {
        items: (d.items ?? []).map((item: Record<string, unknown>) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          category: item.category,
          tags: item.tags ?? "",
          coverImageUrl: item.cover_image_url ?? "",
          publishedAt: item.published_at ?? null,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        total: d.total ?? 0,
        page: d.page ?? 1,
        size: d.size ?? 24,
      };
    }
    return { items: [], total: 0, page: 1, size: 24 };
  } catch {
    return { items: [], total: 0, page: 1, size: 24 };
  }
}

export default async function NewsPage() {
  const data = await fetchPublishedPosts();
  return <NewsPageContent initialData={data} />;
}
