"""Model listing endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from src.api.dependencies import get_model_repo
from src.repositories.interfaces import IModelRepository
from src.schemas.common import ApiResponse, PaginatedData
from src.schemas.model import ModelDetail, ModelListItem

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ApiResponse[PaginatedData[ModelListItem]])
async def list_models(
    page: int = 1,
    size: int = 20,
    family: str | None = None,
    repo: IModelRepository = Depends(get_model_repo),
) -> ApiResponse[PaginatedData[ModelListItem]]:
    """List all models with pagination and optional family filter."""
    result = repo.get_all(page=page, size=size, family=family)
    models = [ModelListItem(**m) for m in result["items"]]
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
