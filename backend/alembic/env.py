"""Alembic environment configuration.

Uses the sync database URL from application settings so that
credentials stay out of alembic.ini (tracked in git).
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import create_engine, pool

from alembic import context

# Ensure the backend package is importable
_backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_root))

from src.core.config import settings  # noqa: E402
from src.models import Base  # noqa: E402

# Alembic Config object
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ORM metadata for autogenerate
target_metadata = Base.metadata

# Build sync URL directly (avoid configparser % interpolation issues)
_sync_url = settings.sync_database_url
if _sync_url:
    # Escape % for configparser (but we bypass it now — kept for offline mode)
    pass


def _get_url() -> str:
    """Return the sync database URL directly from settings."""
    return settings.sync_database_url


def _get_engine():
    """Create a sync engine from settings (bypasses configparser)."""
    return create_engine(settings.sync_database_url, poolclass=pool.NullPool)


def run_migrations_offline() -> None:
    """Generate migration SQL without connecting to a database."""
    url = _get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database (engine built directly)."""
    connectable = _get_engine()
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
