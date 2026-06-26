import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GpuDetailContent } from "@/components/gpu-detail-content";
import { constructMetadata } from "@/lib/seo";
import type { GpuDetail } from "@/types/hardware";

// Server-side i18n for metadata (must stay server-side — reads HTTP headers)
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

  const title = t(locale, "seo.gpu_detail_title", { name: gpu.name });
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

  if (!gpu) {
    notFound();
  }

  return <GpuDetailContent gpu={gpu} />;
}
