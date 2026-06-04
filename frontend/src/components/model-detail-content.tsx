"use client";

import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { useLocaleStore } from "@/stores/locale-store";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { SpecTable } from "@/components/spec-table";
import { ProsConsList } from "@/components/pros-cons-list";
import { FAQSection } from "@/components/faq-section";
import { InternalLinks } from "@/components/internal-links";
import {
  generateModelDescription,
  generateModelProsCons,
  generateModelFaqs,
} from "@/lib/content-generator";
import type { ModelDetail } from "@/types/model";

interface ModelDetailContentProps {
  model: ModelDetail;
}

export function ModelDetailContent({ model }: ModelDetailContentProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);

  const description = generateModelDescription(model, locale);
  const { pros, cons } = generateModelProsCons(model, locale);
  const faqs = generateModelFaqs(model, locale);

  const specRows = [
    { label: t("model_detail.family"), value: model.family },
    { label: t("model_detail.full_name"), value: model.name },
    {
      label: t("model_detail.parameters"),
      value: model.parameterCountB + " B",
      hint: (model.parameterCountB * 1e9).toLocaleString() + " " + t("model_detail.total_params"),
    },
    { label: t("model_detail.quantization"), value: model.quantization, unit: model.quantizationBits + "-bit" },
    {
      label: t("model_detail.vram_recommended"),
      value: model.recommendedVramGb,
      unit: t("model_detail.gb_unit"),
      hint: t("model_detail.vram_min") + " " + model.minVramGb + " " + t("model_detail.gb_unit"),
    },
    {
      label: t("model_detail.context_length"),
      value: model.contextLength.toLocaleString(),
      unit: t("model_detail.tokens_unit"),
    },
    ...(model.hiddenDim ? [{ label: t("model_detail.hidden_dim"), value: String(model.hiddenDim) }] : []),
    ...(model.numLayers ? [{ label: t("model_detail.layers"), value: String(model.numLayers) }] : []),
    { label: t("model_detail.quality_score"), value: model.qualityScore + t("model_detail.score_unit") },
    {
      label: t("model_detail.model_size"),
      value: ((model.parameterCountB * model.quantizationBits) / 8).toFixed(1) + " " + t("model_detail.gb_unit"),
      hint: t("model_detail.model_size_hint"),
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: t("model_detail.breadcrumb_models"), href: "/models" },
          { label: model.family, href: "/models?family=" + encodeURIComponent(model.family) },
          { label: model.name },
        ]}
      />

      <PageHeader
        title={model.name}
        description={description}
        badge={model.family}
      />

      <div className="space-y-10">
        <SpecTable rows={specRows} />
        <ProsConsList pros={pros} cons={cons} />

        <section className="flex flex-wrap gap-3">
          {model.downloadUrl && (
            <a
              href={model.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("model_detail.download")}
            </a>
          )}
          {model.huggingfaceRepo && (
            <a
              href={model.huggingfaceRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              {t("model_detail.view_on_hf")}
            </a>
          )}
        </section>

        <FAQSection items={faqs} />

        <InternalLinks
          title={t("model_detail.explore_more")}
          links={[
            { href: "/models", label: t("model_detail.browse_models") },
            { href: "/gpus", label: t("model_detail.find_gpu") },
            { href: "/tools/recommend", label: t("model_detail.check_hardware") },
            { href: "/news", label: t("model_detail.read_guides") },
          ]}
        />
      </div>
    </article>
  );
}
