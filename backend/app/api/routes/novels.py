import json
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user_optional, require_novelis
from app.core.database import get_db
from app.core.storage import BUCKET_COVERS, storage_service
from app.models.interaction import Bookmark
from app.models.novel import Chapter, Novel
from app.models.user import User
from app.schemas.base import MessageData, PaginatedResponse, PaginationMeta, StandardResponse
from app.schemas.chapter import ChapterListItem
from app.schemas.novel import (
    NovelCreateRequest,
    NovelisDashboardData,
    NovelisDashboardStats,
    NovelOut,
    NovelUpdateRequest,
)

router = APIRouter(prefix="/novels", tags=["Novels"])


def _slugify(text: str) -> str:
    """Generates a clean URL slug from text."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


async def _generate_unique_slug(db: AsyncSession, title: str) -> str:
    """Ensures generated slug is globally unique by appending a short suffix if needed."""
    base_slug = _slugify(title)
    if not base_slug:
        base_slug = "novel"
    candidate_slug = base_slug
    counter = 1

    while True:
        stmt = select(func.count(Novel.id)).where(Novel.slug == candidate_slug)
        exists = (await db.execute(stmt)).scalar() or 0
        if exists == 0:
            return candidate_slug
        candidate_slug = f"{base_slug}-{counter}"
        counter += 1


# ==============================================================================
# Public Catalog & Discovery
# ==============================================================================
@router.get(
    "",
    response_model=PaginatedResponse[NovelOut],
    summary="List and filter novels with search, tags, genre, sort, and rankings",
)
async def list_novels(
    q: Optional[str] = Query(None, description="Search keyword across title, author display name, and tags"),
    genre: Optional[str] = Query(None, description="Filter by genre name"),
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(ongoing|tamat)$"),
    sort: Optional[str] = Query("popular", pattern="^(popular|latest|rating)$"),
    ranking: Optional[str] = Query(None, pattern="^(weekly|monthly|all_time)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns public catalog of approved novels.
    Supports title/author/tag search, multi-genre filtering, status filtering, and sorting.
    """
    query = (
        select(Novel)
        .join(Novel.author)
        .where(Novel.is_approved == True)
        .options(selectinload(Novel.author))
    )

    # Search filter (title, author display_name, tags)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(
            or_(
                Novel.title.ilike(term),
                User.display_name.ilike(term),
                Novel.tags.any(q.strip()),
            )
        )

    # Genre filter
    if genre and genre.strip():
        query = query.where(Novel.genres.any(genre.strip()))

    # Status filter
    if status_filter:
        query = query.where(Novel.status == status_filter)

    # Sorting & Leaderboard rankings
    if ranking == "weekly" or ranking == "monthly" or ranking == "all_time" or sort == "popular":
        query = query.order_by(desc(Novel.total_views))
    elif sort == "latest":
        query = query.order_by(desc(Novel.created_at))
    elif sort == "rating":
        query = query.order_by(desc(Novel.rating_avg), desc(Novel.rating_count))
    else:
        query = query.order_by(desc(Novel.created_at))

    # Total count query for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    paginated_query = query.offset(offset).limit(limit)
    res = await db.execute(paginated_query)
    novels = res.scalars().all()

    return PaginatedResponse(
        data=novels,
        meta=PaginationMeta(page=page, limit=limit, total=total_count),
    )


# ==============================================================================
# Novelis Dashboard
# ==============================================================================
@router.get(
    "/dashboard/metrics",
    response_model=StandardResponse[NovelisDashboardData],
    summary="Get author dashboard metrics and list of owned novels",
)
async def novelis_dashboard(
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns aggregate metrics (views, chapters, bookmarks) and all novels owned by current author.
    """
    # Query author novels
    stmt = (
        select(Novel)
        .where(Novel.author_id == current_user.id)
        .order_by(desc(Novel.created_at))
        .options(selectinload(Novel.author))
    )
    novels = (await db.execute(stmt)).scalars().all()

    total_views = sum(n.total_views for n in novels)
    total_novels = len(novels)
    total_chapters = sum(n.total_chapters for n in novels)

    # Total bookmarks across all author's novels
    novel_ids = [n.id for n in novels]
    total_bookmarks = 0
    if novel_ids:
        b_stmt = select(func.count(Bookmark.id)).where(Bookmark.novel_id.in_(novel_ids))
        total_bookmarks = (await db.execute(b_stmt)).scalar() or 0

    stats = NovelisDashboardStats(
        total_views=total_views,
        total_novels=total_novels,
        total_chapters=total_chapters,
        total_bookmarks=total_bookmarks,
    )

    return StandardResponse(
        data=NovelisDashboardData(stats=stats, novels=novels)
    )


# ==============================================================================
# Novel Detail & Published Chapters
# ==============================================================================
@router.get(
    "/{slug}",
    response_model=StandardResponse[NovelOut],
    summary="Get novel details by slug",
)
async def get_novel_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Retrieves full novel metadata by slug. Author and admin can view unapproved novels."""
    stmt = (
        select(Novel)
        .where(Novel.slug == slug)
        .options(selectinload(Novel.author))
    )
    novel = (await db.execute(stmt)).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    # Visibility check
    if not novel.is_approved:
        if not current_user or (
            current_user.id != novel.author_id and current_user.role != "admin"
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Novel sedang dalam peninjauan dan belum tersedia untuk publik.",
            )

    return StandardResponse(data=novel)


@router.get(
    "/{slug}/chapters",
    response_model=StandardResponse[List[ChapterListItem]],
    summary="Get ordered list of published chapters for a novel",
)
async def get_novel_chapters(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Returns the ordered chapter list for reading navigation.
    Visitors and readers only see published chapters; author and admin can also see drafts.
    """
    stmt = select(Novel).where(Novel.slug == slug)
    novel = (await db.execute(stmt)).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    is_author_or_admin = current_user and (
        current_user.id == novel.author_id or current_user.role == "admin"
    )

    now_utc = datetime.now(timezone.utc)
    chap_stmt = select(Chapter).where(Chapter.novel_id == novel.id)

    if not is_author_or_admin:
        chap_stmt = chap_stmt.where(
            Chapter.is_published == True,
            Chapter.is_draft == False,
            or_(Chapter.published_at == None, Chapter.published_at <= now_utc),
        )

    chap_stmt = chap_stmt.order_by(Chapter.chapter_number.asc())
    chapters = (await db.execute(chap_stmt)).scalars().all()

    return StandardResponse(data=chapters)


# ==============================================================================
# Novel Management (Author & Admin)
# ==============================================================================
@router.post(
    "",
    response_model=StandardResponse[NovelOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new novel and upload cover image",
)
async def create_novel(
    title: str = Form(...),
    synopsis: str = Form(...),
    genres: str = Form("[]"),
    tags: str = Form("[]"),
    status_novel: str = Form("ongoing"),
    cover: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new novel record.
    Uploads cover to 'covers' bucket (max 5MB, JPG/PNG/WebP).
    Automatically generates unique slug and sets author_id = current_user.id.
    """
    # Parse genres and tags lists
    try:
        genre_list = json.loads(genres) if genres.startswith("[") else [g.strip() for g in genres.split(",") if g.strip()]
    except Exception:
        genre_list = [genres] if genres else []

    try:
        tag_list = json.loads(tags) if tags.startswith("[") else [t.strip() for t in tags.split(",") if t.strip()]
    except Exception:
        tag_list = [tags] if tags else []

    # Cover image upload
    cover_url: Optional[str] = None
    if cover:
        allowed_mimes = {"image/jpeg", "image/png", "image/webp"}
        if cover.content_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format cover harus berupa JPG, PNG, atau WebP.",
            )

        cover_bytes = await cover.read()
        if len(cover_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ukuran gambar cover maksimal 5 MB.",
            )

        ext = cover.filename.split(".")[-1].lower() if cover.filename and "." in cover.filename else "jpg"
        file_path = f"covers/{uuid.uuid4()}.{ext}"
        cover_url = storage_service.upload_file(
            bucket=BUCKET_COVERS,
            path=file_path,
            file_bytes=cover_bytes,
            content_type=cover.content_type,
        )

    # Unique slug generation
    slug = await _generate_unique_slug(db, title)

    new_novel = Novel(
        author_id=current_user.id,
        title=title.strip(),
        slug=slug,
        cover_url=cover_url,
        synopsis=synopsis.strip(),
        genres=genre_list,
        tags=tag_list,
        status=status_novel if status_novel in ("ongoing", "tamat") else "ongoing",
        is_approved=True,  # Default approved per specification
        total_views=0,
        total_chapters=0,
    )
    db.add(new_novel)
    await db.commit()
    await db.refresh(new_novel, ["author"])

    return StandardResponse(data=new_novel)


@router.put(
    "/{id}",
    response_model=StandardResponse[NovelOut],
    summary="Update owned novel metadata or cover",
)
async def update_novel(
    id: uuid.UUID,
    payload: NovelUpdateRequest,
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates novel fields.
    Enforces strict resource ownership (novel.author_id == current_user.id or admin).
    """
    stmt = select(Novel).where(Novel.id == id).options(selectinload(Novel.author))
    novel = (await db.execute(stmt)).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    # Strict RBAC Guardrail
    if novel.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda tidak memiliki izin untuk mengedit novel ini.",
        )

    if payload.title is not None and payload.title.strip() != novel.title:
        novel.title = payload.title.strip()
        novel.slug = await _generate_unique_slug(db, payload.title.strip())

    if payload.synopsis is not None:
        novel.synopsis = payload.synopsis.strip()

    if payload.genres is not None:
        novel.genres = payload.genres

    if payload.tags is not None:
        novel.tags = payload.tags

    if payload.status is not None:
        novel.status = payload.status

    if payload.cover_url is not None:
        novel.cover_url = payload.cover_url

    await db.commit()
    await db.refresh(novel)

    return StandardResponse(data=novel)


@router.delete(
    "/{id}",
    response_model=StandardResponse[MessageData],
    summary="Delete owned novel",
)
async def delete_novel(
    id: uuid.UUID,
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes novel.
    Enforces ownership (novel.author_id == current_user.id or admin).
    """
    stmt = select(Novel).where(Novel.id == id)
    novel = (await db.execute(stmt)).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    if novel.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda tidak memiliki izin untuk menghapus novel ini.",
        )

    await db.delete(novel)
    await db.commit()

    return StandardResponse(
        data=MessageData(message="Novel berhasil dihapus secara permanen.")
    )
