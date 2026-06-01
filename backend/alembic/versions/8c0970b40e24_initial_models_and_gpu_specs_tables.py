"""initial: models and gpu_specs tables

Revision ID: 8c0970b40e24
Revises:
Create Date: 2026-06-01 23:14:24.594025
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "8c0970b40e24"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── gpu_specs ──────────────────────────────────────────────
    op.create_table(
        "gpu_specs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("slug", sa.String(120), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("vendor", sa.String(40), nullable=False, index=True),
        sa.Column("vram_gb", sa.Float(), nullable=False),
        sa.Column("benchmark_score", sa.Integer(), nullable=True),
        sa.Column("flops_tflops", sa.Float(), nullable=True),
        sa.Column("memory_bandwidth_gb_s", sa.Float(), nullable=True),
        sa.Column("tier", sa.String(20), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )

    # ── models ─────────────────────────────────────────────────
    op.create_table(
        "models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("slug", sa.String(120), unique=True, nullable=False, index=True),
        sa.Column("family", sa.String(80), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("parameter_count_b", sa.Float(), nullable=False),
        sa.Column("quantization", sa.String(20), nullable=False),
        sa.Column("quantization_bits", sa.Integer(), nullable=False),
        sa.Column("min_vram_gb", sa.Float(), nullable=False),
        sa.Column("recommended_vram_gb", sa.Float(), nullable=False),
        sa.Column("context_length", sa.Integer(), nullable=False),
        sa.Column("hidden_dim", sa.Integer(), nullable=False),
        sa.Column("num_layers", sa.Integer(), nullable=False),
        sa.Column("quality_score", sa.Integer(), nullable=False),
        sa.Column("download_url", sa.String(500), nullable=False),
        sa.Column("huggingface_repo", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("models")
    op.drop_table("gpu_specs")
