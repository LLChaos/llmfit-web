import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

interface SlugItem {
  id?: string;
  slug?: string;
  updated_at?: string;
}

async function fetchSlugs(
  endpoint: string,
  slugKey: 'id' | 'slug',
): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items: SlugItem[] = json.data?.items ?? [];
    return items.map((item) => {
      const slug = slugKey === 'id' ? item.id : item.slug;
      return {
        url: `${SITE_URL}${endpoint}/${encodeURIComponent(slug ?? '')}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: SITE_URL + '/models', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: SITE_URL + '/gpus', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: SITE_URL + '/news', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: SITE_URL + '/tools/recommend', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: SITE_URL + '/more-recommendations', lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: SITE_URL + '/about', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: SITE_URL + '/contact', lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: SITE_URL + '/privacy', lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: SITE_URL + '/terms', lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Dynamic pages from API
  const [models, gpus, news] = await Promise.allSettled([
    fetchSlugs('/models?size=200', 'id'),
    fetchSlugs('/gpus?size=200', 'id'),
    fetchSlugs('/news?size=100', 'slug'),
  ]);

  const dynamicPages: MetadataRoute.Sitemap = [
    ...(models.status === 'fulfilled' ? models.value : []),
    ...(gpus.status === 'fulfilled' ? gpus.value : []),
    ...(news.status === 'fulfilled' ? news.value : []),
  ];

  return [...staticPages, ...dynamicPages];
}
