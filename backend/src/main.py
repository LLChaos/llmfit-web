"""LLMFit Web - FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.dependencies import set_sql_available
from src.api.router import api_router
from src.core.config import settings
from src.core.database import dispose_engines, verify_sync_connection

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify database connectivity. Shutdown: dispose engines."""
    # Startup
    db_ok = verify_sync_connection()
    set_sql_available(db_ok)

    if db_ok:
        logger.info("Database available — using SQL repositories.")
    else:
        logger.info(
            "Database unavailable — using JSON repositories. "
            "Set SYNC_DATABASE_URL in .env to enable SQL."
        )

    yield

    # Shutdown
    await dispose_engines()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    # CORS — explicit origins + regex for wildcard domains
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(api_router)

    # Health check
    @app.get("/health")
    async def health_check() -> dict:
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_app()
