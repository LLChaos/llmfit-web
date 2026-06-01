"""Recommendation endpoint."""

from fastapi import APIRouter, Depends, HTTPException

from src.api.dependencies import get_gpu_repo, get_model_repo
from src.repositories.interfaces import IGpuRepository, IModelRepository
from src.schemas.common import ApiResponse
from src.schemas.hardware import HardwareInput
from src.schemas.recommendation import RecommendationResponse
from src.services.gpu_mapper import GpuMapper, GpuMappingError
from src.services.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("", response_model=ApiResponse[RecommendationResponse])
async def recommend(
    hardware: HardwareInput,
    gpu_repo: IGpuRepository = Depends(get_gpu_repo),
    model_repo: IModelRepository = Depends(get_model_repo),
) -> ApiResponse[RecommendationResponse]:
    """Submit hardware profile and get ranked model recommendations."""
    gpu_mapper = GpuMapper(gpu_repo)
    engine = RecommendationEngine(
        gpu_repo=gpu_repo,
        model_repo=model_repo,
        gpu_mapper=gpu_mapper,
    )

    try:
        result = engine.recommend(hardware)
        return ApiResponse.ok(result)
    except GpuMappingError as exc:
        raise HTTPException(
            status_code=404,
            detail={"message": str(exc)},
        ) from exc
