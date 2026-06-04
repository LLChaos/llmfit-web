import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { constructMetadata } from "@/lib/seo";
import { ModelDetailContent } from "@/components/model-detail-content";
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

  return <ModelDetailContent model={model} />;
}
