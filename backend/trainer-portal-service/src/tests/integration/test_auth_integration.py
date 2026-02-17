"""
tests/integration/test_auth_integration.py
Integration tests — requires a REAL PostgreSQL employeedb with V2+V3 migrations applied.

Set environment variables before running:
  DB_HOST=localhost DB_PORT=5432 DB_NAME=employeedb DB_USER=postgres DB_PASSWORD=yourpw
  JWT_SECRET=test_secret_min_32_chars_padded_here_ok

Run: pytest src/tests/integration/ -v --asyncio-mode=auto
"""
import pytest
import os
import asyncio
import asyncpg
from passlib.context import CryptContext
from httpx import AsyncClient, ASGITransport

# Skip integration tests if DB env is not explicitly set
pytestmark = pytest.mark.skipif(
    not os.environ.get("RUN_INTEGRATION_TESTS"),
    reason="Set RUN_INTEGRATION_TESTS=1 to run integration tests"
)

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
TEST_EMAIL    = f"integration_trainer_{os.getpid()}@test.com"
TEST_TEMP_PW  = "111222"
TEST_PERM_PW  = "IntPass@123"


@pytest.fixture(scope="module")
async def db_pool():
    """Connect to the real DB for integration testing."""
    pool = await asyncpg.create_pool(
        host=os.environ.get("DB_HOST",     "localhost"),
        port=int(os.environ.get("DB_PORT", "5432")),
        database=os.environ.get("DB_NAME", "employeedb"),
        user=os.environ.get("DB_USER",     "postgres"),
        password=os.environ.get("DB_PASSWORD", "postgres"),
        min_size=1, max_size=3,
    )
    yield pool
    # Cleanup test rows
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM trainer WHERE email LIKE '%@test.com'")
    await pool.close()


@pytest.fixture(scope="module")
async def integration_client(db_pool):
    """Real client backed by real DB."""
    from unittest.mock import patch
    with patch("src.config.database._pool", db_pool):
        from src.app import create_app
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac, db_pool


@pytest.fixture(scope="module", autouse=True)
async def seed_test_trainer(db_pool):
    """Insert a test trainer row for integration tests."""
    hashed_temp = pwd_ctx.hash(TEST_TEMP_PW)
    async with db_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO trainer (name, mobile, email, password_hash, temp_password, is_temp_password, portal_access)
            VALUES ($1, $2, $3, $4, $5, true, true)
            ON CONFLICT (email) DO NOTHING
            """,
            "Integration Trainer", "9123456789", TEST_EMAIL, hashed_temp, TEST_TEMP_PW,
        )


# ════════════════════════════════════════════════════════════
# INTEGRATION — LOGIN
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestLoginIntegration:
    async def test_login_with_temp_password_returns_is_temp_true(self, integration_client):
        client, _ = integration_client
        resp = await client.post("/api/trainer-auth/login", json={
            "email": TEST_EMAIL, "password": TEST_TEMP_PW,
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["is_temp_password"] is True
        assert body["token"] is not None

    async def test_login_wrong_password_returns_401(self, integration_client):
        client, _ = integration_client
        resp = await client.post("/api/trainer-auth/login", json={
            "email": TEST_EMAIL, "password": "WrongPass!",
        })
        assert resp.status_code == 401
        assert "Wrong credentials" in resp.json()["detail"]

    async def test_login_unknown_email_returns_401(self, integration_client):
        client, _ = integration_client
        resp = await client.post("/api/trainer-auth/login", json={
            "email": "unknown@integration.com", "password": TEST_TEMP_PW,
        })
        assert resp.status_code == 401


# ════════════════════════════════════════════════════════════
# INTEGRATION — SET PERMANENT PASSWORD
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestSetPasswordIntegration:
    async def test_set_permanent_password_clears_temp_flag(self, integration_client):
        client, pool = integration_client

        # First get a set-password token by logging in with temp pw
        login_resp = await client.post("/api/trainer-auth/login", json={
            "email": TEST_EMAIL, "password": TEST_TEMP_PW,
        })
        token = login_resp.json()["token"]

        # Set permanent password
        resp = await client.post(
            "/api/trainer-auth/set-password",
            json={"new_password": TEST_PERM_PW, "confirm_password": TEST_PERM_PW},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Verify DB flag cleared
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT is_temp_password, temp_password FROM trainer WHERE email = $1",
                TEST_EMAIL,
            )
        assert row["is_temp_password"] is False
        assert row["temp_password"] is None

    async def test_can_login_with_permanent_password_after_set(self, integration_client):
        client, _ = integration_client
        resp = await client.post("/api/trainer-auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PERM_PW,
        })
        assert resp.status_code == 200
        assert resp.json()["is_temp_password"] is False


# ════════════════════════════════════════════════════════════
# INTEGRATION — FORGOT PASSWORD
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestForgotPasswordIntegration:
    async def test_forgot_password_updates_db(self, integration_client):
        client, pool = integration_client
        new_pw = "Forgotten@456"

        resp = await client.post("/api/trainer-auth/forgot-password", json={
            "email": TEST_EMAIL,
            "new_password": new_pw,
            "confirm_password": new_pw,
        })
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Verify login works with new password
        login_resp = await client.post("/api/trainer-auth/login", json={
            "email": TEST_EMAIL, "password": new_pw,
        })
        assert login_resp.status_code == 200

    async def test_forgot_password_404_unknown_email(self, integration_client):
        client, _ = integration_client
        resp = await client.post("/api/trainer-auth/forgot-password", json={
            "email": "ghost@integration.com",
            "new_password": "Ghost@123",
            "confirm_password": "Ghost@123",
        })
        assert resp.status_code == 404


# ════════════════════════════════════════════════════════════
# INTEGRATION — HEALTH
# ════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestHealthIntegration:
    async def test_health_ready_returns_200_with_real_db(self, integration_client):
        client, _ = integration_client
        resp = await client.get("/health/ready")
        assert resp.status_code == 200
        assert resp.json()["checks"]["database"] == "UP"
