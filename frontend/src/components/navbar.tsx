"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Cpu, Menu, X, ExternalLink } from "lucide-react";

/** External blog URL — update this when your blog is ready */
const BLOG_URL = "https://blog.example.com";

/** Primary nav links */
const NAV_LINKS = [
  { href: "/models", i18nKey: "nav.models" as const },
  { href: "/gpus", i18nKey: "nav.gpus" as const },
  { href: "/news", i18nKey: "nav.news" as const },
  { href: "/more-recommendations", i18nKey: "nav.more_recommendations" as const },
] as const;

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-muted/30 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors shrink-0"
        >
          <Cpu className="h-4 w-4 text-primary" />
          <span>LLMFit Web</span>
        </Link>

        {/* Desktop nav links — centered */}
        <div className="hidden md:flex items-center gap-1 ml-8">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {t(link.i18nKey)}
              </Link>
            );
          })}
          {/* Blog — external link placeholder */}
          <a
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors inline-flex items-center gap-1"
          >
            {t("nav.blog")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("nav.menu_close") : t("nav.menu_open")}
            className={cn(
              "md:hidden flex h-8 w-8 items-center justify-center rounded-full",
              "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/80 backdrop-blur-sm px-4 py-3">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {t(link.i18nKey)}
                </Link>
              );
            })}
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors inline-flex items-center gap-1"
            >
              {t("nav.blog")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
