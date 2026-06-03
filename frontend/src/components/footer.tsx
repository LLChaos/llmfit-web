"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Cpu } from "lucide-react";
import Link from "next/link";

/** External blog URL — update this when you have your blog set up */
const BLOG_URL = "https://blog.example.com";

/** Model family links shown in footer */
const MODEL_FAMILIES = [
  { label: "Qwen", href: "/models?family=Qwen" },
  { label: "Llama", href: "/models?family=Llama" },
  { label: "Gemma", href: "/models?family=Gemma" },
  { label: "Mistral", href: "/models?family=Mistral" },
  { label: "DeepSeek", href: "/models?family=DeepSeek" },
];

/** GPU vendor links shown in footer */
const GPU_VENDORS = [
  { label: "NVIDIA", href: "/gpus?vendor=nvidia" },
  { label: "AMD", href: "/gpus?vendor=amd" },
  { label: "Apple", href: "/gpus?vendor=apple" },
  { label: "Intel", href: "/gpus?vendor=intel" },
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer
      className="mt-auto border-t border-border/40 bg-muted/20"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top section: brand + columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
            >
              <Cpu className="h-4 w-4 text-primary" />
              <span>LLMFit Web</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Models column */}
          <nav aria-label={t("a11y.footer_models")}>
            <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
              {t("footer.models")}
            </h3>
            <ul className="space-y-1.5">
              {MODEL_FAMILIES.map((m) => (
                <li key={m.label}>
                  <Link
                    href={m.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/models"
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {t("footer.view_all_models")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* GPUs column */}
          <nav aria-label={t("a11y.footer_gpus")}>
            <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
              {t("footer.gpus")}
            </h3>
            <ul className="space-y-1.5">
              {GPU_VENDORS.map((v) => (
                <li key={v.label}>
                  <Link
                    href={v.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {v.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/gpus"
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {t("footer.view_all_gpus")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources column */}
          <nav aria-label={t("a11y.footer_resources")}>
            <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
              {t("footer.resources")}
            </h3>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/news"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.news")}
                </Link>
              </li>
              <li>
                <a
                  href={BLOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5"
                >
                  {t("footer.blog")}
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar: legal + copyright */}
        <div className="mt-8 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.terms")}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
