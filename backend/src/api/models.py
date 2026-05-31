"""Model listing endpoints."""

import os

from fastapi import APIRouter, HTTPException

from src.repositories.json_model_repository import JsonModelRepository
from src.schemas.common import ApiResponse, PaginatedData
from src.schemas.model import ModelListItem, ModelDetail

router = APIRouter(prefix="/models", tags=["models"])

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_repo = JsonModelRepository(os.path.join(_DATA_DIR, "mock_models.json"))


@router.get("", response_model=ApiResponse[PaginatedData[ModelListItem]])
async def list_models(
    page: int = 1,
    size: int = 20,
    family: str | None = None,
) -> ApiResponse[PaginatedData[ModelListItem]]:
    """List all models with pagination and optional family filter."""
    result = _repo.get_all(page=page, size=size, family=family)
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
async def get_model(model_id: str) -> ApiResponse[ModelDetail]:
    """Get model detail by ID."""
    model = _repo.get_by_id(model_id)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail={"message": f"Model '{model_id}' not found"},
        )
    return ApiResponse.ok(ModelDetail(**model))
