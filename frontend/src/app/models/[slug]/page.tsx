import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { SpecTable } from "@/components/spec-table";
import { ProsConsList } from "@/components/pros-cons-list";
import { FAQSection } from "@/components/faq-section";
import { InternalLinks } from "@/components/internal-links";
import { constructMetadata } from "@/lib/seo";
import {
  generateModelDescription,
  generateModelProsCons,
  generateModelFaqs,
} from "@/lib/content-generator";
import type { ModelDetail } from "@/types/model";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchModel(slug: string): Promise<ModelDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/models/${encodeURIComponent(slug)}`, {
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
  const model = await fetchModel(slug);
  if (!model) {
    return constructMetadata({
      title: "Model Not Found",
      description: "The requested model could not be found.",
      path: `/models/${slug}`,
    });
  }

  return constructMetadata({
    title: `${model.name} — Specs, VRAM Requirements & GPU Recommendations`,
    description: `${model.name} is a ${model.parameterCountB}B parameter ${model.family} model (${model.quantization} quantization). Requires ${model.recommendedVramGb} GB VRAM, ${model.contextLength.toLocaleString()} context. See full specs, pros/cons, and compatible GPUs.`,
    path: `/models/${slug}`,
  });
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const model = await fetchModel(slug);

  if (!model) {
    notFound();
  }

  const description = generateModelDescription(model);
  const { pros, cons } = generateModelProsCons(model);
  const faqs = generateModelFaqs(model);

  const specRows = [
    { label: "Family", value: model.family },
    { label: "Full Name", value: model.name },
    {
      label: "Parameters",
      value: `${model.parameterCountB} B`,
      hint: `${(model.parameterCountB * 1e9).toLocaleString()} total parameters`,
    },
    { label: "Quantization", value: model.quantization, unit: `${model.quantizationBits}-bit` },
    {
      label: "VRAM (Recommended)",
      value: model.recommendedVramGb,
      unit: "GB",
      hint: `Minimum ${model.minVramGb} GB`,
    },
    {
      label: "Context Length",
      value: model.contextLength.toLocaleString(),
      unit: "tokens",
    },
    ...(model.hiddenDim ? [{ label: "Hidden Dimension", value: model.hiddenDim }] : []),
    ...(model.numLayers ? [{ label: "Layers", value: model.numLayers }] : []),
    { label: "Quality Score", value: `${model.qualityScore}/100` },
    {
      label: "Model Size (est.)",
      value: `${((model.parameterCountB * model.quantizationBits) / 8).toFixed(1)} GB`,
      hint: "Approximate file size at this quantization",
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb
        segments={[
          { label: "Model Library", href: "/models" },
          { label: model.family, href: `/models?family=${encodeURIComponent(model.family)}` },
          { label: model.name },
        ]}
      />

      <PageHeader
        title={model.name}
        description={description}
        badge={model.family}
      />

      <div className="space-y-10">
        {/* Specs table */}
        <SpecTable rows={specRows} />

        {/* Pros & Cons */}
        <ProsConsList pros={pros} cons={cons} />

        {/* Download / external links */}
        <section className="flex flex-wrap gap-3">
          {model.downloadUrl && (
            <a
              href={model.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Download Model
            </a>
          )}
          {model.huggingfaceRepo && (
            <a
              href={model.huggingfaceRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              View on HuggingFace
            </a>
          )}
        </section>

        {/* FAQ */}
        <FAQSection items={faqs} />

        {/* Internal links */}
        <InternalLinks
          title="Explore More"
          links={[
            { href: "/models", label: "Browse all models" },
            { href: "/gpus", label: "Find a compatible GPU" },
            { href: "/tools/recommend", label: "Check your hardware" },
            { href: "/news", label: "Read deployment guides" },
          ].filter(Boolean)}
        />
      </div>
    </article>
  );
}
