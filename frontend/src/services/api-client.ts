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

  const json: ApiResult<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message || `API error: ${res.status}`);
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
};
