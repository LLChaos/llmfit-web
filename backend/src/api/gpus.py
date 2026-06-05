"""GPU endpoints — search, list, and detail."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import get_gpu_repo, get_model_repo
from src.repositories.interfaces import IGpuRepository, IModelRepository
from src.schemas.common import ApiResponse

router = APIRouter(prefix="/gpus", tags=["gpus"])

# Allowable sort columns for GPUs
_GPU_SORT_FIELDS = {
    "benchmark_score",
    "vram_gb",
    "memory_bandwidth_gb_s",
    "flops_tflops",
    "name",
}


@router.get("/search")
async def search_gpus(
    q: str = Query(default="", min_length=1, description="Search query for GPU name"),
    limit: int = Query(default=10, ge=1, le=50),
    gpu_repo: IGpuRepository = Depends(get_gpu_repo),
) -> ApiResponse[list[dict]]:
    """Search GPUs by name fragment. Returns matching GPU names + metadata."""
    all_gpus = gpu_repo.get_all()
    query_lower = q.lower().strip()

    # Simple substring filter — sorted by tier (enthusiast first) then name
    matches = [
        g
        for g in all_gpus
        if query_lower in g["name"].lower()
    ]

    # Sort: better tiers first, then alphabetically
    tier_order = {"enthusiast": 0, "high": 1, "mid": 2, "entry": 3}
    matches.sort(key=lambda g: (tier_order.get(g.get("tier", "entry"), 99), g["name"]))

    # Return minimal fields for the dropdown
    results = [
        {
            "name": g["name"],
            "vendor": g.get("vendor", ""),
            "vram_gb": g.get("vram_gb", 0),
            "tier": g.get("tier", ""),
        }
        for g in matches[:limit]
    ]

    return ApiResponse.ok(results)


@router.get("")
async def list_gpus(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=24, ge=1, le=500),
    vendor: Optional[str] = Query(default=None, description="Filter by vendor (nvidia/amd/apple/intel)"),
    tier: Optional[str] = Query(default=None, description="Filter by tier (entry/mid/high/enthusiast)"),
    sort_by: Optional[str] = Query(
        default=None,
        description="Sort field: benchmark_score, vram_gb, memory_bandwidth_gb_s, flops_tflops, name",
    ),
    order: str = Query(
        default="desc",
        pattern="^(asc|desc)$",
        description="Sort order: asc or desc",
    ),
    gpu_repo: IGpuRepository = Depends(get_gpu_repo),
) -> ApiResponse[dict]:
    """List GPUs with optional vendor/tier filters, sorting, and pagination."""
    all_gpus = gpu_repo.get_all()

    # Apply filters
    if vendor:
        all_gpus = [g for g in all_gpus if g.get("vendor", "").lower() == vendor.lower()]
    if tier:
        all_gpus = [g for g in all_gpus if g.get("tier", "") == tier]

    # Apply sorting — when explicit sort_by given, use it; otherwise default sort
    if sort_by and sort_by in _GPU_SORT_FIELDS:
        reverse = order == "desc"
        all_gpus.sort(
            key=lambda g: (
                (g.get(sort_by) or 0) if isinstance(g.get(sort_by), (int, float, type(None))) else str(g.get(sort_by, "") or "")
            ),
            reverse=reverse,
        )
    else:
        # Default sort: better tiers first, then by benchmark score desc
        tier_order = {"enthusiast": 0, "high": 1, "mid": 2, "entry": 3}
        all_gpus.sort(key=lambda g: (
            tier_order.get(g.get("tier", "entry"), 99),
            -(g.get("benchmark_score") or 0),
        ))

    total = len(all_gpus)
    start = (page - 1) * size
    items = all_gpus[start:start + size]

    return ApiResponse.ok({
        "items": items,
        "total": total,
        "page": page,
        "size": size,
    })


@router.get("/{slug}")
async def get_gpu(
    slug: str,
    gpu_repo: IGpuRepository = Depends(get_gpu_repo),
    model_repo: IModelRepository = Depends(get_model_repo),
) -> ApiResponse[dict]:
    """Get GPU detail by slug ID, including compatible models."""
    all_gpus = gpu_repo.get_all()

    gpu = next((g for g in all_gpus if g.get("id") == slug), None)
    if gpu is None:
        raise HTTPException(status_code=404, detail={"message": f"GPU '{slug}' not found"})

    # Find models that can run on this GPU's VRAM
    vram = gpu.get("vram_gb", 0)
    compatible_models = model_repo.get_runnable_models(vram)

    # Sort by quality score descending
    compatible_models.sort(key=lambda m: -(m.get("quality_score") or 0))

    return ApiResponse.ok({
        **dict(gpu),
        "compatible_models": compatible_models[:20],
    })
