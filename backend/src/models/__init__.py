"""SQLAlchemy ORM models for LLMFit Web.

Conforms to CLAUDE.md database rules:
- UUID primary keys (no auto-increment integers).
- All tables have id, created_at, updated_at.
- All queries support pagination (via offset/limit in repositories).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Model(Base):
    __tablename__ = "models"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )

    # --- Identity ---
    family: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    # --- Architecture ---
    parameter_count_b: Mapped[float] = mapped_column(Float, nullable=False)
    quantization: Mapped[str] = mapped_column(String(20), nullable=False)
    quantization_bits: Mapped[int] = mapped_column(Integer, nullable=False)

    # --- VRAM ---
    min_vram_gb: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_vram_gb: Mapped[float] = mapped_column(Float, nullable=False)

    # --- Capabilities ---
    context_length: Mapped[int] = mapped_column(Integer, nullable=False)
    hidden_dim: Mapped[int] = mapped_column(Integer, nullable=False)
    num_layers: Mapped[int] = mapped_column(Integer, nullable=False)
    quality_score: Mapped[int] = mapped_column(Integer, nullable=False)

    # --- External references ---
    download_url: Mapped[str] = mapped_column(String(500), nullable=False)
    huggingface_repo: Mapped[str] = mapped_column(String(200), nullable=False)

    # --- Timestamps ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )

    __table_args__ = (
        UniqueConstraint("slug", name="uq_models_slug"),
    )

    def __repr__(self) -> str:
        return f"<Model {self.slug}>"


class GpuSpec(Base):
    __tablename__ = "gpu_specs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )

    # --- Identity ---
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    vendor: Mapped[str] = mapped_column(String(40), nullable=False, index=True)

    # --- Performance ---
    vram_gb: Mapped[float] = mapped_column(Float, nullable=False)
    benchmark_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flops_tflops: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_bandwidth_gb_s: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- Classification ---
    tier: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # --- Timestamps ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )

    __table_args__ = (
        UniqueConstraint("slug", name="uq_gpu_specs_slug"),
    )

    def __repr__(self) -> str:
        return f"<GpuSpec {self.slug}>"
