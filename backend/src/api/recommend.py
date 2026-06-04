"""Recommendation endpoint."""

from fastapi import APIRouter, Depends

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
    limit: int = 10,
    gpu_repo: IGpuRepository = Depends(get_gpu_repo),
    model_repo: IModelRepository = Depends(get_model_repo),
) -> ApiResponse[RecommendationResponse]:
    """Submit hardware profile and get ranked model recommendations.

    Query params:
        limit: Max recommendations to return. Set to 0 for all compatible models.
    """
    gpu_mapper = GpuMapper(gpu_repo)
    engine = RecommendationEngine(
        gpu_repo=gpu_repo,
        model_repo=model_repo,
        gpu_mapper=gpu_mapper,
    )

    try:
        effective_limit = limit if limit > 0 else None  # 0 = return all
        result = engine.recommend(hardware, top_n=effective_limit)
        return ApiResponse.ok(result)
    except GpuMappingError as exc:
        # Return HTTP 200 with error payload per project API convention
        return ApiResponse.fail(str(exc))
