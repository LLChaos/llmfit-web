import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: SITE_URL + '/models', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: SITE_URL + '/gpus', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: SITE_URL + '/news', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: SITE_URL + '/tools/recommend', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: SITE_URL + '/about', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: SITE_URL + '/contact', lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: SITE_URL + '/privacy', lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: SITE_URL + '/terms', lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
