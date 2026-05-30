"""Model listing endpoints - Phase 3 implementation."""

from fastapi import APIRouter

from src.schemas.common import ApiResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
async def list_models() -> ApiResponse[dict]:
    """List all models with pagination.

    Phase 3 will implement full listing with filters.
    """
    return ApiResponse.ok({"message": "Model list - coming in Phase 3"})


@router.get("/{model_id}")
async def get_model(model_id: str) -> ApiResponse[dict]:
    """Get model detail by ID.

    Phase 3 will implement full detail lookup.
    """
    return ApiResponse.ok({"message": f"Model detail for {model_id} - coming in Phase 3"})
