"""add news_posts table

Revision ID: 20260604_news_posts
Revises: 8c0970b40e24
Create Date: 2026-06-04 12:00:00.000000
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260604_news_posts"
down_revision: Union[str, Sequence[str], None] = "8c0970b40e24"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "news_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("slug", sa.String(150), unique=True, nullable=False, index=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("summary", sa.String(500), nullable=False),
        sa.Column("body_markdown", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, index=True,
                  server_default="guide"),
        sa.Column("tags", sa.String(300), nullable=False, server_default=""),
        sa.Column("cover_image_url", sa.String(500), nullable=False, server_default=""),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, index=True,
                  server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("news_posts")
