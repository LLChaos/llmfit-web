import type { Metadata } from "next";
import { NEWS_META } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { NewsPageContent } from "./page-content";

export const metadata: Metadata = NEWS_META;

async function fetchPublishedPosts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/news?page=1&size=24`, {
      next: { revalidate: 1800 }, // ISR: revalidate every 30 minutes
    });
    if (!res.ok) {
      return { items: [], total: 0, page: 1, size: 24 };
    }
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return { items: [], total: 0, page: 1, size: 24 };
  } catch {
    return { items: [], total: 0, page: 1, size: 24 };
  }
}

export default async function NewsPage() {
  const data = await fetchPublishedPosts();

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4">
        <Breadcrumb segments={[{ label: "Latest News" }]} />
      </div>
      <NewsPageContent initialData={data} />
    </div>
  );
}
