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
        database_url: PostgreSQL connection string (asyncpg). Required.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "LLMFit Web"
    app_version: str = "0.1.0"
    debug: bool = False
    cors_origins: str = "http://localhost:3000"
    database_url: str = ""

    @field_validator("database_url")
    @classmethod
    def database_url_must_not_be_empty(cls, v: str) -> str:
        """Reject empty database URL to fail fast at startup."""
        if not v.strip():
            raise ValueError(
                "DATABASE_URL is required but was empty. "
                "Set it in .env or as an environment variable."
            )
        return v


settings = Settings()
