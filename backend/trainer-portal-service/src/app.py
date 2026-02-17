"""
trainer-portal-service/src/app.py
FastAPI application factory.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from src.config.settings import get_settings
from src.config.database import create_pool, close_pool
from src.utils.logger import setup_logger
from src.routes import auth, health

settings = get_settings()


def create_app() -> FastAPI:
    setup_logger()

    app = FastAPI(
        title="Trainer Portal API",
        description="Trainer Portal — Version 3 | Python FastAPI",
        version="3.0.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    )

    # ─── CORS ────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ─── Startup / Shutdown ───────────────────────────────────
    @app.on_event("startup")
    async def startup():
        logger.info(f"Starting Trainer Portal Service [{settings.APP_ENV}]")
        await create_pool()

    @app.on_event("shutdown")
    async def shutdown():
        logger.info("Shutting down Trainer Portal Service")
        await close_pool()

    # ─── Global exception handler ─────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error on {request.url}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal server error"},
        )

    # ─── Routers ─────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(auth.router)

    # ─── 404 catch-all ───────────────────────────────────────
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    async def catch_all(path_name: str):
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Route /{path_name} not found"},
        )

    return app
