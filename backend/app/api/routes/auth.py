import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_reader_access_token,
    create_staff_access_token,
    create_staff_refresh_token,
    decode_token,
    generate_otp_code,
    get_password_hash,
    hash_otp_code,
    verify_google_id_token,
    verify_otp_code,
    verify_password,
)
from app.models.user import OtpCode, User
from app.schemas.auth import (
    GoogleAuthRequest,
    RefreshTokenSuccessData,
    StaffAuthSuccessData,
    StaffForgotPasswordRequest,
    StaffLoginRequest,
    StaffLoginResponseData,
    StaffRefreshTokenRequest,
    StaffResetPasswordRequest,
    StaffVerifyOtpRequest,
    UserOut,
)
from app.schemas.base import MessageData, StandardResponse
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _mask_email(email: str) -> str:
    """Masks email address for secure public feedback (e.g., u***r@example.com)."""
    if "@" not in email:
        return email
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


# ==============================================================================
# Track 1: Reader Authentication via Google OAuth
# ==============================================================================
@router.post(
    "/google",
    response_model=StandardResponse[UserOut],
    summary="Authenticate Reader via Google OAuth ID Token",
)
async def auth_google(
    payload: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Verifies Google OAuth id_token. Auto-registers new reader accounts.
    Issues 7-day HttpOnly Reader JWT cookie.
    """
    token_info = verify_google_id_token(payload.id_token)
    if not token_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token tidak valid atau telah kedaluwarsa.",
        )

    google_id = token_info.get("sub")
    email = token_info.get("email")
    display_name = token_info.get("name") or (email.split("@")[0] if email else "Pembaca")
    avatar_url = token_info.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informasi email tidak ditemukan di dalam Google ID token.",
        )

    # Query existing user by google_id or email
    stmt = select(User).where((User.google_id == google_id) | (User.email == email))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akun Anda dinonaktifkan. Hubungi Administrator.",
            )
        # Link google_id if missing
        if not user.google_id and google_id:
            user.google_id = google_id
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
    else:
        user = User(
            email=email,
            display_name=display_name,
            google_id=google_id,
            avatar_url=avatar_url,
            role="pembaca",
            is_active=True,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    # Issue 7-day Reader JWT
    reader_token = create_reader_access_token(str(user.id), user.role)
    response.set_cookie(
        key="access_token",
        value=reader_token,
        max_age=settings.READER_JWT_EXPIRE_DAYS * 86400,
        httponly=True,
        samesite="lax",
        secure=settings.IS_PRODUCTION,
        path="/",
    )

    return StandardResponse(data=user)


# ==============================================================================
# Track 2: Staff Authentication Step 1 — Credentials & OTP Dispatch
# ==============================================================================
@router.post(
    "/staff/login",
    response_model=StandardResponse[StaffLoginResponseData],
    summary="Staff Login Step 1: Validate credentials and dispatch 6-digit OTP",
)
async def staff_login(
    payload: StaffLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates staff credentials (username/email + password).
    Enforces 5 consecutive attempts lockout (15 minutes), OTP throttling,
    and dispatches 6-digit OTP code to staff email.
    """
    identifier = payload.identifier.strip()
    stmt = select(User).where(
        (User.username == identifier) | (User.email == identifier)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # Generic 401 for non-existent users
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid.",
        )

    # Strict RBAC Guardrail: Pembaca accounts cannot log in as staff
    if user.role == "pembaca":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun pembaca tidak memiliki izin masuk ke Portal Staff.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun staff dinonaktifkan. Hubungi Administrator.",
        )

    now_utc = datetime.now(timezone.utc)

    # Check 15-minute account lockout
    if user.locked_until and user.locked_until > now_utc:
        remaining_seconds = int((user.locked_until - now_utc).total_seconds())
        remaining_minutes = max(1, remaining_seconds // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Akun terkunci karena terlalu banyak percobaan gagal. Silakan coba lagi dalam {remaining_minutes} menit.",
        )

    # Verify password
    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = now_utc + timedelta(minutes=15)
            user.failed_login_attempts = 0
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Terlalu banyak percobaan gagal. Akun dikunci selama 15 menit.",
            )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid.",
        )

    # Password verified: reset failure counters
    user.failed_login_attempts = 0
    user.locked_until = None

    # OTP Rate Limits: Max 3 requests per hour
    one_hour_ago = now_utc - timedelta(hours=1)
    hourly_count_stmt = select(func.count(OtpCode.id)).where(
        OtpCode.email == user.email,
        OtpCode.created_at >= one_hour_ago,
    )
    hourly_count = (await db.execute(hourly_count_stmt)).scalar() or 0
    if hourly_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Batas permintaan OTP terlampaui. Maksimal 3 kali per jam.",
        )

    # OTP Rate Limits: 60-second cooldown
    latest_otp_stmt = (
        select(OtpCode)
        .where(OtpCode.email == user.email)
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    )
    latest_otp = (await db.execute(latest_otp_stmt)).scalar_one_or_none()
    if latest_otp:
        time_since_last = (now_utc - latest_otp.created_at).total_seconds()
        if time_since_last < 60:
            cooldown_left = 60 - int(time_since_last)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Harap tunggu {cooldown_left} detik sebelum meminta kode OTP baru.",
            )

    # Generate cryptographically secure 6-digit OTP & HMAC-SHA256 hash
    otp_code = generate_otp_code()
    otp_hash = hash_otp_code(otp_code)
    otp_entry = OtpCode(
        email=user.email,
        code_hash=otp_hash,
        expires_at=now_utc + timedelta(minutes=5),
        is_used=False,
    )
    db.add(otp_entry)
    await db.commit()

    # Dispatch email
    await email_service.send_otp_email(user.email, otp_code)

    return StandardResponse(
        data=StaffLoginResponseData(
            message="Kode OTP telah dikirimkan ke email terdaftar Anda.",
            email=_mask_email(user.email),
            expires_in_seconds=300,
        )
    )


# ==============================================================================
# Track 2: Staff Authentication Step 2 — OTP Verification & Token Issuance
# ==============================================================================
@router.post(
    "/staff/verify-otp",
    response_model=StandardResponse[StaffAuthSuccessData],
    summary="Staff Login Step 2: Verify OTP and issue 2-hour Staff Access JWT + Refresh Token",
)
async def staff_verify_otp(
    payload: StaffVerifyOtpRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates the 6-digit OTP code against unexpired hashes in otp_codes.
    Issues 2-hour Staff Access JWT + 7-day Refresh Token in HttpOnly cookies.
    """
    identifier = payload.identifier.strip()
    stmt = select(User).where(
        (User.username == identifier) | (User.email == identifier)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or user.role not in ("novelis", "admin"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun dinonaktifkan.",
        )

    now_utc = datetime.now(timezone.utc)

    # Query active, unexpired, unused OTP codes for this user's email
    active_otp_stmt = (
        select(OtpCode)
        .where(
            OtpCode.email == user.email,
            OtpCode.is_used == False,
            OtpCode.expires_at > now_utc,
        )
        .order_by(OtpCode.created_at.desc())
    )
    active_otps = (await db.execute(active_otp_stmt)).scalars().all()

    if not active_otps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode OTP telah kedaluwarsa atau tidak valid. Silakan minta kode baru.",
        )

    matched_otp: Optional[OtpCode] = None
    for otp_record in active_otps:
        if verify_otp_code(payload.otp_code.strip(), otp_record.code_hash):
            matched_otp = otp_record
            break

    if not matched_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode OTP yang Anda masukkan salah.",
        )

    # Mark OTP as consumed
    matched_otp.is_used = True
    await db.commit()

    # Generate Staff Access JWT (2 hours) and Staff Refresh Token (7 days)
    staff_access_token = create_staff_access_token(str(user.id), user.role)
    staff_refresh_token = create_staff_refresh_token(str(user.id), user.role)

    # Set HttpOnly Cookies
    response.set_cookie(
        key="staff_access_token",
        value=staff_access_token,
        max_age=settings.STAFF_JWT_EXPIRE_HOURS * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.IS_PRODUCTION,
        path="/",
    )
    response.set_cookie(
        key="staff_refresh_token",
        value=staff_refresh_token,
        max_age=settings.STAFF_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,
        samesite="lax",
        secure=settings.IS_PRODUCTION,
        path="/",
    )

    redirect_url = (
        "/staff/novelis/dashboard" if user.role == "novelis" else "/staff/admin/dashboard"
    )

    return StandardResponse(
        data=StaffAuthSuccessData(
            user=user,
            redirect_url=redirect_url,
        )
    )


# ==============================================================================
# Staff Token Silent Refresh
# ==============================================================================
@router.post(
    "/staff/refresh",
    response_model=StandardResponse[RefreshTokenSuccessData],
    summary="Silently refresh Staff Access JWT using HttpOnly Refresh Token",
)
async def staff_refresh(
    request: Request,
    response: Response,
    payload: Optional[StaffRefreshTokenRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """Refreshes the 2-hour Staff Access JWT without re-authenticating with OTP."""
    token = request.cookies.get("staff_refresh_token")
    if not token and payload and payload.refresh_token:
        token = payload.refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token tidak ditemukan.",
        )

    claims = decode_token(token)
    if not claims or claims.get("type") != "staff_refresh" or "sub" not in claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token tidak valid atau telah kedaluwarsa.",
        )

    try:
        user_uuid = uuid.UUID(claims["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Subjek token tidak valid.",
        )

    stmt = select(User).where(User.id == user_uuid)
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not user.is_active or user.role not in ("novelis", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: pengguna tidak aktif atau tidak berwenang.",
        )

    # Issue new 2-hour Staff Access JWT
    new_access_token = create_staff_access_token(str(user.id), user.role)
    response.set_cookie(
        key="staff_access_token",
        value=new_access_token,
        max_age=settings.STAFF_JWT_EXPIRE_HOURS * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.IS_PRODUCTION,
        path="/",
    )

    return StandardResponse(
        data=RefreshTokenSuccessData(message="Token sesi staff berhasil diperbarui.")
    )


# ==============================================================================
# Staff Forgot Password OTP Trigger
# ==============================================================================
@router.post(
    "/staff/forgot-password",
    response_model=StandardResponse[MessageData],
    summary="Request a password reset OTP for registered Staff account",
)
async def staff_forgot_password(
    payload: StaffForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Dispatches a password reset OTP to verified staff members."""
    stmt = select(User).where(
        User.email == payload.email,
        User.role.in_(("novelis", "admin")),
        User.is_active == True,
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    now_utc = datetime.now(timezone.utc)
    # Always respond with success to mitigate user enumeration
    if user:
        # Check hourly throttle
        hourly_count_stmt = select(func.count(OtpCode.id)).where(
            OtpCode.email == user.email,
            OtpCode.created_at >= now_utc - timedelta(hours=1),
        )
        hourly_count = (await db.execute(hourly_count_stmt)).scalar() or 0
        if hourly_count < 3:
            otp_code = generate_otp_code()
            otp_hash = hash_otp_code(otp_code)
            otp_entry = OtpCode(
                email=user.email,
                code_hash=otp_hash,
                expires_at=now_utc + timedelta(minutes=5),
                is_used=False,
            )
            db.add(otp_entry)
            await db.commit()
            await email_service.send_otp_email(user.email, otp_code)

    return StandardResponse(
        data=MessageData(
            message="Jika email terdaftar sebagai staff, instruksi kode OTP telah dikirimkan."
        )
    )


# ==============================================================================
# Staff Reset Password with OTP
# ==============================================================================
@router.post(
    "/staff/reset-password",
    response_model=StandardResponse[MessageData],
    summary="Reset staff password using verified 6-digit OTP code",
)
async def staff_reset_password(
    payload: StaffResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verifies the 6-digit OTP and updates staff password."""
    stmt = select(User).where(
        User.email == payload.email,
        User.role.in_(("novelis", "admin")),
        User.is_active == True,
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permintaan tidak valid atau email tidak terdaftar.",
        )

    now_utc = datetime.now(timezone.utc)
    active_otp_stmt = (
        select(OtpCode)
        .where(
            OtpCode.email == user.email,
            OtpCode.is_used == False,
            OtpCode.expires_at > now_utc,
        )
        .order_by(OtpCode.created_at.desc())
    )
    active_otps = (await db.execute(active_otp_stmt)).scalars().all()

    matched_otp: Optional[OtpCode] = None
    for otp_record in active_otps:
        if verify_otp_code(payload.otp_code.strip(), otp_record.code_hash):
            matched_otp = otp_record
            break

    if not matched_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode OTP tidak valid atau telah kedaluwarsa.",
        )

    # Consume OTP and update password
    matched_otp.is_used = True
    user.password_hash = get_password_hash(payload.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()

    return StandardResponse(
        data=MessageData(
            message="Kata sandi berhasil direset. Silakan masuk menggunakan kata sandi baru Anda."
        )
    )


# ==============================================================================
# Session Inspection & Logout
# ==============================================================================
@router.get(
    "/me",
    response_model=StandardResponse[Optional[UserOut]],
    summary="Inspect current user profile or null for guests",
)
async def get_me(current_user: Optional[User] = Depends(get_current_user_optional)):
    """Returns profile of currently authenticated user, or null if visitor is a guest."""
    return StandardResponse(data=current_user)


@router.post(
    "/logout",
    response_model=StandardResponse[MessageData],
    summary="Clear active authentication cookies and terminate session",
)
async def logout(response: Response):
    """Deletes all active authentication cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="staff_access_token", path="/")
    response.delete_cookie(key="staff_refresh_token", path="/")
    return StandardResponse(
        data=MessageData(message="Berhasil keluar dari sesi.")
    )
