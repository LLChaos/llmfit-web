"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

/** A single breadcrumb segment */
export interface BreadcrumbSegment {
  label: string;
  href?: string; // if omitted, this segment is the current page (not a link)
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

export function Breadcrumb({ segments, className }: BreadcrumbProps) {
  const { t } = useTranslation();
  if (segments.length === 0) return null;

  const items: BreadcrumbSegment[] = [
    { label: t("breadcrumb.home"), href: "/" },
    ...segments,
  ];

  return (
    <nav aria-label="Breadcrumb" className={cn("py-3", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((seg, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
              )}
              {i === 0 ? (
                <Link
                  href={seg.href!}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  aria-label={seg.label}
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
              ) : isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[400px]">
                  {seg.label}
                </span>
              ) : (
                <Link
                  href={seg.href!}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                >
                  {seg.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* JSON-LD BreadcrumbList structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((seg, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: seg.label,
              item: seg.href
                ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${seg.href}`
                : undefined,
            })),
          }),
        }}
      />
    </nav>
  );
}
