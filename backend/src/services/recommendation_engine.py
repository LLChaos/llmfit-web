"""Recommendation Engine — orchestrates GPU mapping, scoring, filtering, and sorting.

Single entry point for the recommendation pipeline.
"""

from src.repositories.interfaces import IGpuRepository, IModelRepository
from src.services.gpu_mapper import GpuMapper
from src.services.scoring import (
    score_quality,
    score_speed,
    score_compatibility,
    score_context,
    calculate_total_score,
)
from src.schemas.hardware import HardwareInput, HardwareInfo
from src.schemas.recommendation import (
    ModelScores,
    RecommendedModel,
    UpgradeImprovement,
    UpgradeSuggestion,
    RecommendationResponse,
)
from src.utils.vram import estimate_vram_simple, estimate_tps


class RecommendationEngine:
    """Core recommendation engine.

    Pipeline:
        1. GPU Mapping — resolve browser GPU name to full spec
        2. Model Filtering — find runnable models for this GPU
        3. Scoring — evaluate each model across 4 dimensions
        4. Sorting — rank by composite score descending
        5. Upgrades — suggest GPU upgrades that unlock more models
    """

    TOP_N = 10

    def __init__(
        self,
        gpu_repo: IGpuRepository,
        model_repo: IModelRepository,
        gpu_mapper: GpuMapper,
    ) -> None:
        self._gpu_repo = gpu_repo
        self._model_repo = model_repo
        self._gpu_mapper = gpu_mapper

    def recommend(self, hardware: HardwareInput) -> RecommendationResponse:
        """Run full recommendation pipeline.

        Args:
            hardware: Browser-detected hardware profile.

        Returns:
            Complete recommendation response with ranked models and upgrade tips.
        """
        # Step 1: Map GPU name to full spec
        gpu = self._gpu_mapper.map(hardware.gpu_name)
        vram_available = gpu["vram_gb"]

        # Step 2: Build resolved hardware info
        hardware_info = HardwareInfo(
            gpu_name=gpu["name"],  # type: ignore[arg-type]
            vram_gb=vram_available,  # type: ignore[arg-type]
            gpu_tier=gpu["tier"],  # type: ignore[arg-type]
            ram_gb=hardware.ram_gb,
            cpu_cores=hardware.cpu_cores,
            os=hardware.os,
        )

        # Step 3: Get and score runnable models
        candidates = self._model_repo.get_runnable_models(vram_available)  # type: ignore[arg-type]
        scored = self._score_models(candidates, gpu, vram_available)  # type: ignore[arg-type]

        # Step 4: Sort by total score descending
        scored.sort(key=lambda x: x[1]["total"], reverse=True)

        # Step 5: Build top N recommendations
        recommendations = []
        for rank, (model, scores_dict) in enumerate(
            scored[: self.TOP_N], start=1
        ):
            estimated_vram = estimate_vram_simple(
                model["parameter_count_b"],  # type: ignore[arg-type]
                model["quantization_bits"],  # type: ignore[arg-type]
            )
            tps = estimate_tps(
                num_params=int(model["parameter_count_b"] * 1e9),  # type: ignore[operator]
                batch_size=1,
                gpu_flops=gpu["flops_tflops"] * 1e12,  # type: ignore[operator]
                gpu_bandwidth_gb_s=gpu["memory_bandwidth_gb_s"],  # type: ignore[arg-type]
            )

            recommendations.append(
                RecommendedModel(
                    model_id=model["id"],  # type: ignore[arg-type]
                    rank=rank,
                    scores=ModelScores(**scores_dict),
                    estimated_vram_gb=round(estimated_vram, 1),
                    estimated_tokens_per_sec=round(tps, 1),
                    runnable=True,
                )
            )

        # Step 6: Generate upgrade suggestions
        upgrades = self._generate_upgrades(gpu)

        return RecommendationResponse(
            hardware=hardware_info,
            recommendations=recommendations,
            upgrade_suggestions=upgrades,
        )

    def _score_models(
        self, models: list[dict[str, object]], gpu: dict[str, object], vram_available: float
    ) -> list[tuple[dict[str, object], dict[str, float]]]:
        """Score each model across all 4 dimensions."""
        results: list[tuple[dict[str, object], dict[str, float]]] = []
        for model in models:
            scores: dict[str, float] = {
                "quality": score_quality(model),
                "speed": score_speed(model, gpu),
                "compatibility": score_compatibility(
                    vram_available, model["recommended_vram_gb"]  # type: ignore[arg-type]
                ),
                "context": score_context(model, vram_available),
            }
            scores["total"] = calculate_total_score(scores)
            results.append((model, scores))
        return results

    def _generate_upgrades(
        self, current_gpu: dict[str, object]
    ) -> list[UpgradeSuggestion]:
        """Generate upgrade suggestions based on next-tier GPUs.

        For each tier above current, picks the best GPU (by benchmark_score).
        Limits to top 3 upgrade paths.
        """
        next_tier_gpus = self._gpu_repo.get_next_tier_gpus(
            current_gpu["tier"]  # type: ignore[arg-type]
        )
        if not next_tier_gpus:
            return []

        # Group by tier, pick best GPU in each tier
        tier_best: dict[str, dict[str, object]] = {}
        for gpu in next_tier_gpus:
            tier = gpu["tier"]  # type: ignore[typeddict-item]
            if (
                tier not in tier_best
                or gpu["benchmark_score"]  # type: ignore[typeddict-item]
                > tier_best[tier]["benchmark_score"]  # type: ignore[typeddict-item]
            ):
                tier_best[tier] = gpu

        current_vram = current_gpu["vram_gb"]  # type: ignore[typeddict-item]
        current_score = current_gpu["benchmark_score"]  # type: ignore[typeddict-item]

        suggestions: list[UpgradeSuggestion] = []
        for tier in ["mid", "high", "enthusiast"]:
            if tier not in tier_best:
                continue
            gpu = tier_best[tier]

            vram_delta = gpu["vram_gb"] - current_vram  # type: ignore[operator]
            speed_boost = (
                (gpu["benchmark_score"] - current_score)  # type: ignore[operator]
                / current_score  # type: ignore[operator]
                * 100.0
            )

            # Find models unlocked by this upgrade
            current_runnable = {
                m["id"]
                for m in self._model_repo.get_runnable_models(current_vram)  # type: ignore[arg-type]
            }
            upgraded_runnable = {
                m["id"]
                for m in self._model_repo.get_runnable_models(
                    gpu["vram_gb"]  # type: ignore[arg-type]
                )
            }
            unlocked = sorted(upgraded_runnable - current_runnable)[:5]

            suggestions.append(
                UpgradeSuggestion(
                    current_gpu=current_gpu["name"],  # type: ignore[typeddict-item]
                    suggested_gpu=gpu["name"],  # type: ignore[typeddict-item]
                    improvement=UpgradeImprovement(
                        vram_delta_gb=round(vram_delta, 1),  # type: ignore[arg-type]
                        speed_boost_pct=round(speed_boost, 1),  # type: ignore[arg-type]
                        unlocks_models=unlocked,
                    ),
                )
            )

        # Return top 3 sorted by VRAM delta (smallest upgrade first)
        suggestions.sort(key=lambda s: s.improvement.vram_delta_gb)
        return suggestions[:3]
