"""
trainer-portal-service/src/utils/logger.py
Loguru-based structured logging.
"""
import sys
from loguru import logger
from src.config.settings import get_settings

settings = get_settings()


def setup_logger() -> None:
    """Configure loguru for the application."""
    logger.remove()  # Remove default handler

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    if settings.APP_ENV == "production":
        # JSON-style for production log aggregators (CloudWatch, ELK)
        logger.add(
            sys.stdout,
            format="{time} | {level} | {name}:{line} | {message}",
            level=settings.LOG_LEVEL,
            serialize=True,
        )
        logger.add(
            "logs/trainer_portal.log",
            rotation="100 MB",
            retention="30 days",
            compression="gz",
            level=settings.LOG_LEVEL,
            serialize=True,
        )
    else:
        logger.add(sys.stdout, format=log_format, level=settings.LOG_LEVEL, colorize=True)
