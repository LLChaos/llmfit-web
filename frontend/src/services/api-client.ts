import type { HardwareInput } from "@/types/hardware";
import type { RecommendationResponse } from "@/types/recommendation";
import type { ModelListItem, ModelDetail } from "@/types/model";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: { message: string };
}

type ApiResult<T> = ApiSuccess<T> | ApiError;

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

export const apiClient = {
  /** Submit hardware profile and get recommendations. */
  recommend: (hardware: HardwareInput) =>
    request<RecommendationResponse>("/recommend", {
      method: "POST",
      body: JSON.stringify(hardware),
    }),

  /** Get paginated model list. */
  listModels: (page = 1, size = 20, family?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (family) params.set("family", family);
    return request<{
      items: ModelListItem[];
      total: number;
      page: number;
      size: number;
    }>(`/models?${params}`);
  },

  /** Get model detail by ID. */
  getModel: (id: string) => request<ModelDetail>(`/models/${id}`),

  /** Search GPUs by name fragment for the manual selector. */
  searchGpus: (query: string) =>
    request<Array<{ name: string; vendor: string; vram_gb: number; tier: string }>>(
      `/gpus/search?q=${encodeURIComponent(query)}&limit=10`,
    ),
};
