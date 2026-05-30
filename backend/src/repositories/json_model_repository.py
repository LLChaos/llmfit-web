"""JSON file implementation of IModelRepository."""

import json
from pathlib import Path


class JsonModelRepository:
    """Model repository backed by a JSON file."""

    def __init__(self, file_path: str | Path) -> None:
        """Load model specs from JSON file.

        Args:
            file_path: Path to mock_models.json.
        """
        self._file_path = Path(file_path)
        self._models: list[dict] = []
        self._load()

    def _load(self) -> None:
        """Load and parse the JSON data file."""
        with open(self._file_path, encoding="utf-8") as f:
            self._models = json.load(f)

    def get_all(
        self,
        page: int = 1,
        size: int = 20,
        family: str | None = None,
    ) -> dict:
        """Return paginated model list.

        Args:
            page: Page number (1-indexed).
            size: Items per page.
            family: Optional family filter.

        Returns:
            {"items": [...], "total": N, "page": P, "size": S}
        """
        filtered = self._models
        if family:
            filtered = [
                m for m in self._models
                if m["family"].lower() == family.lower()
            ]

        total = len(filtered)
        start = (page - 1) * size
        end = start + size
        items = filtered[start:end]

        return {
            "items": [dict(m) for m in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def get_by_id(self, model_id: str) -> dict | None:
        """Find model by exact ID."""
        for model in self._models:
            if model["id"] == model_id:
                return dict(model)
        return None

    def get_by_family(self, family: str) -> list[dict]:
        """Return all models in a family."""
        return [
            dict(m) for m in self._models
            if m["family"].lower() == family.lower()
        ]

    def get_runnable_models(self, max_vram_gb: float) -> list[dict]:
        """Return models whose recommended VRAM <= max_vram_gb."""
        return [
            dict(m) for m in self._models
            if m["recommended_vram_gb"] <= max_vram_gb
        ]
