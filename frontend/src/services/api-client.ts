import type { HardwareInput, GpuListItem, GpuDetail } from "@/types/hardware";
import type { RecommendationResponse } from "@/types/recommendation";
import type { ModelListItem, ModelDetail } from "@/types/model";
import type { NewsPostListItem, NewsPostDetail, NewsPostInput } from "@/types/news";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json = await res.json();

  // Unified error parsing — handles both formats:
  //   {"success": false, "error": {"message": "..."}}  (project convention)
  //   {"detail": {"message": "..."}}                   (FastAPI HTTPException)
  //   {"detail": "..."}                                 (FastAPI string detail)
  if (json.success === false || (!res.ok && !json.success)) {
    const message =
      json.error?.message ||
      json.detail?.message ||
      (typeof json.detail === "string" ? json.detail : undefined) ||
      `API error: ${res.status}`;
    throw new Error(message);
  }

  // FastAPI HTTPException returns non-2xx with {"detail": ...}
  if (!res.ok) {
    const message =
      json.detail?.message ||
      (typeof json.detail === "string" ? json.detail : undefined) ||
      `API error: ${res.status}`;
    throw new Error(message);
  }

  return json.data;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const apiClient = {
  /** Submit hardware profile and get recommendations. */
  recommend: (hardware: HardwareInput, limit?: number) => {
    const params = limit !== undefined ? `?limit=${limit}` : "";
    return request<RecommendationResponse>(`/recommend${params}`, {
      method: "POST",
      body: JSON.stringify(hardware),
    });
  },

  /** Get paginated model list. */
  listModels: (page = 1, size = 20, family?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (family) params.set("family", family);
    return request<PaginatedData<ModelListItem>>(`/models?${params}`);
  },

  /** Get model detail by ID. */
  getModel: (id: string) => request<ModelDetail>(`/models/${id}`),

  /** Search GPUs by name fragment for the manual selector. */
  searchGpus: (query: string) =>
    request<Array<{ name: string; vendor: string; vram_gb: number; tier: string }>>(
      `/gpus/search?q=${encodeURIComponent(query)}&limit=10`,
    ),

  /** Get paginated GPU list with optional filters. */
  listGpus: (page = 1, size = 24, vendor?: string, tier?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (vendor) params.set("vendor", vendor);
    if (tier) params.set("tier", tier);
    return request<PaginatedData<GpuListItem>>(`/gpus?${params}`);
  },

  /** Get GPU detail by slug ID, including compatible models. */
  getGpu: (slug: string) => request<GpuDetail>(`/gpus/${slug}`),

  /** Get paginated published news posts. */
  listNews: (page = 1, size = 12, category?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (category) params.set("category", category);
    return request<PaginatedData<NewsPostListItem>>(`/news?${params}`);
  },

  /** Get a single published news post by slug. */
  getNews: (slug: string) => request<NewsPostDetail>(`/news/${slug}`),

  /** Admin: list all news posts (requires password). */
  adminListNews: (password: string, page = 1, size = 20, includeDrafts = true) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      include_drafts: String(includeDrafts),
    });
    return request<PaginatedData<NewsPostListItem>>(`/admin/news?${params}`, {
      headers: { "X-Admin-Password": password },
    });
  },

  /** Admin: get any news post (requires password). */
  adminGetNews: (slug: string, password: string) =>
    request<NewsPostDetail>(`/admin/news/${slug}`, {
      headers: { "X-Admin-Password": password },
    }),

  /** Admin: create a news post (requires password). */
  adminCreateNews: (data: NewsPostInput, password: string) =>
    request<NewsPostDetail>("/admin/news", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
    }),

  /** Admin: update a news post (requires password). */
  adminUpdateNews: (slug: string, data: Partial<NewsPostInput>, password: string) =>
    request<NewsPostDetail>(`/admin/news/${slug}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
    }),

  /** Admin: delete a news post (requires password). */
  adminDeleteNews: (slug: string, password: string) =>
    request<{ deleted: boolean; slug: string }>(`/admin/news/${slug}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": password },
    }),
};
