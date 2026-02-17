"""
tests/api/test_auth_api.py
API-level tests — validates HTTP contracts (status codes, response shapes, headers).
DB is mocked — pure HTTP contract testing, no real DB needed.
"""
import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("JWT_SECRET", "test_secret_min_32_chars_padded_here_ok")

from httpx import AsyncClient, ASGITransport


def make_row(overrides: dict = {}):
    base = {
        "id": 1, "name": "Alice", "email": "alice@trainer.com",
        "mobile": "9876543210", "password_hash": "hashed", "temp_password": None,
        "is_temp_password": False, "is_active": True, "portal_access": True,
        "course_id": 1, "course_name": "React", "bio": None, "profile_image_url": None,
    }
    return {**base, **overrides}


@pytest.fixture
async def api_client():
    mock_pool = MagicMock()
    mock_conn = AsyncMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__  = AsyncMock(return_value=False)

    with patch("src.config.database._pool", mock_pool), \
         patch("src.config.database.health_check_db", AsyncMock(return_value=True)):
        from src.app import create_app
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac, mock_conn


# ════════════════════════════════════════════════════════════
# POST /api/trainer-auth/login
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestLoginAPI:
    async def test_login_200_with_valid_credentials(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value=make_row())
        conn.execute  = AsyncMock()

        with patch("src.controllers.auth_controller._verify_password", return_value=True):
            resp = await client.post("/api/trainer-auth/login", json={
                "email": "alice@trainer.com",
                "password": "Admin@123",
            })

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "token" in body
        assert body["is_temp_password"] is False
        assert body["trainer"]["email"] == "alice@trainer.com"
        # Ensure password hash is NOT in response
        assert "password_hash" not in str(body)

    async def test_login_200_temp_password_shows_flag(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value=make_row({
            "is_temp_password": True, "temp_password": "123456", "password_hash": None,
        }))
        conn.execute = AsyncMock()

        resp = await client.post("/api/trainer-auth/login", json={
            "email": "alice@trainer.com", "password": "123456",
        })

        assert resp.status_code == 200
        body = resp.json()
        assert body["is_temp_password"] is True
        assert body["token"] is not None  # set-password token returned

    async def test_login_401_wrong_password(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value=make_row())

        with patch("src.controllers.auth_controller._verify_password", return_value=False):
            resp = await client.post("/api/trainer-auth/login", json={
                "email": "alice@trainer.com", "password": "WrongPass@1",
            })

        assert resp.status_code == 401
        assert "Wrong credentials" in resp.json()["detail"]

    async def test_login_401_unknown_email(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value=None)

        resp = await client.post("/api/trainer-auth/login", json={
            "email": "nobody@x.com", "password": "Pass@123",
        })
        assert resp.status_code == 401

    async def test_login_422_missing_email(self, api_client):
        client, _ = api_client
        resp = await client.post("/api/trainer-auth/login", json={"password": "Pass@123"})
        assert resp.status_code == 422

    async def test_login_422_invalid_email_format(self, api_client):
        client, _ = api_client
        resp = await client.post("/api/trainer-auth/login", json={
            "email": "not-an-email", "password": "Pass@123",
        })
        assert resp.status_code == 422

    async def test_login_response_content_type_is_json(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value=None)
        resp = await client.post("/api/trainer-auth/login", json={
            "email": "x@x.com", "password": "p",
        })
        assert "application/json" in resp.headers["content-type"]


# ════════════════════════════════════════════════════════════
# POST /api/trainer-auth/set-password
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestSetPasswordAPI:
    @pytest.fixture
    def set_pw_token(self):
        from src.middleware.jwt_handler import create_access_token
        return create_access_token({"sub": "1", "email": "a@b.com", "name": "A", "scope": "set_password"})

    async def test_set_password_200_success(self, api_client, set_pw_token):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value={"id": 1, "name": "Alice", "email": "alice@t.com"})
        conn.execute  = AsyncMock()

        resp = await client.post(
            "/api/trainer-auth/set-password",
            json={"new_password": "NewPass@1", "confirm_password": "NewPass@1"},
            headers={"Authorization": f"Bearer {set_pw_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    async def test_set_password_422_password_mismatch(self, api_client, set_pw_token):
        client, _ = api_client
        resp = await client.post(
            "/api/trainer-auth/set-password",
            json={"new_password": "NewPass@1", "confirm_password": "Different@1"},
            headers={"Authorization": f"Bearer {set_pw_token}"},
        )
        assert resp.status_code == 422

    async def test_set_password_401_no_token(self, api_client):
        client, _ = api_client
        resp = await client.post(
            "/api/trainer-auth/set-password",
            json={"new_password": "NewPass@1", "confirm_password": "NewPass@1"},
        )
        assert resp.status_code in (401, 403)

    async def test_set_password_422_weak_password(self, api_client, set_pw_token):
        client, _ = api_client
        resp = await client.post(
            "/api/trainer-auth/set-password",
            json={"new_password": "weakpassword", "confirm_password": "weakpassword"},
            headers={"Authorization": f"Bearer {set_pw_token}"},
        )
        assert resp.status_code == 422


# ════════════════════════════════════════════════════════════
# POST /api/trainer-auth/forgot-password
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestForgotPasswordAPI:
    async def test_forgot_password_200_known_email(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value={"id": 1, "email": "alice@trainer.com"})
        conn.execute  = AsyncMock()

        resp = await client.post("/api/trainer-auth/forgot-password", json={
            "email": "alice@trainer.com",
            "new_password": "Reset@123",
            "confirm_password": "Reset@123",
        })
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    async def test_forgot_password_404_unknown_email(self, api_client):
        client, conn = api_client
        conn.fetchrow = AsyncMock(return_value=None)

        resp = await client.post("/api/trainer-auth/forgot-password", json={
            "email": "ghost@x.com",
            "new_password": "Reset@123",
            "confirm_password": "Reset@123",
        })
        assert resp.status_code == 404

    async def test_forgot_password_422_passwords_do_not_match(self, api_client):
        client, _ = api_client
        resp = await client.post("/api/trainer-auth/forgot-password", json={
            "email": "alice@trainer.com",
            "new_password": "Reset@123",
            "confirm_password": "Different@123",
        })
        assert resp.status_code == 422


# ════════════════════════════════════════════════════════════
# HEALTH ENDPOINTS
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestHealthAPI:
    async def test_health_200(self, api_client):
        client, _ = api_client
        resp = await client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "UP"
        assert body["service"] == "trainer-portal-service"

    async def test_health_live_200(self, api_client):
        client, _ = api_client
        resp = await client.get("/health/live")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ALIVE"

    async def test_health_ready_200_when_db_up(self, api_client):
        client, _ = api_client
        resp = await client.get("/health/ready")
        assert resp.status_code == 200
        assert resp.json()["checks"]["database"] == "UP"

    async def test_unknown_route_returns_404(self, api_client):
        client, _ = api_client
        resp = await client.get("/api/trainer-auth/doesnotexist")
        assert resp.status_code == 404
