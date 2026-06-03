import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { InternalLinks } from "@/components/internal-links";
import { constructMetadata } from "@/lib/seo";
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
    if (json.success && json.data) return json.data;
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

  const categoryLabels: Record<string, string> = {
    news: "News",
    guide: "Guide",
    tutorial: "Tutorial",
    announcement: "Announcement",
  };
  const categoryLabel = categoryLabels[post.category] ?? post.category;

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const tags = post.tags
    ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: "Latest News", href: "/news" },
          { label: categoryLabel, href: `/news?category=${post.category}` },
          { label: post.title },
        ]}
      />

      {post.publishedAt && (
        <time dateTime={post.publishedAt} className="text-sm text-muted-foreground">
          {formattedDate}
        </time>
      )}
      <PageHeader
        title={post.title}
        description={post.summary}
        badge={categoryLabel}
      />

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Article body */}
      <div className="mt-6 mb-12">
        <MarkdownRenderer content={post.bodyMarkdown} />
      </div>

      {/* Internal links */}
      <InternalLinks
        title="Continue Reading"
        links={[
          { href: "/news", label: "Browse all articles" },
          { href: "/models", label: "Browse model library" },
          { href: "/gpus", label: "Browse GPU database" },
          { href: "/tools/recommend", label: "Check your hardware" },
        ]}
      />

      {/* JSON-LD Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.summary,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            articleSection: categoryLabel,
            keywords: tags.join(", "),
          }),
        }}
      />
    </article>
  );
}
