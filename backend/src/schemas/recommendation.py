"""Recommendation-related Pydantic schemas."""

from pydantic import Field
from src.schemas.common import BaseSchema
from src.schemas.hardware import HardwareInfo


class ModelScores(BaseSchema):
    """Scoring breakdown for a recommended model."""

    quality: float = Field(..., ge=0, le=100)
    speed: float = Field(..., ge=0, le=100)
    compatibility: float = Field(..., ge=0, le=100)
    context: float = Field(..., ge=0, le=100)
    total: float = Field(..., ge=0, le=100)


class RecommendedModel(BaseSchema):
    """A single recommended model entry."""

    model_id: str
    rank: int
    scores: ModelScores
    estimated_vram_gb: float
    estimated_tokens_per_sec: float
    runnable: bool


class UpgradeImprovement(BaseSchema):
    """Improvement details for an upgrade suggestion."""

    vram_delta_gb: float
    speed_boost_pct: float
    unlocks_models: list[str]


class UpgradeSuggestion(BaseSchema):
    """Hardware upgrade suggestion."""

    current_gpu: str
    suggested_gpu: str
    improvement: UpgradeImprovement


class RecommendationResponse(BaseSchema):
    """Complete recommendation response."""

    hardware: HardwareInfo
    recommendations: list[RecommendedModel]
    upgrade_suggestions: list[UpgradeSuggestion]
