import type { Metadata } from "next";
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
    if (json.success && json.data) return json.data;
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gpu = await fetchGpu(slug);
  if (!gpu) {
    return constructMetadata({
      title: "GPU Not Found",
      description: "The requested GPU could not be found.",
      path: `/gpus/${slug}`,
    });
  }

  return constructMetadata({
    title: `${gpu.name} — Specs, Compatible Models & LLM Performance`,
    description: `${gpu.name}: ${gpu.vramGb} GB VRAM, ${gpu.tier}-tier ${gpu.vendor} GPU. See full specs, compatible LLM models, upgrade suggestions, and deployment FAQs.`,
    path: `/gpus/${slug}`,
  });
}

export default async function GpuDetailPage({ params }: Props) {
  const { slug } = await params;
  const gpu = await fetchGpu(slug);

  if (!gpu) {
    notFound();
  }

  const description = generateGpuDescription(gpu);
  const { pros, cons } = generateGpuProsCons(gpu);
  const faqs = generateGpuFaqs(gpu);

  const vendorLabel =
    gpu.vendor === "nvidia"
      ? "NVIDIA"
      : gpu.vendor === "amd"
        ? "AMD"
        : gpu.vendor === "apple"
          ? "Apple"
          : gpu.vendor === "intel"
            ? "Intel"
            : gpu.vendor;

  const tierLabels: Record<string, string> = {
    entry: "Entry",
    mid: "Mid-Range",
    high: "High-End",
    enthusiast: "Enthusiast",
  };

  const specRows = [
    { label: "Vendor", value: vendorLabel },
    { label: "Full Name", value: gpu.name },
    { label: "VRAM", value: gpu.vramGb, unit: "GB" },
    { label: "Performance Tier", value: tierLabels[gpu.tier] ?? gpu.tier },
    ...(gpu.benchmarkScore != null
      ? [{ label: "Benchmark Score", value: gpu.benchmarkScore.toLocaleString() }]
      : []),
    ...(gpu.flopsTflops != null
      ? [{ label: "FP32 Compute", value: gpu.flopsTflops, unit: "TFLOPS" }]
      : []),
    ...(gpu.memoryBandwidthGbS != null
      ? [
          {
            label: "Memory Bandwidth",
            value: gpu.memoryBandwidthGbS,
            unit: "GB/s",
          },
        ]
      : []),
    {
      label: "Compatible Models",
      value: gpu.compatibleModels?.length ?? 0,
      hint: "Models that can run on this GPU",
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: "GPU Database", href: "/gpus" },
          { label: vendorLabel, href: `/gpus?vendor=${gpu.vendor}` },
          { label: gpu.name },
        ]}
      />

      <PageHeader
        title={gpu.name}
        description={description}
        badge={`${vendorLabel} · ${tierLabels[gpu.tier] ?? gpu.tier}`}
      />

      <div className="space-y-10">
        {/* Specs table */}
        <SpecTable rows={specRows} />

        {/* Pros & Cons */}
        <ProsConsList pros={pros} cons={cons} />

        {/* Compatible models */}
        {gpu.compatibleModels && gpu.compatibleModels.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Compatible Models ({gpu.compatibleModels.length})
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
            {gpu.compatibleModels.length > 12 && (
              <p className="mt-4 text-sm text-muted-foreground">
                + {gpu.compatibleModels.length - 12} more models. Check the{" "}
                <a href="/models" className="text-primary hover:underline">
                  Model Library
                </a>{" "}
                for the complete list.
              </p>
            )}
          </section>
        )}

        {/* FAQ */}
        <FAQSection items={faqs} />

        {/* Internal links */}
        <InternalLinks
          title="Explore More"
          links={[
            { href: "/gpus", label: "Browse all GPUs" },
            { href: "/models", label: "Browse compatible models" },
            { href: "/tools/recommend", label: "Check your hardware" },
            { href: "/news", label: "Read GPU deployment guides" },
          ]}
        />
      </div>
    </article>
  );
}
