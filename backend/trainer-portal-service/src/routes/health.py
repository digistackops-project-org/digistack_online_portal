"""
trainer-portal-service/src/routes/health.py
Health check endpoints — required for AWS ALB, Docker health checks,
Kubernetes liveness/readiness probes.
"""
import time
from fastapi import APIRouter, Depends
import asyncpg

from src.config.database import get_pool, health_check_db
from src.config.settings import get_settings

settings = get_settings()
router   = APIRouter(prefix="/health", tags=["Health"])

_START_TIME = time.time()


@router.get("")
@router.get("/")
async def health():
    """Overall service info — always returns 200 if process is running."""
    return {
        "status":    "UP",
        "service":   "trainer-portal-service",
        "version":   "3.0.0",
        "env":       settings.APP_ENV,
        "uptime_s":  round(time.time() - _START_TIME, 1),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@router.get("/live")
async def liveness():
    """
    Liveness probe — is the process alive?
    Returns 200 as long as the process is running (no DB check).
    Used by: Docker HEALTHCHECK, Kubernetes livenessProbe.
    """
    return {
        "status":    "ALIVE",
        "service":   "trainer-portal-service",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@router.get("/ready")
async def readiness(pool: asyncpg.Pool = Depends(get_pool)):
    """
    Readiness probe — is the service ready to handle traffic?
    Checks DB connectivity. Returns 503 if DB is down.
    Used by: Kubernetes readinessProbe, AWS ALB health check.
    """
    db_ok = await health_check_db()
    http_status = 200 if db_ok else 503
    body = {
        "status":    "READY" if db_ok else "NOT_READY",
        "service":   "trainer-portal-service",
        "checks":    {"database": "UP" if db_ok else "DOWN"},
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    from fastapi.responses import JSONResponse
    return JSONResponse(content=body, status_code=http_status)
