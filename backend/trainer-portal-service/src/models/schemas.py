"""
trainer-portal-service/src/models/schemas.py
Pydantic v2 schemas for request validation and response serialisation.
"""
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


# ─────────────────────────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

    model_config = {"str_strip_whitespace": True}


class SetPasswordRequest(BaseModel):
    """
    Used after first login with temp password.
    Trainer sets their permanent password.
    """
    new_password:     str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class ForgotPasswordRequest(BaseModel):
    """Trainer self-resets password from forgot-password screen."""
    email:            EmailStr
    new_password:     str
    confirm_password: str

    model_config = {"str_strip_whitespace": True}

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Must contain uppercase")
        if not re.search(r"\d", v):
            raise ValueError("Must contain digit")
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Must contain special character")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


# ─────────────────────────────────────────────────────────────
# Response Schemas
# ─────────────────────────────────────────────────────────────

class TrainerProfileResponse(BaseModel):
    id:              int
    name:            str
    email:           str
    mobile:          str
    is_temp_password: bool
    course_id:       int | None
    course_name:     str | None
    bio:             str | None
    profile_image_url: str | None
    portal_access:   bool

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    success:         bool
    message:         str
    token:           str | None = None
    is_temp_password: bool = False
    trainer:         TrainerProfileResponse | None = None


class ApiResponse(BaseModel):
    success: bool
    message: str
    data:    dict | None = None
