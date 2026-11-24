import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Google Identity Services JWT id_token")


class StaffLoginRequest(BaseModel):
    identifier: str = Field(..., description="Staff username or registered email")
    password: str = Field(..., min_length=6, description="Staff password")


class StaffVerifyOtpRequest(BaseModel):
    identifier: str = Field(..., description="Staff username or registered email")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit numeric OTP")


class StaffRefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Staff refresh token if not sent via cookie")


class StaffForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Staff registered email address")


class StaffResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Staff registered email address")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    new_password: str = Field(..., min_length=8, description="New strong password")


class UserOut(BaseModel):
    id: uuid.UUID
    username: Optional[str] = None
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StaffLoginResponseData(BaseModel):
    message: str
    email: str
    expires_in_seconds: int


class StaffAuthSuccessData(BaseModel):
    user: UserOut
    redirect_url: str


class RefreshTokenSuccessData(BaseModel):
    message: str
