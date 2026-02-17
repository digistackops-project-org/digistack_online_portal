"""
tests/unit/test_auth_controller.py
Unit tests for auth controller — DB is mocked, tests logic in isolation.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

import os
os.environ.setdefault("JWT_SECRET", "test_secret_min_32_chars_padded_here_ok")


@pytest.fixture
def mock_pool_and_conn():
    pool = MagicMock()
    conn = AsyncMock()
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    return pool, conn


def make_trainer_row(overrides: dict = {}):
    """Helper — return a dict simulating an asyncpg Record row."""
    base = {
        "id": 1,
        "name": "Alice Trainer",
        "email": "alice@trainer.com",
        "mobile": "9876543210",
        "password_hash": "$2b$12$KIXZhObbY4CKJO4.v3KrHOtZ.n2k.8B7qPVAl9w8PJ1HJUz3aVXFC",  # Admin@123
        "temp_password": None,
        "is_temp_password": False,
        "is_active": True,
        "portal_access": True,
        "course_id": 1,
        "course_name": "React",
        "bio": None,
        "profile_image_url": None,
    }
    return {**base, **overrides}


# ════════════════════════════════════════════════════════════
# LOGIN UNIT TESTS
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestLogin:
    async def test_login_raises_401_for_unknown_email(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value=None)  # no trainer found

        from src.controllers.auth_controller import login
        from src.models.schemas import LoginRequest

        with pytest.raises(HTTPException) as exc:
            await login(LoginRequest(email="nobody@x.com", password="Pass@123"), pool)

        assert exc.value.status_code == 401
        assert "Invalid credentials" in exc.value.detail

    async def test_login_raises_401_for_wrong_password(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        row = make_trainer_row({"is_temp_password": False, "temp_password": None})
        conn.fetchrow = AsyncMock(return_value=row)
        conn.execute  = AsyncMock()

        from src.controllers.auth_controller import login
        from src.models.schemas import LoginRequest

        with pytest.raises(HTTPException) as exc:
            await login(LoginRequest(email="alice@trainer.com", password="WrongPass@1"), pool)

        assert exc.value.status_code == 401
        assert "Wrong credentials" in exc.value.detail

    async def test_login_success_returns_token(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        row = make_trainer_row()
        conn.fetchrow = AsyncMock(return_value=row)
        conn.execute  = AsyncMock()

        from src.controllers.auth_controller import login
        from src.models.schemas import LoginRequest

        with patch("src.controllers.auth_controller._verify_password", return_value=True):
            result = await login(LoginRequest(email="alice@trainer.com", password="Admin@123"), pool)

        assert result.success is True
        assert result.token is not None
        assert result.is_temp_password is False

    async def test_login_with_temp_password_returns_is_temp_true(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        row = make_trainer_row({"is_temp_password": True, "temp_password": "123456", "password_hash": None})
        conn.fetchrow = AsyncMock(return_value=row)
        conn.execute  = AsyncMock()

        from src.controllers.auth_controller import login
        from src.models.schemas import LoginRequest

        result = await login(LoginRequest(email="alice@trainer.com", password="123456"), pool)

        assert result.is_temp_password is True
        assert result.token is not None  # short-lived set-password token
        assert "Temporary" in result.message

    async def test_login_raises_403_for_deactivated_account(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value=make_trainer_row({"is_active": False}))

        from src.controllers.auth_controller import login
        from src.models.schemas import LoginRequest

        with pytest.raises(HTTPException) as exc:
            await login(LoginRequest(email="alice@trainer.com", password="Pass@1"), pool)

        assert exc.value.status_code == 403

    async def test_login_raises_403_if_portal_access_disabled(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value=make_trainer_row({"portal_access": False}))

        from src.controllers.auth_controller import login
        from src.models.schemas import LoginRequest

        with pytest.raises(HTTPException) as exc:
            await login(LoginRequest(email="alice@trainer.com", password="Pass@1"), pool)

        assert exc.value.status_code == 403


# ════════════════════════════════════════════════════════════
# SET PASSWORD UNIT TESTS
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestSetPassword:
    async def test_set_password_success(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value={"id": 1, "name": "Alice", "email": "alice@t.com"})
        conn.execute  = AsyncMock()

        from src.controllers.auth_controller import set_permanent_password
        from src.models.schemas import SetPasswordRequest

        result = await set_permanent_password(
            1,
            SetPasswordRequest(new_password="NewPass@1", confirm_password="NewPass@1"),
            pool,
        )
        assert result.success is True
        assert "Password set" in result.message
        conn.execute.assert_called_once()  # verifies DB was updated

    async def test_set_password_raises_404_for_unknown_trainer(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value=None)

        from src.controllers.auth_controller import set_permanent_password
        from src.models.schemas import SetPasswordRequest

        with pytest.raises(HTTPException) as exc:
            await set_permanent_password(
                999,
                SetPasswordRequest(new_password="NewPass@1", confirm_password="NewPass@1"),
                pool,
            )
        assert exc.value.status_code == 404


# ════════════════════════════════════════════════════════════
# FORGOT PASSWORD UNIT TESTS
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestForgotPassword:
    async def test_forgot_password_success(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value={"id": 1, "email": "alice@t.com"})
        conn.execute  = AsyncMock()

        from src.controllers.auth_controller import forgot_password
        from src.models.schemas import ForgotPasswordRequest

        result = await forgot_password(
            ForgotPasswordRequest(email="alice@t.com", new_password="Reset@123", confirm_password="Reset@123"),
            pool,
        )
        assert result.success is True
        conn.execute.assert_called_once()

    async def test_forgot_password_raises_404_for_unknown_email(self, mock_pool_and_conn):
        pool, conn = mock_pool_and_conn
        conn.fetchrow = AsyncMock(return_value=None)

        from src.controllers.auth_controller import forgot_password
        from src.models.schemas import ForgotPasswordRequest

        with pytest.raises(HTTPException) as exc:
            await forgot_password(
                ForgotPasswordRequest(email="ghost@x.com", new_password="Reset@123", confirm_password="Reset@123"),
                pool,
            )
        assert exc.value.status_code == 404
