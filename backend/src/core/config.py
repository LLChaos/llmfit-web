"""Application configuration loaded from environment variables."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings.

    Fields:
        app_name: Application display name.
        app_version: Semantic version string.
        debug: Debug mode flag. Defaults to False for safety.
        cors_origins: Comma-separated allowed CORS origins.
        database_url: Async PostgreSQL connection string (asyncpg).
        sync_database_url: Sync PostgreSQL connection string (psycopg2).
            Used by Alembic and sync SQL repositories.
            When empty, the app falls back to JSON repositories.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "LLMFit Web"
    app_version: str = "0.1.0"
    debug: bool = False
    cors_origins: str = "http://localhost:3000"
    database_url: str = ""
    sync_database_url: str = ""


settings = Settings()
