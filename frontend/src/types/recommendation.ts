import type { HardwareInfo } from "./hardware";

/** Scoring breakdown for a recommended model. */
export interface ModelScores {
  quality: number;
  speed: number;
  compatibility: number;
  context: number;
  total: number;
}

/** A single recommended model entry. */
export interface RecommendedModel {
  modelId: string;
  rank: number;
  scores: ModelScores;
  estimatedVramGb: number;
  estimatedTokensPerSec: number;
  runnable: boolean;
  reason: string;
}

/** Improvement details for upgrade suggestion. */
export interface UpgradeImprovement {
  vramDeltaGb: number;
  speedBoostPct: number;
  unlocksModels: string[];
}

/** Hardware upgrade suggestion. */
export interface UpgradeSuggestion {
  currentGpu: string;
  suggestedGpu: string;
  improvement: UpgradeImprovement;
}

/** Complete recommendation response from backend. */
export interface RecommendationResponse {
  hardware: HardwareInfo;
  recommendations: RecommendedModel[];
  upgradeSuggestions: UpgradeSuggestion[];
}
