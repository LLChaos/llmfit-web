"use client";

import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages);

  return (
    <nav
      className={cn("flex items-center justify-center gap-0.5", className)}
      aria-label={t("pagination.label")}
    >
      {/* Previous */}
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          "h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors",
          "border border-border",
          page <= 1
            ? "cursor-not-allowed opacity-40 text-muted-foreground"
            : "text-foreground hover:bg-muted hover:border-primary/40 cursor-pointer"
        )}
        aria-label={t("pagination.prev")}
      >
        ‹
      </button>

      {/* Page numbers */}
      {pages.map((p) => {
        if (p === "ellipsis-start" || p === "ellipsis-end") {
          return (
            <span
              key={p}
              className="flex h-8 min-w-[1.5rem] items-center justify-center text-xs text-muted-foreground select-none"
            >
              …
            </span>
          );
        }

        const num = p as number;
        const isActive = num === page;

        return (
          <button
            key={num}
            type="button"
            disabled={isActive}
            onClick={() => onPageChange(num)}
            className={cn(
              "h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-all border cursor-pointer",
              isActive
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm ring-1 ring-primary/20 pointer-events-none"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/40"
            )}
            aria-label={t("pagination.page").replace("{page}", String(num))}
            aria-current={isActive ? "page" : undefined}
          >
            {num}
          </button>
        );
      })}

      {/* Next */}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          "h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors",
          "border border-border",
          page >= totalPages
            ? "cursor-not-allowed opacity-40 text-muted-foreground"
            : "text-foreground hover:bg-muted hover:border-primary/40 cursor-pointer"
        )}
        aria-label={t("pagination.next")}
      >
        ›
      </button>
    </nav>
  );
}

/** Build the range of page numbers to display, with ellipsis markers. */
function buildPageRange(
  current: number,
  total: number,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis-start");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis-end");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
