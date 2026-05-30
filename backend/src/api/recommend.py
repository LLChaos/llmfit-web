"""Recommendation endpoint."""

import os

from fastapi import APIRouter, HTTPException

from src.core.exceptions import GpuNotFoundError
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.repositories.json_model_repository import JsonModelRepository
from src.schemas.common import ApiResponse
from src.schemas.hardware import HardwareInput
from src.schemas.recommendation import RecommendationResponse
from src.services.gpu_mapper import GpuMapper, GpuMappingError
from src.services.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/recommend", tags=["recommend"])

# --- Bootstrap (Phase 2: JSON repos; Phase 4: SQL repos via FastAPI Depends) ---
_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_gpu_repo = JsonGpuRepository(os.path.join(_DATA_DIR, "mock_gpu_specs.json"))
_model_repo = JsonModelRepository(os.path.join(_DATA_DIR, "mock_models.json"))
_gpu_mapper = GpuMapper(_gpu_repo)
_engine = RecommendationEngine(
    gpu_repo=_gpu_repo,
    model_repo=_model_repo,
    gpu_mapper=_gpu_mapper,
)


@router.post("", response_model=ApiResponse[RecommendationResponse])
async def recommend(
    hardware: HardwareInput,
) -> ApiResponse[RecommendationResponse]:
    """Submit hardware profile and get ranked model recommendations."""
    try:
        result = _engine.recommend(hardware)
        return ApiResponse.ok(result)
    except GpuMappingError as exc:
        raise HTTPException(
            status_code=404,
            detail={"message": str(exc)},
        ) from exc
