"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { Mail, MessageSquare, Clock } from "lucide-react";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("contact.breadcrumb") }]} />

      <PageHeader
        title={t("contact.title")}
        description={t("contact.description")}
        badge={t("contact.badge")}
      />

      <div className="space-y-10">
        {/* Contact methods */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <Mail className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">{t("contact.email_title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <a href="mailto:contact@example.com" className="text-primary hover:underline break-all">
                contact@example.com
              </a>
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <MessageSquare className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">{t("contact.github_title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("contact.github_text")}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <Clock className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">{t("contact.response_title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("contact.response_text")}
            </p>
          </div>
        </div>

        {/* Contact form */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("contact.send_message")}</h2>
          <ContactForm />
        </section>

        {/* FAQ section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("contact.faq_title")}</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <h3 className="font-medium text-sm">
                  {t(`contact.faq${i}_q` as keyof typeof import("@/lib/i18n/zh.json"))}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(`contact.faq${i}_a` as keyof typeof import("@/lib/i18n/zh.json"))}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <div className="border-t border-border pt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{t("contact.also_see")}</span>
          <a href="/about" className="text-primary hover:underline">{t("about.title")}</a>
          <span>·</span>
          <a href="/privacy" className="text-primary hover:underline">{t("privacy.title")}</a>
          <span>·</span>
          <a href="/terms" className="text-primary hover:underline">{t("terms.title")}</a>
        </div>
      </div>
    </div>
  );
}
