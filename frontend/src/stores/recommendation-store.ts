"use client";

import { create } from "zustand";
import type { RecommendedModel } from "@/types/recommendation";

export type SortKey = "total" | "quality" | "speed";

interface RecommendationState {
  /** Sort preference */
  sortBy: SortKey;
  /** Selected model for detail modal (null = modal closed) */
  selectedModel: RecommendedModel | null;

  setSortBy: (key: SortKey) => void;
  selectModel: (model: RecommendedModel | null) => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  sortBy: "total",
  selectedModel: null,
  setSortBy: (sortBy) => set({ sortBy }),
  selectModel: (selectedModel) => set({ selectedModel }),
}));
