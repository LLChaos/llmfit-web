"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { HardwareInput } from "@/types/hardware";

export function useRecommendations(
  hardware: HardwareInput | null,
  limit?: number,
) {
  return useQuery({
    queryKey: ["recommendations", hardware, limit],
    queryFn: () => apiClient.recommend(hardware!, limit),
    enabled: !!hardware,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}
