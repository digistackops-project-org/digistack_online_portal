"""
trainer-portal-service/src/config/database.py
Async PostgreSQL connection pool via asyncpg.
Shared employeedb — same DB as Admin Portal (V1+V2).
"""
import asyncpg
from loguru import logger
from src.config.settings import get_settings

settings = get_settings()

# Module-level pool instance
_pool: asyncpg.Pool | None = None


async def create_pool() -> asyncpg.Pool:
    """Create and return a connection pool. Called on app startup."""
    global _pool
    _pool = await asyncpg.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        min_size=settings.DB_POOL_MIN_SIZE,
        max_size=settings.DB_POOL_MAX_SIZE,
        command_timeout=60,
    )
    logger.info(f"DB pool created → {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    return _pool


async def close_pool() -> None:
    """Close the pool. Called on app shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        logger.info("DB pool closed")


def get_pool() -> asyncpg.Pool:
    """Dependency injection helper — return the active pool."""
    if _pool is None:
        raise RuntimeError("Database pool not initialised. Did the app start correctly?")
    return _pool


async def health_check_db() -> bool:
    """Returns True if DB is reachable, False otherwise."""
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return False
