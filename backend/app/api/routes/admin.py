import re
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.interaction import Comment
from app.models.novel import Chapter, Genre, Novel, Tag
from app.models.user import User
from app.schemas.admin import (
    AdminApproveNovelRequest,
    AdminBanUserRequest,
    AdminCommentOut,
    AdminCreateStaffRequest,
    AdminStatsOut,
    AdminUpdateRoleRequest,
)
from app.schemas.auth import UserOut
from app.schemas.base import MessageData, PaginatedResponse, PaginationMeta, StandardResponse
from app.schemas.interaction import GenreCreateRequest, GenreOut, TagCreateRequest, TagOut
from app.schemas.novel import NovelOut

router = APIRouter(prefix="/admin", tags=["Admin Governance"])


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


# ==============================================================================
# Platform Statistics
# ==============================================================================
@router.get(
    "/stats",
    response_model=StandardResponse[AdminStatsOut],
    summary="Get global platform statistics (users, novels, chapters, reports)",
)
async def get_admin_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns platform-wide aggregate counts."""
    u_stmt = select(func.count(User.id))
    total_users = (await db.execute(u_stmt)).scalar() or 0

    n_stmt = select(func.count(Novel.id))
    total_novels = (await db.execute(n_stmt)).scalar() or 0

    c_stmt = select(func.count(Chapter.id))
    total_chapters = (await db.execute(c_stmt)).scalar() or 0

    rep_stmt = select(func.count(Comment.id)).where(Comment.is_reported == True)
    reported_comments = (await db.execute(rep_stmt)).scalar() or 0

    return StandardResponse(
        data=AdminStatsOut(
            total_users=total_users,
            total_novels=total_novels,
            total_chapters=total_chapters,
            reported_comments=reported_comments,
        )
    )


# ==============================================================================
# User Management
# ==============================================================================
@router.get(
    "/users",
    response_model=PaginatedResponse[UserOut],
    summary="List and search users with role filter and pagination",
)
async def list_admin_users(
    q: Optional[str] = Query(None, description="Search by username, email, or display name"),
    role: Optional[str] = Query(None, pattern="^(pembaca|novelis|admin)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns paginated user list."""
    query = select(User).order_by(desc(User.created_at))

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(term),
                User.username.ilike(term),
                User.display_name.ilike(term),
            )
        )

    if role:
        query = query.where(User.role == role)

    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * limit
    paginated_query = query.offset(offset).limit(limit)
    users = (await db.execute(paginated_query)).scalars().all()

    return PaginatedResponse(
        data=users,
        meta=PaginationMeta(page=page, limit=limit, total=total_count),
    )


@router.post(
    "/users",
    response_model=StandardResponse[UserOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Staff account (novelis or admin)",
)
async def create_staff_user(
    payload: AdminCreateStaffRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new Novelis or Admin account with hashed password."""
    # Check email uniqueness
    e_stmt = select(User).where(User.email == payload.email)
    if (await db.execute(e_stmt)).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar.",
        )

    # Check username uniqueness
    u_stmt = select(User).where(User.username == payload.username.strip())
    if (await db.execute(u_stmt)).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah digunakan.",
        )

    new_user = User(
        username=payload.username.strip(),
        email=payload.email,
        display_name=payload.display_name.strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return StandardResponse(data=new_user)


@router.put(
    "/users/{id}/role",
    response_model=StandardResponse[UserOut],
    summary="Update user role (pembaca, novelis, admin)",
)
async def update_user_role(
    id: uuid.UUID,
    payload: AdminUpdateRoleRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Promotes or changes a user's role."""
    user = (await db.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pengguna tidak ditemukan.",
        )

    user.role = payload.role
    await db.commit()
    await db.refresh(user)

    return StandardResponse(data=user)


@router.put(
    "/users/{id}/ban",
    response_model=StandardResponse[UserOut],
    summary="Ban or unban user account",
)
async def toggle_ban_user(
    id: uuid.UUID,
    payload: AdminBanUserRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Sets user active or banned status."""
    if id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menonaktifkan akun administrator Anda sendiri.",
        )

    user = (await db.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pengguna tidak ditemukan.",
        )

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)

    return StandardResponse(data=user)


# ==============================================================================
# Novel Moderation
# ==============================================================================
@router.get(
    "/novels",
    response_model=PaginatedResponse[NovelOut],
    summary="List all novels including unapproved/draft for moderation",
)
async def list_admin_novels(
    q: Optional[str] = Query(None),
    is_approved: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns list of novels across all approval statuses."""
    query = (
        select(Novel)
        .options(selectinload(Novel.author))
        .order_by(desc(Novel.created_at))
    )

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(Novel.title.ilike(term))

    if is_approved is not None:
        query = query.where(Novel.is_approved == is_approved)

    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * limit
    paginated_query = query.offset(offset).limit(limit)
    novels = (await db.execute(paginated_query)).scalars().all()

    return PaginatedResponse(
        data=novels,
        meta=PaginationMeta(page=page, limit=limit, total=total_count),
    )


@router.put(
    "/novels/{id}/approve",
    response_model=StandardResponse[NovelOut],
    summary="Approve or unpublish a novel",
)
async def approve_novel(
    id: uuid.UUID,
    payload: AdminApproveNovelRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Sets approval status for a novel."""
    novel = (
        await db.execute(
            select(Novel).where(Novel.id == id).options(selectinload(Novel.author))
        )
    ).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    novel.is_approved = payload.is_approved
    await db.commit()
    await db.refresh(novel)

    return StandardResponse(data=novel)


@router.delete(
    "/novels/{id}",
    response_model=StandardResponse[MessageData],
    summary="Permanently delete a novel (Admin privilege)",
)
async def admin_delete_novel(
    id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deletes novel and all associated chapters."""
    novel = (await db.execute(select(Novel).where(Novel.id == id))).scalar_one_or_none()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    await db.delete(novel)
    await db.commit()

    return StandardResponse(data=MessageData(message="Novel berhasil dihapus oleh admin."))


# ==============================================================================
# Master Genres & Tags Management
# ==============================================================================
@router.get(
    "/genres",
    response_model=StandardResponse[List[GenreOut]],
    summary="List all genres",
)
async def list_admin_genres(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    genres = (await db.execute(select(Genre).order_by(Genre.name.asc()))).scalars().all()
    return StandardResponse(data=genres)


@router.post(
    "/genres",
    response_model=StandardResponse[GenreOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new genre",
)
async def create_genre(
    payload: GenreCreateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    slug = _slugify(payload.name)
    existing = (
        await db.execute(
            select(Genre).where(or_(Genre.name == payload.name.strip(), Genre.slug == slug))
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Genre sudah ada.",
        )

    genre = Genre(name=payload.name.strip(), slug=slug)
    db.add(genre)
    await db.commit()
    await db.refresh(genre)
    return StandardResponse(data=genre)


@router.delete(
    "/genres/{id}",
    response_model=StandardResponse[MessageData],
    summary="Delete a genre",
)
async def delete_genre(
    id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    genre = (await db.execute(select(Genre).where(Genre.id == id))).scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Genre tidak ditemukan.")
    await db.delete(genre)
    await db.commit()
    return StandardResponse(data=MessageData(message="Genre berhasil dihapus."))


@router.get(
    "/tags",
    response_model=StandardResponse[List[TagOut]],
    summary="List all tags",
)
async def list_admin_tags(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tags = (await db.execute(select(Tag).order_by(Tag.name.asc()))).scalars().all()
    return StandardResponse(data=tags)


@router.post(
    "/tags",
    response_model=StandardResponse[TagOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tag",
)
async def create_tag(
    payload: TagCreateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    slug = _slugify(payload.name)
    existing = (
        await db.execute(
            select(Tag).where(or_(Tag.name == payload.name.strip(), Tag.slug == slug))
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag sudah ada.",
        )

    tag = Tag(name=payload.name.strip(), slug=slug)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return StandardResponse(data=tag)


@router.delete(
    "/tags/{id}",
    response_model=StandardResponse[MessageData],
    summary="Delete a tag",
)
async def delete_tag(
    id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tag = (await db.execute(select(Tag).where(Tag.id == id))).scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag tidak ditemukan.")
    await db.delete(tag)
    await db.commit()
    return StandardResponse(data=MessageData(message="Tag berhasil dihapus."))


# ==============================================================================
# Comment Moderation
# ==============================================================================
@router.get(
    "/comments",
    response_model=StandardResponse[List[AdminCommentOut]],
    summary="List comments with optional filter for reported comments only",
)
async def list_admin_comments(
    reported_only: bool = Query(True),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves comments for moderation."""
    query = (
        select(Comment)
        .options(selectinload(Comment.user))
        .order_by(desc(Comment.created_at))
    )

    if reported_only:
        query = query.where(Comment.is_reported == True)

    comments = (await db.execute(query)).scalars().all()
    return StandardResponse(data=comments)


@router.delete(
    "/comments/{id}",
    response_model=StandardResponse[MessageData],
    summary="Delete an inappropriate comment",
)
async def delete_admin_comment(
    id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Permanently deletes a comment and its nested replies."""
    comment = (await db.execute(select(Comment).where(Comment.id == id))).scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Komentar tidak ditemukan.",
        )

    await db.delete(comment)
    await db.commit()
    return StandardResponse(data=MessageData(message="Komentar berhasil dihapus oleh admin."))
