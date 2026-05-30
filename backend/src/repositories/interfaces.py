"""Repository interfaces using Python Protocol for structural subtyping."""

from typing import Protocol


class IGpuRepository(Protocol):
    """GPU data access interface.

    Implementations: JsonGpuRepository (Phase 1-3), SqlGpuRepository (Phase 4+)
    """

    def get_all(self) -> list[dict]:
        """Return all GPU specs."""
        ...

    def get_by_name(self, name: str) -> dict | None:
        """Find GPU by exact name match."""
        ...

    def find_closest_match(self, gpu_name: str) -> dict | None:
        """Find the closest matching GPU by fuzzy/substring matching.

        WebGPU API returns GPU names that may not exactly match our database.
        This method handles partial/inexact matching.
        """
        ...

    def get_by_tier(self, tier: str) -> list[dict]:
        """Return all GPUs in a given tier (entry/mid/high/enthusiast)."""
        ...

    def get_next_tier_gpus(self, current_tier: str) -> list[dict]:
        """Return GPUs from the next tier up (for upgrade suggestions)."""
        ...


class IModelRepository(Protocol):
    """Model data access interface.

    Implementations: JsonModelRepository (Phase 1-3), SqlModelRepository (Phase 4+)
    """

    def get_all(
        self,
        page: int = 1,
        size: int = 20,
        family: str | None = None,
    ) -> dict:
        """Return paginated model list. Returns {"items": [...], "total": N, "page": P, "size": S}."""
        ...

    def get_by_id(self, model_id: str) -> dict | None:
        """Find model by ID."""
        ...

    def get_by_family(self, family: str) -> list[dict]:
        """Return all models in a family."""
        ...

    def get_runnable_models(self, max_vram_gb: float) -> list[dict]:
        """Return models whose recommended VRAM <= max_vram_gb."""
        ...
