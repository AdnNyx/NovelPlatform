import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==============================================================================
# Password Hashing & Verification
# ==============================================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a password with bcrypt."""
    return pwd_context.hash(password)


# ==============================================================================
# OTP Generation & Cryptographic Hashing
# ==============================================================================
def generate_otp_code() -> str:
    """Generates a cryptographically random 6-digit numeric OTP."""
    code = secrets.randbelow(1_000_000)
    return f"{code:06d}"


def hash_otp_code(otp_code: str) -> str:
    """
    Creates an HMAC-SHA256 hash of the OTP code using JWT_SECRET_KEY as the salt/key.
    This prevents plaintext leaks in the database while allowing rapid verification.
    """
    key = settings.JWT_SECRET_KEY.encode("utf-8")
    return hmac.new(key, otp_code.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_otp_code(plain_otp: str, hashed_otp: str) -> bool:
    """Safely compares candidate plain OTP against stored hash in constant time."""
    candidate_hash = hash_otp_code(plain_otp)
    return hmac.compare_digest(candidate_hash, hashed_otp)


# ==============================================================================
# JWT Creation & Verification
# ==============================================================================
def create_access_token(
    subject: str,
    role: str,
    token_type: str,
    expires_delta: timedelta,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Encodes a signed JWT with subject (user id), role, token_type, and expiry."""
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": expire,
    }
    if additional_claims:
        payload.update(additional_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_reader_access_token(user_id: str, role: str = "pembaca") -> str:
    """Issues a 7-day Reader JWT."""
    expires_delta = timedelta(days=settings.READER_JWT_EXPIRE_DAYS)
    return create_access_token(
        subject=user_id,
        role=role,
        token_type="reader_access",
        expires_delta=expires_delta,
    )


def create_staff_access_token(user_id: str, role: str) -> str:
    """Issues a 2-hour Staff Access JWT."""
    expires_delta = timedelta(hours=settings.STAFF_JWT_EXPIRE_HOURS)
    return create_access_token(
        subject=user_id,
        role=role,
        token_type="staff_access",
        expires_delta=expires_delta,
    )


def create_staff_refresh_token(user_id: str, role: str) -> str:
    """Issues a 7-day Staff Refresh Token."""
    expires_delta = timedelta(days=settings.STAFF_REFRESH_TOKEN_EXPIRE_DAYS)
    return create_access_token(
        subject=user_id,
        role=role,
        token_type="staff_refresh",
        expires_delta=expires_delta,
    )


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT signature and expiration. Returns payload or None."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


# ==============================================================================
# Google OAuth ID Token Verification
# ==============================================================================
def verify_google_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies Google OAuth id_token via Google Identity Services.
    Returns dict containing google_id, email, name, picture, or None if invalid.
    """
    try:
        request = google_requests.Request()
        audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        id_info = google_id_token.verify_oauth2_token(id_token, request, audience)
        return id_info
    except Exception:
        return None
