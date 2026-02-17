"""
trainer-portal-service/src/routes/auth.py
FastAPI router for trainer portal authentication endpoints.
"""
from fastapi import APIRouter, Depends
import asyncpg

from src.config.database import get_pool
from src.middleware.jwt_handler import get_current_trainer
from src.models.schemas import (
    LoginRequest, SetPasswordRequest, ForgotPasswordRequest,
    LoginResponse, ApiResponse,
)
from src.controllers import auth_controller

router = APIRouter(prefix="/api/trainer-auth", tags=["Trainer Auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    """
    Trainer login.
    - Returns token + is_temp_password=true if trainer still has temp password.
    - Frontend must show Set Password popup when is_temp_password=true.
    - Returns 401 with message='Wrong credentials' on password mismatch.
    """
    return await auth_controller.login(payload, pool)


@router.post("/set-password", response_model=ApiResponse)
async def set_password(
    payload: SetPasswordRequest,
    current: dict = Depends(get_current_trainer),
    pool: asyncpg.Pool = Depends(get_pool),
):
    """
    Set permanent password after first login with temp password.
    Requires the short-lived token returned from /login when is_temp_password=true.
    """
    trainer_id = int(current["sub"])
    return await auth_controller.set_permanent_password(trainer_id, payload, pool)


@router.post("/forgot-password", response_model=ApiResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    """
    Forgot password flow — trainer provides email + new password.
    Validates email exists in trainer table, then stores new hashed password.
    """
    return await auth_controller.forgot_password(payload, pool)


@router.get("/me")
async def get_me(
    current: dict = Depends(get_current_trainer),
    pool: asyncpg.Pool = Depends(get_pool),
):
    """Get the authenticated trainer's profile."""
    trainer_id = int(current["sub"])
    data = await auth_controller.get_me(trainer_id, pool)
    return {"success": True, "data": data}
