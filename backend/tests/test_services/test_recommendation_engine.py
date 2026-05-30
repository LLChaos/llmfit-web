"""Tests for RecommendationEngine."""

import pytest
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.repositories.json_model_repository import JsonModelRepository
from src.services.gpu_mapper import GpuMapper, GpuMappingError
from src.services.recommendation_engine import RecommendationEngine
from src.schemas.hardware import HardwareInput


@pytest.fixture
def engine(data_dir):
    """Create a real RecommendationEngine with JSON repositories."""
    gpu_repo = JsonGpuRepository(data_dir / "mock_gpu_specs.json")
    model_repo = JsonModelRepository(data_dir / "mock_models.json")
    gpu_mapper = GpuMapper(gpu_repo)
    return RecommendationEngine(
        gpu_repo=gpu_repo,
        model_repo=model_repo,
        gpu_mapper=gpu_mapper,
    )


class TestRecommendationEngine:
    def test_recommend_returns_ordered_results(self, engine) -> None:
        """Recommendations sorted by total score descending."""
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert len(response.recommendations) > 0
        scores = [r.scores.total for r in response.recommendations]
        assert scores == sorted(scores, reverse=True)

    def test_recommend_includes_hardware_info(self, engine) -> None:
        """Response must include resolved hardware info."""
        hw = HardwareInput(
            gpu_name="RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert response.hardware.gpu_name == "NVIDIA GeForce RTX 3060"
        assert response.hardware.vram_gb == 12.0
        assert response.hardware.gpu_tier == "mid"

    def test_recommend_all_runnable_models_have_scores(self, engine) -> None:
        """Every recommended model must have complete scores."""
        hw = HardwareInput(
            gpu_name="RTX 4090",
            ram_gb=64.0,
            cpu_cores=32,
            os="Windows",
        )
        response = engine.recommend(hw)
        for rec in response.recommendations:
            assert rec.scores.quality > 0
            assert rec.scores.speed > 0
            assert rec.scores.compatibility > 0
            assert rec.scores.context > 0
            assert rec.scores.total > 0
            assert rec.runnable is True

    def test_recommend_top_count_is_10_or_less(self, engine) -> None:
        """At most 10 recommendations returned."""
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 4090",
            ram_gb=64.0,
            cpu_cores=32,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert len(response.recommendations) <= 10

    def test_recommend_with_low_vram_gpu_returns_fewer_models(self, engine) -> None:
        """Low VRAM GPU should have fewer runnable models."""
        hw_low = HardwareInput(
            gpu_name="NVIDIA GeForce GTX 1650",
            ram_gb=8.0,
            cpu_cores=4,
            os="Windows",
        )
        hw_high = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 4090",
            ram_gb=64.0,
            cpu_cores=32,
            os="Windows",
        )
        resp_low = engine.recommend(hw_low)
        resp_high = engine.recommend(hw_high)
        assert len(resp_low.recommendations) <= len(resp_high.recommendations)

    def test_recommend_generates_upgrade_suggestions(self, engine) -> None:
        """Entry-level GPU should get upgrade suggestions."""
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce GTX 1650",
            ram_gb=8.0,
            cpu_cores=4,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert len(response.upgrade_suggestions) > 0
        for suggestion in response.upgrade_suggestions:
            assert suggestion.current_gpu == "NVIDIA GeForce GTX 1650"
            assert suggestion.suggested_gpu != ""
            assert suggestion.improvement.vram_delta_gb > 0

    def test_recommend_top_tier_gpu_has_no_upgrade(self, engine) -> None:
        """Enthusiast tier GPU should have no upgrades."""
        hw = HardwareInput(
            gpu_name="NVIDIA A100",
            ram_gb=256.0,
            cpu_cores=64,
            os="Linux",
        )
        response = engine.recommend(hw)
        assert len(response.upgrade_suggestions) == 0

    def test_recommend_unknown_gpu_raises_error(self, engine) -> None:
        """Unknown GPU should raise GpuMappingError."""
        hw = HardwareInput(
            gpu_name="Nonexistent GPU XYZ",
            ram_gb=16.0,
            cpu_cores=8,
            os="Windows",
        )
        with pytest.raises(GpuMappingError):
            engine.recommend(hw)
