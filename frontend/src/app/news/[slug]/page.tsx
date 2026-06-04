import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { constructMetadata } from "@/lib/seo";
import { NewsDetailContent } from "@/components/news-detail-content";
import type { NewsPostDetail } from "@/types/news";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchPost(slug: string): Promise<NewsPostDetail | null> {
  try {
    const res = await fetch(
      `${API_BASE}/news/${encodeURIComponent(slug)}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      // Map snake_case API response to camelCase type
      const d = json.data;
      return {
        id: d.id,
        slug: d.slug,
        title: d.title,
        summary: d.summary,
        category: d.category,
        tags: d.tags ?? "",
        coverImageUrl: d.cover_image_url ?? "",
        publishedAt: d.published_at ?? null,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        bodyMarkdown: d.body_markdown ?? "",
        isPublished: d.is_published ?? false,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) {
    return constructMetadata({
      title: "Article Not Found",
      description: "The requested article could not be found.",
      path: `/news/${slug}`,
    });
  }

  return constructMetadata({
    title: post.title,
    description: post.summary,
    path: `/news/${slug}`,
  });
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    notFound();
  }

  return <NewsDetailContent post={post} />;
}
