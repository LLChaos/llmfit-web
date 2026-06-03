"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-8xl font-bold text-muted-foreground/20 select-none">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        {t("error.not_found_title")}
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t("error.not_found_description")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("error.not_found_go_home")}
        </Link>
        <Link
          href="/models"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          {t("nav.models")}
        </Link>
        <Link
          href="/gpus"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          {t("nav.gpus")}
        </Link>
        <Link
          href="/tools/recommend"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          {t("nav.tools")}
        </Link>
      </div>
    </main>
  );
}
