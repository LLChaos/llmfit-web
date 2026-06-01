"""SQL (PostgreSQL / SQLite) implementation of IModelRepository."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models import Model
from src.repositories.interfaces import IModelRepository


class SqlModelRepository(IModelRepository):
    """Model repository backed by a SQL database."""

    def __init__(self, session: Session) -> None:
        self._session = session

    # ── IModelRepository methods ──────────────────────────────────

    def get_all(
        self,
        page: int = 1,
        size: int = 20,
        family: str | None = None,
    ) -> dict:
        base = select(Model)
        if family:
            base = base.where(func.lower(Model.family) == family.lower())

        count_q = select(func.count()).select_from(base.subquery())
        total = self._session.scalar(count_q) or 0

        offset = (page - 1) * size
        rows = self._session.execute(
            base.order_by(Model.slug).offset(offset).limit(size)
        ).scalars().all()

        return {
            "items": [self._to_dict(r) for r in rows],
            "total": total,
            "page": page,
            "size": size,
        }

    def get_by_id(self, model_id: str) -> dict | None:
        row = self._session.execute(
            select(Model).where(Model.slug == model_id)
        ).scalar_one_or_none()
        return self._to_dict(row) if row else None

    def get_by_family(self, family: str) -> list[dict]:
        rows = self._session.execute(
            select(Model).where(func.lower(Model.family) == family.lower())
        ).scalars().all()
        return [self._to_dict(r) for r in rows]

    def get_runnable_models(self, max_vram_gb: float) -> list[dict]:
        rows = self._session.execute(
            select(Model).where(Model.recommended_vram_gb <= max_vram_gb)
        ).scalars().all()
        return [self._to_dict(r) for r in rows]

    # ── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _to_dict(model: Model) -> dict:
        return {
            "id": model.slug,
            "family": model.family,
            "name": model.name,
            "parameter_count_b": model.parameter_count_b,
            "quantization": model.quantization,
            "quantization_bits": model.quantization_bits,
            "min_vram_gb": model.min_vram_gb,
            "recommended_vram_gb": model.recommended_vram_gb,
            "context_length": model.context_length,
            "hidden_dim": model.hidden_dim,
            "num_layers": model.num_layers,
            "quality_score": model.quality_score,
            "download_url": model.download_url,
            "huggingface_repo": model.huggingface_repo,
            "created_at": (
                model.created_at.isoformat() if model.created_at else ""
            ),
            "updated_at": (
                model.updated_at.isoformat() if model.updated_at else ""
            ),
        }
