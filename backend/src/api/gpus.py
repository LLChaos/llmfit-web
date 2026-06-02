"""GPU search endpoint — supports the frontend GPU manual selector."""

from fastapi import APIRouter, Depends, Query

from src.api.dependencies import get_gpu_repo
from src.repositories.interfaces import IGpuRepository
from src.schemas.common import ApiResponse

router = APIRouter(prefix="/gpus", tags=["gpus"])


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
