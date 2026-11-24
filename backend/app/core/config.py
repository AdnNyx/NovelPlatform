from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "Web Baca Novel Publik API"
    IS_PRODUCTION: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Supabase (Storage & Service Role Key)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # JWT Authentication
    JWT_SECRET_KEY: str = "temporary-secret-key-for-development-only-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    READER_JWT_EXPIRE_DAYS: int = 7
    STAFF_JWT_EXPIRE_HOURS: int = 2
    STAFF_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # SMTP Configuration for Staff OTP delivery
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Web Baca Novel Publik <noreply@novelpublik.com>"

    # Frontend Origin & CORS
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
