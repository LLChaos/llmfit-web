"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("privacy.breadcrumb") }]} />

      <PageHeader
        title={t("privacy.title")}
        description={t("privacy.description")}
        badge={t("privacy.badge")}
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s1_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("privacy.s1_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s2_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>{t("privacy.s2_hw_label")}</strong>{" "}{t("privacy.s2_hw_text")}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong>{t("privacy.s2_api_label")}</strong>{" "}{t("privacy.s2_api_text")}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong>{t("privacy.s2_usage_label")}</strong>{" "}{t("privacy.s2_usage_text")}
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s3_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("privacy.s3_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s4_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("privacy.s4_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s5_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("privacy.s5_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s6_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("privacy.s6_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("privacy.s7_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("privacy.s7_text")}{" "}
            <a href="mailto:privacy@example.com" className="text-primary hover:underline">
              privacy@example.com
            </a>
            .
          </p>
        </section>

        <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{t("privacy.also_see")}</span>
          <a href="/terms" className="text-primary hover:underline">{t("terms.title")}</a>
          <span>·</span>
          <a href="/about" className="text-primary hover:underline">{t("about.title")}</a>
          <span>·</span>
          <a href="/contact" className="text-primary hover:underline">{t("contact.title")}</a>
        </div>
      </div>
    </div>
  );
}
