"""
conftest.py — pytest fixtures for trainer-portal-service tests.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

# ─── Event loop for async tests ─────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ─── Mock DB pool ────────────────────────────────────────────
@pytest.fixture
def mock_pool():
    """Returns a mock asyncpg pool with a context-manager-capable acquire()."""
    pool = MagicMock()
    conn = AsyncMock()
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    return pool, conn


# ─── Test app client (mocked DB) ─────────────────────────────
@pytest.fixture
async def client():
    """
    Async test client with DB pool mocked out.
    Unit/API tests use this — no real DB needed.
    """
    mock_pool_inst = MagicMock()
    mock_conn = AsyncMock()
    mock_pool_inst.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool_inst.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

    with patch("src.config.database._pool", mock_pool_inst), \
         patch("src.config.database.health_check_db", AsyncMock(return_value=True)):
        from src.app import create_app
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac, mock_conn


# ─── Valid JWT token fixture ──────────────────────────────────
@pytest.fixture
def valid_token():
    """Generate a real JWT for test use."""
    import os
    os.environ.setdefault("JWT_SECRET", "test_secret_min_32_chars_padded_here_ok")
    from src.middleware.jwt_handler import create_access_token
    return create_access_token({
        "sub": "1",
        "email": "trainer@test.com",
        "name": "Test Trainer",
        "scope": "trainer_portal",
    })


@pytest.fixture
def temp_password_token():
    """Generate a limited-scope JWT (for set-password endpoint)."""
    import os
    os.environ.setdefault("JWT_SECRET", "test_secret_min_32_chars_padded_here_ok")
    from src.middleware.jwt_handler import create_access_token
    return create_access_token({
        "sub": "1",
        "email": "trainer@test.com",
        "name": "Test Trainer",
        "scope": "set_password",
    })
