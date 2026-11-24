import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Extracts and authenticates current user if a valid session exists.
    Checks HttpOnly cookies first (staff_access_token, access_token), then Bearer header.
    Returns None for guest users without raising exceptions.
    """
    token: Optional[str] = None

    # Priority 1: Check HttpOnly cookies
    if "staff_access_token" in request.cookies:
        token = request.cookies.get("staff_access_token")
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    # Priority 2: Fallback to Bearer authorization header
    elif auth_header:
        token = auth_header.credentials

    if not token:
        return None

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None

    try:
        user_uuid = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        return None

    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user


async def require_authenticated_user(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Ensures caller has an active, authenticated account (any role)."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi diperlukan untuk mengakses fitur ini.",
        )
    return current_user


async def require_pembaca(
    current_user: User = Depends(require_authenticated_user),
) -> User:
    """Ensures caller has at least pembaca capabilities (pembaca, novelis, admin)."""
    if current_user.role not in ("pembaca", "novelis", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: role tidak memiliki izin membaca terautentikasi.",
        )
    return current_user


async def require_novelis(
    current_user: User = Depends(require_authenticated_user),
) -> User:
    """Ensures caller is an author (novelis) or administrator (admin)."""
    if current_user.role not in ("novelis", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: portal ini hanya untuk Novelis dan Admin.",
        )
    return current_user


async def require_admin(
    current_user: User = Depends(require_authenticated_user),
) -> User:
    """Ensures caller holds administrator (admin) privileges exclusively."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: tindakan ini memerlukan hak akses Administrator.",
        )
    return current_user
