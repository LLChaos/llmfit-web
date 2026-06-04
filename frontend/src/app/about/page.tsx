"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("about.breadcrumb") }]} />

      <PageHeader
        title={t("about.title")}
        description={t("about.description")}
        badge={t("about.badge")}
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("about.mission_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.mission_text")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("about.how_it_works_title")}</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">{t("about.step1_title")}</strong>
              {" — "}{t("about.step1_text")}
            </li>
            <li>
              <strong className="text-foreground">{t("about.step2_title")}</strong>
              {" — "}{t("about.step2_text")}
            </li>
            <li>
              <strong className="text-foreground">{t("about.step3_title")}</strong>
              {" — "}{t("about.step3_text")}
            </li>
            <li>
              <strong className="text-foreground">{t("about.step4_title")}</strong>
              {" — "}{t("about.step4_text")}
            </li>
            <li>
              <strong className="text-foreground">{t("about.step5_title")}</strong>
              {" — "}{t("about.step5_text")}
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("about.data_sources_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.data_sources_text")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("about.vision_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.vision_text")}
          </p>
        </section>

        {/* Cross-links */}
        <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{t("about.also_see")}</span>
          <a href="/contact" className="text-primary hover:underline">
            {t("contact.title")}
          </a>
          <span>·</span>
          <a href="/privacy" className="text-primary hover:underline">
            {t("privacy.title")}
          </a>
          <span>·</span>
          <a href="/terms" className="text-primary hover:underline">
            {t("terms.title")}
          </a>
          <span>·</span>
          <a href="/tools/recommend" className="text-primary hover:underline">
            {t("about.try_tool")}
          </a>
        </div>
      </div>
    </div>
  );
}
