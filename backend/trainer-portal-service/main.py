"""
trainer-portal-service/main.py
Entry point — run with: uvicorn main:app --host 0.0.0.0 --port 4004
"""
import uvicorn
from src.app import create_app
from src.config.settings import get_settings

settings = get_settings()
app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=(settings.APP_ENV == "development"),
        workers=1 if settings.APP_ENV == "development" else 4,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
    )
