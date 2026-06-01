"""SQL (PostgreSQL / SQLite) implementation of IGpuRepository."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models import GpuSpec
from src.repositories.interfaces import IGpuRepository


class SqlGpuRepository(IGpuRepository):
    """GPU repository backed by a SQL database."""

    # Tier hierarchy for upgrade suggestions
    _TIER_ORDER = {"entry": 0, "mid": 1, "high": 2, "enthusiast": 3}

    def __init__(self, session: Session) -> None:
        self._session = session

    # ── IGpuRepository methods ────────────────────────────────────

    def get_all(self) -> list[dict]:
        rows = self._session.execute(select(GpuSpec)).scalars().all()
        return [self._to_dict(r) for r in rows]

    def get_by_name(self, name: str) -> dict | None:
        row = self._session.execute(
            select(GpuSpec).where(func.lower(GpuSpec.name) == name.lower().strip())
        ).scalar_one_or_none()
        return self._to_dict(row) if row else None

    def find_closest_match(self, gpu_name: str) -> dict | None:
        if not gpu_name:
            return None

        name_lower = gpu_name.lower().strip()

        # Step 1: exact match
        exact = self.get_by_name(name_lower)
        if exact:
            return exact

        # Step 2: substring match (portable: lower + like)
        pattern = f"%{name_lower}%"
        rows = self._session.execute(
            select(GpuSpec).where(
                func.lower(GpuSpec.name).like(pattern)
            )
        ).scalars().all()

        best: GpuSpec | None = None
        best_score = 0.0
        for gpu in rows:
            db_lower = gpu.name.lower()
            score = 0.0
            if name_lower in db_lower:
                score = len(name_lower) / len(db_lower)
            elif db_lower in name_lower:
                score = len(db_lower) / len(name_lower)
            if score > best_score:
                best_score = score
                best = gpu

        return self._to_dict(best) if best else None

    def get_by_tier(self, tier: str) -> list[dict]:
        rows = self._session.execute(
            select(GpuSpec).where(GpuSpec.tier == tier)
        ).scalars().all()
        return [self._to_dict(r) for r in rows]

    def get_next_tier_gpus(self, current_tier: str) -> list[dict]:
        current_level = self._TIER_ORDER.get(current_tier, -1)
        if current_level < 0:
            return []

        # Collect all GPUs in higher tiers
        eligible_tiers = [
            t for t, level in self._TIER_ORDER.items()
            if level > current_level
        ]
        rows = self._session.execute(
            select(GpuSpec).where(GpuSpec.tier.in_(eligible_tiers))
        ).scalars().all()
        return [self._to_dict(r) for r in rows]

    # ── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _to_dict(gpu: GpuSpec) -> dict:
        return {
            "id": gpu.slug,
            "name": gpu.name,
            "vendor": gpu.vendor,
            "vram_gb": gpu.vram_gb,
            "benchmark_score": gpu.benchmark_score,
            "flops_tflops": gpu.flops_tflops,
            "memory_bandwidth_gb_s": gpu.memory_bandwidth_gb_s,
            "tier": gpu.tier,
            "created_at": (
                gpu.created_at.isoformat() if gpu.created_at else ""
            ),
            "updated_at": (
                gpu.updated_at.isoformat() if gpu.updated_at else ""
            ),
        }
