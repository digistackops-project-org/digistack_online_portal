"""
trainer-portal-service/src/controllers/auth_controller.py
Business logic for Trainer Portal authentication.

Flow:
  Login → temp password? → return {is_temp_password: true} → frontend shows set-password popup
  Set password → hash & store permanent password, clear temp flag
  Forgot password → validate email → hash & store new password
"""
import asyncpg
from loguru import logger
from passlib.context import CryptContext
from fastapi import HTTPException, status

from src.models.schemas import (
    LoginRequest, SetPasswordRequest, ForgotPasswordRequest,
    LoginResponse, ApiResponse, TrainerProfileResponse,
)
from src.middleware.jwt_handler import create_access_token

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def _to_profile(row: asyncpg.Record) -> TrainerProfileResponse:
    return TrainerProfileResponse(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        mobile=row["mobile"],
        is_temp_password=row["is_temp_password"],
        course_id=row.get("course_id"),
        course_name=row.get("course_name"),
        bio=row.get("bio"),
        profile_image_url=row.get("profile_image_url"),
        portal_access=row.get("portal_access", True),
    )


# ─────────────────────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────────────────────

async def login(payload: LoginRequest, pool: asyncpg.Pool) -> LoginResponse:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.id, t.name, t.email, t.mobile, t.password_hash, t.temp_password,
                   t.is_temp_password, t.is_active, t.portal_access,
                   t.course_id, t.bio, t.profile_image_url,
                   c.course_name
            FROM trainer t
            LEFT JOIN course c ON t.course_id = c.id
            WHERE t.email = $1
            """,
            payload.email,
        )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not row["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact admin.",
        )

    if not row["portal_access"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainer portal access is disabled for this account.",
        )

    # Verify password — check both hashed permanent and plain temp password
    password_ok = False
    if row["password_hash"]:
        password_ok = _verify_password(payload.password, row["password_hash"])

    # Also allow temp_password plain-text comparison (as stored by admin)
    if not password_ok and row["temp_password"]:
        password_ok = (payload.password == row["temp_password"])

    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong credentials",
        )

    trainer_profile = _to_profile(row)

    # Update last_login_at
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE trainer SET last_login_at = NOW() WHERE id = $1",
            row["id"],
        )

    # If still on temp password → do NOT issue full token yet
    # Frontend will show the Set New Password popup
    if row["is_temp_password"]:
        logger.info(f"Trainer {payload.email} logged in with temp password — must set permanent")
        # Issue a short-lived one-time token just for the set-password endpoint
        otp_token = create_access_token({
            "sub": str(row["id"]),
            "email": row["email"],
            "name": row["name"],
            "scope": "set_password",    # restricted scope
        })
        return LoginResponse(
            success=True,
            message="Temporary password accepted. Please set your permanent password.",
            token=otp_token,
            is_temp_password=True,
            trainer=trainer_profile,
        )

    # Full login — issue normal access token
    token = create_access_token({
        "sub": str(row["id"]),
        "email": row["email"],
        "name": row["name"],
        "scope": "trainer_portal",
    })

    logger.info(f"Trainer login success: {payload.email}")
    return LoginResponse(
        success=True,
        message="Login successful",
        token=token,
        is_temp_password=False,
        trainer=trainer_profile,
    )


# ─────────────────────────────────────────────────────────────
# SET PERMANENT PASSWORD (after temp password login)
# ─────────────────────────────────────────────────────────────

async def set_permanent_password(
    trainer_id: int,
    payload: SetPasswordRequest,
    pool: asyncpg.Pool,
) -> ApiResponse:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email FROM trainer WHERE id = $1 AND is_active = true",
            trainer_id,
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found")

        hashed = _hash_password(payload.new_password)
        await conn.execute(
            """
            UPDATE trainer
            SET password_hash = $1, temp_password = NULL, is_temp_password = false
            WHERE id = $2
            """,
            hashed, trainer_id,
        )

    logger.info(f"Trainer {row['email']} set permanent password successfully")
    return ApiResponse(
        success=True,
        message="Password set successfully. Please login with your new password.",
    )


# ─────────────────────────────────────────────────────────────
# FORGOT PASSWORD
# ─────────────────────────────────────────────────────────────

async def forgot_password(payload: ForgotPasswordRequest, pool: asyncpg.Pool) -> ApiResponse:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email FROM trainer WHERE email = $1",
            payload.email,
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found",
            )

        hashed = _hash_password(payload.new_password)
        await conn.execute(
            """
            UPDATE trainer
            SET password_hash = $1, temp_password = NULL, is_temp_password = false,
                reset_token = NULL, reset_token_expiry = NULL
            WHERE id = $2
            """,
            hashed, row["id"],
        )

    logger.info(f"Trainer {payload.email} reset password via forgot-password")
    return ApiResponse(success=True, message="Password updated successfully. Please login.")


# ─────────────────────────────────────────────────────────────
# GET PROFILE (me)
# ─────────────────────────────────────────────────────────────

async def get_me(trainer_id: int, pool: asyncpg.Pool) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.id, t.name, t.email, t.mobile, t.is_temp_password,
                   t.course_id, t.bio, t.profile_image_url, t.portal_access,
                   t.last_login_at, c.course_name
            FROM trainer t
            LEFT JOIN course c ON t.course_id = c.id
            WHERE t.id = $1
            """,
            trainer_id,
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found")

    return dict(row)
