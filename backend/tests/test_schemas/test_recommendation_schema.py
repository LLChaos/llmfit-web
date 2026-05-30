"""Tests for recommendation schemas."""

import pytest
from pydantic import ValidationError

from src.schemas.hardware import HardwareInfo
from src.schemas.recommendation import (
    ModelScores,
    RecommendedModel,
    RecommendationResponse,
    UpgradeSuggestion,
    UpgradeImprovement,
)


class TestModelScores:
    def test_valid_scores(self) -> None:
        scores = ModelScores(
            quality=85.0, speed=72.0, compatibility=88.0, context=60.0, total=78.5
        )
        assert scores.total == 78.5

    def test_score_out_of_range_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            ModelScores(
                quality=150, speed=72, compatibility=88, context=60, total=78
            )


class TestRecommendationResponse:
    def test_build_response(self) -> None:
        hw = HardwareInfo(
            gpu_name="RTX 3060",
            vram_gb=12.0,
            gpu_tier="mid",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        recs = [
            RecommendedModel(
                model_id="qwen3-8b-q4",
                rank=1,
                scores=ModelScores(
                    quality=85, speed=72, compatibility=88, context=60, total=78.5
                ),
                estimated_vram_gb=5.2,
                estimated_tokens_per_sec=45.0,
                runnable=True,
            )
        ]
        upgrades = [
            UpgradeSuggestion(
                current_gpu="NVIDIA GeForce RTX 3060",
                suggested_gpu="NVIDIA GeForce RTX 5070",
                improvement=UpgradeImprovement(
                    vram_delta_gb=4.0,
                    speed_boost_pct=40.0,
                    unlocks_models=["llama3.1-70b-q4"],
                ),
            )
        ]
        response = RecommendationResponse(
            hardware=hw,
            recommendations=recs,
            upgrade_suggestions=upgrades,
        )
        assert response.hardware.gpu_name == "RTX 3060"
        assert len(response.recommendations) == 1
        assert response.recommendations[0].runnable is True

    def test_serialization_camelcase(self) -> None:
        hw = HardwareInfo(
            gpu_name="RTX 3060",
            vram_gb=12.0,
            gpu_tier="mid",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        response = RecommendationResponse(
            hardware=hw,
            recommendations=[],
            upgrade_suggestions=[],
        )
        data = response.model_dump(by_alias=True)
        assert "upgradeSuggestions" in data
        assert "hardware" in data
        assert data["hardware"]["gpuName"] == "RTX 3060"
