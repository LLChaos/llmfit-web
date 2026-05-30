"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "LLMFit Web"
    app_version: str = "0.1.0"
    debug: bool = True
    cors_origins: str = "http://localhost:3000"
    database_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
