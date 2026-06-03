import type { Metadata } from 'next';
import { GPUS_META } from '@/lib/seo';

export const metadata: Metadata = GPUS_META;

async function fetchGpus(): Promise<Array<Record<string, unknown>>> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(API_BASE + '/gpus?sort_by=benchmark_score&order=desc&size=50', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items ?? [];
  } catch {
    return [];
  }
}

const TIER_LABELS: Record<string, string> = {
  entry: '入门', mid: '中端', high: '高端', enthusiast: '旗舰',
};

export default async function GpusPage() {
  const gpus = await fetchGpus();
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">GPU 库</h1>
      <p className="mb-8 text-muted-foreground">浏览全部 GPU 规格，按综合跑分排序。</p>
      {gpus.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">暂无 GPU 数据</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gpus.map((gpu) => (
            <div
              key={(gpu.id as string) || (gpu.name as string)}
              className="rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold">{gpu.name as string}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{gpu.vendor as string}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">显存</span>
                <span className="font-semibold">{gpu.vram_gb as number} GB</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">等级</span>
                <span className="text-xs">{TIER_LABELS[gpu.tier as string] || String(gpu.tier)}</span>
              </div>
              {(gpu.benchmark_score as number) != null && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>跑分</span>
                    <span>{gpu.benchmark_score as number}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: Math.min(100, ((gpu.benchmark_score as number) / 100) * 100) + '%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
