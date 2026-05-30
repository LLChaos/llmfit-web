"""JSON file implementation of IGpuRepository."""

import json
from pathlib import Path

from src.repositories.interfaces import IGpuRepository


class JsonGpuRepository(IGpuRepository):
    """GPU repository backed by a JSON file."""

    # Tier hierarchy for upgrade suggestions
    _TIER_ORDER = {"entry": 0, "mid": 1, "high": 2, "enthusiast": 3}

    def __init__(self, file_path: str | Path) -> None:
        """Load GPU specs from JSON file.

        Args:
            file_path: Path to mock_gpu_specs.json.
        """
        self._file_path = Path(file_path)
        self._gpus: list[dict] = []
        self._load()

    def _load(self) -> None:
        """Load and parse the JSON data file."""
        with open(self._file_path, encoding="utf-8") as f:
            self._gpus = json.load(f)

    def get_all(self) -> list[dict]:
        """Return all GPU specs."""
        return list(self._gpus)

    def get_by_name(self, name: str) -> dict | None:
        """Find GPU by exact name match (case-insensitive)."""
        name_lower = name.lower().strip()
        for gpu in self._gpus:
            if gpu["name"].lower() == name_lower:
                return dict(gpu)
        return None

    def find_closest_match(self, gpu_name: str) -> dict | None:
        """Find closest GPU by substring matching.

        Strategy (in priority order):
        1. Exact name match (case-insensitive)
        2. Substring match (gpu_name contains db name or vice versa)
        3. Return None if no match found
        """
        if not gpu_name:
            return None

        name_lower = gpu_name.lower().strip()

        # Step 1: Exact match
        exact = self.get_by_name(name_lower)
        if exact:
            return exact

        # Step 2: Substring match
        best_match = None
        best_score = 0.0
        for gpu in self._gpus:
            db_name_lower = gpu["name"].lower()
            score = 0.0
            if name_lower in db_name_lower:
                score = len(name_lower) / len(db_name_lower)
            elif db_name_lower in name_lower:
                score = len(db_name_lower) / len(name_lower)
            if score > best_score:
                best_score = score
                best_match = gpu

        if best_match:
            return dict(best_match)

        return None

    def get_by_tier(self, tier: str) -> list[dict]:
        """Return all GPUs in a given tier."""
        return [dict(g) for g in self._gpus if g["tier"] == tier]

    def get_next_tier_gpus(self, current_tier: str) -> list[dict]:
        """Return GPUs from tiers above the current tier."""
        current_level = self._TIER_ORDER.get(current_tier, -1)
        if current_level < 0:
            return []
        return [
            dict(g)
            for g in self._gpus
            if self._TIER_ORDER.get(g["tier"], -1) > current_level
        ]
