"""FastAPI dependency injection — repository providers.

Feature-flag pattern: if the sync database is configured AND available,
SQL repositories are used. Otherwise, the app falls back to JSON mock data.
"""

import logging
import os
from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from src.core.database import SyncSessionLocal, database_is_configured
from src.repositories.interfaces import IGpuRepository, IModelRepository
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.repositories.json_model_repository import JsonModelRepository
from src.repositories.sql_gpu_repository import SqlGpuRepository
from src.repositories.sql_model_repository import SqlModelRepository

logger = logging.getLogger(__name__)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Module-level flag, set by lifespan on startup.
_sql_available: bool = False


def set_sql_available(available: bool) -> None:
    """Called from lifespan after connectivity check."""
    global _sql_available
    _sql_available = available
    if available:
        logger.info("SQL repositories enabled.")
    else:
        logger.info("SQL unavailable — falling back to JSON repositories.")


# ── Database session dependency ────────────────────────────────

def get_db() -> Generator[Session | None, None, None]:
    """Yield a sync database session, or None if not configured."""
    if SyncSessionLocal is None:
        yield None
        return

    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


# ── Repository dependencies ────────────────────────────────────

def get_model_repo(
    db: Session | None = Depends(get_db),
) -> IModelRepository:
    """Return a model repository (SQL with JSON fallback)."""
    if _sql_available and db is not None:
        return SqlModelRepository(db)
    return JsonModelRepository(os.path.join(_DATA_DIR, "mock_models.json"))


def get_gpu_repo(
    db: Session | None = Depends(get_db),
) -> IGpuRepository:
    """Return a GPU repository (SQL with JSON fallback)."""
    if _sql_available and db is not None:
        return SqlGpuRepository(db)
    return JsonGpuRepository(os.path.join(_DATA_DIR, "mock_gpu_specs.json"))
