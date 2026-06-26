"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/stores/locale-store";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { SpecTable } from "@/components/spec-table";
import { ProsConsList } from "@/components/pros-cons-list";
import { FAQSection } from "@/components/faq-section";
import { InternalLinks } from "@/components/internal-links";
import { ModelCardLink } from "@/components/model-card-link";
import {
  generateGpuDescription,
  generateGpuProsCons,
  generateGpuFaqs,
} from "@/lib/content-generator";
import type { GpuDetail } from "@/types/hardware";

interface GpuDetailContentProps {
  gpu: GpuDetail;
}

export function GpuDetailContent({ gpu }: GpuDetailContentProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);

  const description = generateGpuDescription(gpu, locale);
  const { pros, cons } = generateGpuProsCons(gpu, locale);
  const faqs = generateGpuFaqs(gpu, locale);

  const vendorLabel =
    gpu.vendor === "nvidia" ? "NVIDIA"
    : gpu.vendor === "amd" ? "AMD"
    : gpu.vendor === "apple" ? "Apple"
    : gpu.vendor === "intel" ? "Intel"
    : gpu.vendor;

  const tierLabels: Record<string, string> = {
    entry: t("hardware.tier.entry"),
    mid: t("hardware.tier.mid"),
    high: t("hardware.tier.high"),
    enthusiast: t("hardware.tier.enthusiast"),
  };

  const tierText = tierLabels[gpu.tier] ?? gpu.tier;

  const specRows = [
    { label: t("gpu_detail.vendor"), value: vendorLabel },
    { label: t("gpu_detail.full_name"), value: gpu.name },
    { label: t("gpu_detail.vram"), value: gpu.vramGb, unit: "GB" },
    { label: t("gpu_detail.performance_tier"), value: tierText },
    ...(gpu.benchmarkScore != null
      ? [{ label: t("gpu_detail.benchmark_score"), value: gpu.benchmarkScore.toLocaleString() }]
      : []),
    ...(gpu.flopsTflops != null
      ? [{ label: t("gpu_detail.fp32_compute"), value: gpu.flopsTflops, unit: "TFLOPS" }]
      : []),
    ...(gpu.memoryBandwidthGbS != null
      ? [{
          label: t("gpu_detail.memory_bandwidth"),
          value: gpu.memoryBandwidthGbS,
          unit: "GB/s",
        }]
      : []),
    {
      label: t("gpu_detail.compatible_models"),
      value: gpu.compatibleModels?.length ?? 0,
      hint: t("gpu_detail.compatible_models_hint"),
    },
  ];

  const compatCount = gpu.compatibleModels?.length ?? 0;

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: t("gpu_detail.breadcrumb_gpus"), href: "/gpus" },
          { label: vendorLabel, href: `/gpus?vendor=${gpu.vendor}` },
          { label: gpu.name },
        ]}
      />

      <PageHeader
        title={gpu.name}
        description={description}
        badge={`${vendorLabel} · ${tierText}`}
      />

      <div className="space-y-10">
        {/* Specs table */}
        <SpecTable rows={specRows} title={t("gpu_detail.specs_title")} />

        {/* Pros & Cons */}
        <ProsConsList
          pros={pros}
          cons={cons}
          prosTitle={t("gpu_detail.strengths")}
          consTitle={t("gpu_detail.limitations")}
        />

        {/* Compatible models */}
        {gpu.compatibleModels && compatCount > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {t("gpu_detail.compatible_models_title")} ({compatCount})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {gpu.compatibleModels.slice(0, 12).map((m) => (
                <ModelCardLink
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  family={m.family}
                  parameterCountB={m.parameterCountB}
                  quantization={m.quantization}
                  recommendedVramGb={m.recommendedVramGb}
                  contextLength={m.contextLength}
                  qualityScore={m.qualityScore}
                />
              ))}
            </div>
            {compatCount > 12 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("gpu_detail.more_models_prefix")}
                {compatCount - 12}
                {t("gpu_detail.more_models_suffix")}
                {" "}
                <Link href="/models" className="text-primary hover:underline">
                  {t("gpu_detail.model_library")}
                </Link>
                {t("gpu_detail.complete_list")}
              </p>
            )}
          </section>
        )}

        {/* FAQ */}
        <FAQSection
          items={faqs}
          title={t("gpu_detail.faq_title")}
        />

        {/* Internal links */}
        <InternalLinks
          title={t("gpu_detail.explore_more")}
          links={[
            { href: "/gpus", label: t("gpu_detail.browse_all_gpus") },
            { href: "/models", label: t("gpu_detail.browse_models") },
            { href: "/tools/recommend", label: t("gpu_detail.check_hardware") },
            { href: "/news", label: t("gpu_detail.read_guides") },
          ]}
        />
      </div>
    </article>
  );
}
