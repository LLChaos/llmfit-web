import type { ModelListItem } from "@/types/model";
import { ModelCardFeatured } from "@/components/model-card-featured";
import { FeaturedModelsHeader } from "@/components/featured-models-header";

async function fetchFeaturedModels(): Promise<ModelListItem[]> {
  try {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const url = `${API_BASE}/models?sort_by=quality_score&order=desc&size=6`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items ?? [];
  } catch {
    return [];
  }
}

export async function FeaturedModelsSection() {
  const models = await fetchFeaturedModels();

  if (models.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <FeaturedModelsHeader />

      {/* 3-column responsive grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <ModelCardFeatured key={model.id} model={model} />
        ))}
      </div>
    </section>
  );
}
