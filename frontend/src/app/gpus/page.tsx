import type { Metadata } from 'next';
import { GPUS_META } from '@/lib/seo';
import { GpuPageContent } from './page-content';

export const metadata: Metadata = GPUS_META;

async function fetchGpus() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(API_BASE + '/gpus?sort_by=benchmark_score&order=desc&size=200', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: [], total: 0, page: 1, size: 200 };
    const json = await res.json();
    // Map snake_case API fields to camelCase
    const rawItems = json.data?.items ?? [];
    const items = rawItems.map((g: Record<string, unknown>) => ({
      id: g.id as string,
      name: g.name as string,
      vendor: g.vendor as string,
      vramGb: (g.vram_gb as number) ?? 0,
      tier: g.tier as string,
      benchmarkScore: g.benchmark_score as number | undefined,
      flopsTflops: g.flops_tflops as number | undefined,
      memoryBandwidthGbS: g.memory_bandwidth_gb_s as number | undefined,
    }));
    return {
      items,
      total: json.data?.total ?? 0,
      page: json.data?.page ?? 1,
      size: json.data?.size ?? 200,
    };
  } catch {
    return { items: [], total: 0, page: 1, size: 200 };
  }
}

export default async function GpusPage() {
  const data = await fetchGpus();
  return <GpuPageContent initialData={data} />;
}
