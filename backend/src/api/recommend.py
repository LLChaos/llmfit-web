"""Recommendation endpoint - Phase 3 implementation."""

from fastapi import APIRouter

from src.schemas.common import ApiResponse

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("")
async def recommend() -> ApiResponse[dict]:
    """Submit hardware profile and get model recommendations.

    Phase 3 will implement full recommendation logic.
    """
    return ApiResponse.ok({"message": "Recommendation engine - coming in Phase 3"})
