"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("terms.breadcrumb") }]} />

      <PageHeader
        title={t("terms.title")}
        description={t("terms.description")}
        badge={t("terms.badge")}
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s1_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("terms.s1_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s2_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("terms.s2_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s3_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>{t("terms.s3_text1")}</strong>
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">{t("terms.s3_text2")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s4_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("terms.s4_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s5_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("terms.s5_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s6_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("terms.s6_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s7_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("terms.s7_text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t("terms.s8_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("terms.s8_text")}{" "}
            <a href="mailto:legal@example.com" className="text-primary hover:underline">
              legal@example.com
            </a>
            .
          </p>
        </section>

        <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{t("terms.also_see")}</span>
          <a href="/privacy" className="text-primary hover:underline">{t("privacy.title")}</a>
          <span>·</span>
          <a href="/about" className="text-primary hover:underline">{t("about.title")}</a>
          <span>·</span>
          <a href="/contact" className="text-primary hover:underline">{t("contact.title")}</a>
        </div>
      </div>
    </div>
  );
}
