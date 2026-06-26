"use client";

import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { useLocaleStore } from "@/stores/locale-store";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { InternalLinks } from "@/components/internal-links";
import { SITE_URL } from "@/lib/seo";
import type { NewsPostDetail } from "@/types/news";

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

interface NewsDetailContentProps {
  post: NewsPostDetail;
}

export function NewsDetailContent({ post }: NewsDetailContentProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);

  const categoryLabel = t(getCategoryKey(post.category));

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === "zh" ? "zh-CN" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "";

  const tags = post.tags
    ? post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: t("news.breadcrumb_news"), href: "/news" },
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
        title={t("news.continue_reading")}
        links={[
          { href: "/news", label: t("news.browse_all_articles") },
          { href: "/models", label: t("news.browse_model_library") },
          { href: "/gpus", label: t("news.browse_gpu_database") },
          { href: "/tools/recommend", label: t("news.check_your_hardware") },
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
            url: `${SITE_URL}/news/${post.slug}`,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            articleSection: categoryLabel,
            keywords: tags.join(", "),
            author: {
              "@type": "Organization",
              name: "LLMFit Web",
              url: SITE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "LLMFit Web",
              url: SITE_URL,
            },
            ...(post.coverImageUrl
              ? { image: post.coverImageUrl }
              : {}),
            inLanguage: locale === "zh" ? "zh-CN" : "en-US",
          }),
        }}
      />
    </article>
  );
}
