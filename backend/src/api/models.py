"""Model listing endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import get_model_repo
from src.repositories.interfaces import IModelRepository
from src.schemas.common import ApiResponse, PaginatedData
from src.schemas.model import ModelDetail, ModelListItem

router = APIRouter(prefix="/models", tags=["models"])

# Allowable sort columns for models
_MODEL_SORT_FIELDS = {
    "quality_score",
    "parameter_count_b",
    "context_length",
    "recommended_vram_gb",
    "min_vram_gb",
    "name",
}


@router.get("", response_model=ApiResponse[PaginatedData[ModelListItem]])
async def list_models(
    page: int = 1,
    size: int = 20,
    family: str | None = None,
    sort_by: str | None = Query(
        default=None,
        description="Sort field: quality_score, parameter_count_b, context_length, recommended_vram_gb, name",
    ),
    order: str = Query(
        default="desc",
        pattern="^(asc|desc)$",
        description="Sort order: asc or desc",
    ),
    repo: IModelRepository = Depends(get_model_repo),
) -> ApiResponse[PaginatedData[ModelListItem]]:
    """List all models with pagination, optional family filter, and sorting."""
    result = repo.get_all(page=page, size=size, family=family)
    items = result["items"]

    # Apply sorting if requested
    if sort_by and sort_by in _MODEL_SORT_FIELDS:
        reverse = order == "desc"
        items = sorted(
            items,
            key=lambda m: m.get(sort_by, 0) if isinstance(m.get(sort_by), (int, float)) else str(m.get(sort_by, "")),
            reverse=reverse,
        )

    models = [ModelListItem(**m) for m in items]
    return ApiResponse.ok(
        PaginatedData(
            items=models,
            total=result["total"],
            page=result["page"],
            size=result["size"],
        )
    )


@router.get("/{model_id}", response_model=ApiResponse[ModelDetail])
async def get_model(
    model_id: str,
    repo: IModelRepository = Depends(get_model_repo),
) -> ApiResponse[ModelDetail]:
    """Get model detail by ID."""
    model = repo.get_by_id(model_id)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail={"message": f"Model '{model_id}' not found"},
        )
    return ApiResponse.ok(ModelDetail(**model))
