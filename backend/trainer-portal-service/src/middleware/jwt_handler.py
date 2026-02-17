"""
trainer-portal-service/src/middleware/jwt_handler.py
JWT creation and verification for trainer portal auth.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.config.settings import get_settings

settings = get_settings()

_bearer = HTTPBearer()


def create_access_token(payload: dict) -> str:
    """
    Create a signed JWT access token.
    payload should include: sub (trainer_id), email, name
    """
    data = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    data.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "trainer_portal"})
    return jwt.encode(data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_trainer(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """FastAPI dependency — validate JWT and return trainer payload."""
    return decode_token(credentials.credentials)
