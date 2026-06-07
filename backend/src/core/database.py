"""Database engine and session factories.

Provides both sync (psycopg2) and async (asyncpg) connections.
Sync engines are used by Alembic migrations and the current SQL repos.
Async engines are wired for a planned future migration.

Engine creation is lazy and wrapped in try/except so that importing
this module never crashes — even when drivers are missing or URLs are
invalid. Consumers should call ``verify_sync_connection()`` at startup
to confirm connectivity.
"""

import logging
from collections.abc import Generator

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from src.core.config import settings

logger = logging.getLogger(__name__)

# ── Sync (psycopg2) ──────────────────────────────────────────────
_sync_engine: Engine | None = None
SyncSessionLocal: sessionmaker[Session] | None = None
_sync_init_attempted = False


def _init_sync_engine() -> None:
    """Create the sync engine and session factory (idempotent)."""
    global _sync_engine, SyncSessionLocal, _sync_init_attempted

    if _sync_init_attempted:
        return
    _sync_init_attempted = True

    if not settings.sync_database_url:
        logger.info("SYNC_DATABASE_URL not set — sync engine skipped.")
        return

    try:
        _sync_engine = create_engine(
            settings.sync_database_url,
            echo=settings.debug,
            pool_size=5,
            max_overflow=10,
        )
        SyncSessionLocal = sessionmaker(
            bind=_sync_engine, autocommit=False, autoflush=False
        )
        logger.info("Sync engine created.")
    except Exception:
        logger.warning(
            "Sync engine unavailable — check SYNC_DATABASE_URL and psycopg2 installation."
        )


# ── Async (asyncpg) — for future use ─────────────────────────────
_async_engine: AsyncEngine | None = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None
_async_init_attempted = False


def _init_async_engine() -> None:
    """Create the async engine and session factory (idempotent)."""
    global _async_engine, AsyncSessionLocal, _async_init_attempted

    if _async_init_attempted:
        return
    _async_init_attempted = True

    if not settings.database_url:
        return

    try:
        _async_engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_size=5,
            max_overflow=10,
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=_async_engine, expire_on_commit=False
        )
        logger.info("Async engine created.")
    except Exception:
        logger.warning(
            "Async engine unavailable (missing asyncpg or similar). "
            "Sync engine is sufficient for all current operations."
        )


def get_sync_engine() -> Engine | None:
    """Return the sync engine, or None if not configured."""
    _init_sync_engine()
    return _sync_engine


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yield a sync database session.

    If the database is not configured, this will raise RuntimeError
    — callers should use the JSON fallback when appropriate.
    """
    _init_sync_engine()
    if SyncSessionLocal is None:
        raise RuntimeError(
            "Sync database is not configured. "
            "Set SYNC_DATABASE_URL in .env or use JSON repositories."
        )
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


def database_is_configured() -> bool:
    """Return True if both sync URL and engine are available."""
    _init_sync_engine()
    return _sync_engine is not None and SyncSessionLocal is not None


def verify_sync_connection() -> bool:
    """Check connectivity to the sync database. Returns True on success."""
    _init_sync_engine()
    if _sync_engine is None:
        logger.warning("Sync database not configured — skipping connectivity check.")
        return False
    try:
        with _sync_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Sync database connection verified.")
        return True
    except Exception:
        logger.warning(
            "Sync database connection failed — falling back to JSON repositories. "
            "Start PostgreSQL or set up Supabase to enable SQL."
        )
        return False


async def dispose_engines() -> None:
    """Dispose of both sync and async engines (call at shutdown)."""
    if _sync_engine is not None:
        _sync_engine.dispose()
        logger.info("Sync engine disposed.")
    if _async_engine is not None:
        await _async_engine.dispose()
        logger.info("Async engine disposed.")
