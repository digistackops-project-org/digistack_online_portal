"""
trainer-portal-service/src/config/settings.py
Centralised configuration via pydantic-settings.
All values are read from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_ENV:   str = "development"
    APP_PORT:  int = 4004
    APP_HOST:  str = "0.0.0.0"
    APP_DEBUG: bool = False

    # Database
    DB_HOST:          str = "localhost"
    DB_PORT:          int = 5432
    DB_NAME:          str = "employeedb"
    DB_USER:          str = "postgres"
    DB_PASSWORD:      str = "postgres"
    DB_POOL_MIN_SIZE: int = 2
    DB_POOL_MAX_SIZE: int = 10

    # JWT
    JWT_SECRET:      str = "change_this_in_production_min_32_chars"
    JWT_ALGORITHM:   str = "HS256"
    JWT_EXPIRE_HOURS: int = 8

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3001"

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def db_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
