import type { Metadata } from 'next';
import { MODELS_META } from '@/lib/seo';
import { ModelPageContent } from './page-content';

export const metadata: Metadata = MODELS_META;

async function fetchModels() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(API_BASE + '/models?sort_by=quality_score&order=desc&size=50', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: [], total: 0, page: 1, size: 50 };
    const json = await res.json();
    return {
      items: json.data?.items ?? [],
      total: json.data?.total ?? 0,
      page: json.data?.page ?? 1,
      size: json.data?.size ?? 50,
    };
  } catch {
    return { items: [], total: 0, page: 1, size: 50 };
  }
}

export default async function ModelsPage() {
  const data = await fetchModels();
  return <ModelPageContent initialData={data} />;
}
