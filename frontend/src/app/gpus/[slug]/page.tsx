import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { SpecTable } from "@/components/spec-table";
import { ProsConsList } from "@/components/pros-cons-list";
import { FAQSection } from "@/components/faq-section";
import { InternalLinks } from "@/components/internal-links";
import { ModelCardLink } from "@/components/model-card-link";
import { constructMetadata } from "@/lib/seo";
import {
  generateGpuDescription,
  generateGpuProsCons,
  generateGpuFaqs,
} from "@/lib/content-generator";
import type { GpuDetail } from "@/types/hardware";

// Server-side i18n: import both dictionaries and pick by locale
import zhDict from "@/lib/i18n/zh.json";
import enDict from "@/lib/i18n/en.json";

type Locale = "zh" | "en";
type Dict = Record<string, string>;

const DICTS: Record<Locale, Dict> = { zh: zhDict, en: enDict };

function t(locale: Locale, key: string, replacements?: Record<string, string>): string {
  const dict = DICTS[locale] ?? DICTS.zh;
  let value = dict[key] ?? key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      value = value.replace(`{${k}}`, v);
    }
  }
  return value;
}

/** Detect locale from Accept-Language header. Defaults to "zh". */
async function detectLocale(): Promise<Locale> {
  try {
    const h = await headers();
    const acceptLang = h.get("accept-language") ?? "";
    if (acceptLang.startsWith("zh")) return "zh";
    if (acceptLang.startsWith("en")) return "en";
    return "zh";
  } catch {
    return "zh";
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchGpu(slug: string): Promise<GpuDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/gpus/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;

    const raw = json.data as Record<string, unknown>;
    return {
      id: raw.id as string,
      name: raw.name as string,
      vendor: raw.vendor as string,
      vramGb: (raw.vram_gb as number) ?? 0,
      tier: raw.tier as string,
      benchmarkScore: raw.benchmark_score as number | undefined,
      flopsTflops: raw.flops_tflops as number | undefined,
      memoryBandwidthGbS: raw.memory_bandwidth_gb_s as number | undefined,
      compatibleModels: (raw.compatible_models as Array<Record<string, unknown>>)?.map(
        (m) => ({
          id: m.id as string,
          family: m.family as string,
          name: m.name as string,
          parameterCountB: m.parameter_count_b as number,
          quantization: m.quantization as string,
          quantizationBits: m.quantization_bits as number,
          minVramGb: m.min_vram_gb as number,
          recommendedVramGb: m.recommended_vram_gb as number,
          contextLength: m.context_length as number,
          qualityScore: m.quality_score as number,
        }),
      ) ?? [],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gpu = await fetchGpu(slug);
  const locale = await detectLocale();

  if (!gpu) {
    return constructMetadata({
      title: t(locale, "gpu_detail.not_found_title"),
      description: t(locale, "gpu_detail.not_found_description"),
      path: `/gpus/${slug}`,
    });
  }

  const vendorLabel =
    gpu.vendor === "nvidia" ? "NVIDIA"
    : gpu.vendor === "amd" ? "AMD"
    : gpu.vendor === "apple" ? "Apple"
    : gpu.vendor === "intel" ? "Intel"
    : gpu.vendor;

  const tierLabels: Record<string, string> = {
    entry: t(locale, "hardware.tier.entry"),
    mid: t(locale, "hardware.tier.mid"),
    high: t(locale, "hardware.tier.high"),
    enthusiast: t(locale, "hardware.tier.enthusiast"),
  };

  const tierText = tierLabels[gpu.tier] ?? gpu.tier;

  const title = t(locale, "seo.gpu_detail_title", {
    name: gpu.name,
  });
  const description = t(locale, "seo.gpu_detail_description", {
    name: gpu.name,
    vram: String(gpu.vramGb),
    tier: tierText,
    vendor: vendorLabel,
  });

  return constructMetadata({
    title,
    description,
    path: `/gpus/${slug}`,
  });
}

export default async function GpuDetailPage({ params }: Props) {
  const { slug } = await params;
  const gpu = await fetchGpu(slug);
  const locale = await detectLocale();

  if (!gpu) {
    notFound();
  }

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
    entry: t(locale, "hardware.tier.entry"),
    mid: t(locale, "hardware.tier.mid"),
    high: t(locale, "hardware.tier.high"),
    enthusiast: t(locale, "hardware.tier.enthusiast"),
  };

  const tierText = tierLabels[gpu.tier] ?? gpu.tier;

  const specRows = [
    { label: t(locale, "gpu_detail.vendor"), value: vendorLabel },
    { label: t(locale, "gpu_detail.full_name"), value: gpu.name },
    { label: t(locale, "gpu_detail.vram"), value: gpu.vramGb, unit: "GB" },
    { label: t(locale, "gpu_detail.performance_tier"), value: tierText },
    ...(gpu.benchmarkScore != null
      ? [{ label: t(locale, "gpu_detail.benchmark_score"), value: gpu.benchmarkScore.toLocaleString() }]
      : []),
    ...(gpu.flopsTflops != null
      ? [{ label: t(locale, "gpu_detail.fp32_compute"), value: gpu.flopsTflops, unit: "TFLOPS" }]
      : []),
    ...(gpu.memoryBandwidthGbS != null
      ? [{
          label: t(locale, "gpu_detail.memory_bandwidth"),
          value: gpu.memoryBandwidthGbS,
          unit: "GB/s",
        }]
      : []),
    {
      label: t(locale, "gpu_detail.compatible_models"),
      value: gpu.compatibleModels?.length ?? 0,
      hint: t(locale, "gpu_detail.compatible_models_hint"),
    },
  ];

  const compatCount = gpu.compatibleModels?.length ?? 0;

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: t(locale, "gpu_detail.breadcrumb_gpus"), href: "/gpus" },
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
        <SpecTable rows={specRows} title={t(locale, "gpu_detail.specs_title")} />

        {/* Pros & Cons */}
        <ProsConsList
          pros={pros}
          cons={cons}
          prosTitle={t(locale, "gpu_detail.strengths")}
          consTitle={t(locale, "gpu_detail.limitations")}
        />

        {/* Compatible models */}
        {gpu.compatibleModels && compatCount > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {t(locale, "gpu_detail.compatible_models_title")} ({compatCount})
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
                {t(locale, "gpu_detail.more_models_prefix")}
                {compatCount - 12}
                {t(locale, "gpu_detail.more_models_suffix")}
                {" "}
                <Link href="/models" className="text-primary hover:underline">
                  {t(locale, "gpu_detail.model_library")}
                </Link>
                {t(locale, "gpu_detail.complete_list")}
              </p>
            )}
          </section>
        )}

        {/* FAQ */}
        <FAQSection
          items={faqs}
          title={t(locale, "gpu_detail.faq_title")}
        />

        {/* Internal links */}
        <InternalLinks
          title={t(locale, "gpu_detail.explore_more")}
          links={[
            { href: "/gpus", label: t(locale, "gpu_detail.browse_all_gpus") },
            { href: "/models", label: t(locale, "gpu_detail.browse_models") },
            { href: "/tools/recommend", label: t(locale, "gpu_detail.check_hardware") },
            { href: "/news", label: t(locale, "gpu_detail.read_guides") },
          ]}
        />
      </div>
    </article>
  );
}
