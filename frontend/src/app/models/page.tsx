import type { Metadata } from 'next';
import type { ModelListItem } from '@/types/model';
import { ModelCardFeatured } from '@/components/model-card-featured';
import { MODELS_META } from '@/lib/seo';

export const metadata: Metadata = MODELS_META;

async function fetchModels(): Promise<ModelListItem[]> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(API_BASE + '/models?sort_by=quality_score&order=desc&size=40', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items ?? [];
  } catch {
    return [];
  }
}

export default async function ModelsPage() {
  const models = await fetchModels();
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">模型库</h1>
      <p className="mb-8 text-muted-foreground">浏览全部开源大语言模型，按质量评分排序。</p>
      {models.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">暂无模型数据</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <ModelCardFeatured key={model.id} model={model} />
          ))}
        </div>
      )}
    </main>
  );
}
