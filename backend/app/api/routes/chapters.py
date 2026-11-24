import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user_optional, require_novelis
from app.core.database import get_db
from app.core.storage import BUCKET_CHAPTER_IMAGES, BUCKET_PDFS, storage_service
from app.models.interaction import Follow, Notification
from app.models.novel import Chapter, Novel
from app.models.user import User
from app.schemas.base import MessageData, StandardResponse
from app.schemas.chapter import (
    ChapterCreateRequest,
    ChapterDetailOut,
    ChapterUpdateRequest,
    ImageUploadResponseData,
    PdfJobPollData,
    PdfUploadAcceptedData,
)
from app.services.pdf_converter import (
    create_pdf_job,
    get_pdf_job,
    process_pdf_conversion,
)
from app.services.sanitizer import sanitize_html

router = APIRouter(prefix="/chapters", tags=["Chapters"])


# ==============================================================================
# Helper Functions
# ==============================================================================
async def _recalculate_novel_chapters_count(db: AsyncSession, novel_id: uuid.UUID) -> None:
    """Updates novel.total_chapters based on published chapters."""
    now_utc = datetime.now(timezone.utc)
    count_stmt = select(func.count(Chapter.id)).where(
        Chapter.novel_id == novel_id,
        Chapter.is_published == True,
        Chapter.is_draft == False,
        or_(Chapter.published_at == None, Chapter.published_at <= now_utc),
    )
    published_count = (await db.execute(count_stmt)).scalar() or 0

    novel_stmt = select(Novel).where(Novel.id == novel_id)
    novel = (await db.execute(novel_stmt)).scalar_one_or_none()
    if novel:
        novel.total_chapters = published_count
        await db.commit()


async def _notify_followers_for_new_chapter(
    db: AsyncSession, novel: Novel, chapter: Chapter
) -> None:
    """Automatically dispatches notifications to all readers following this novel."""
    follows_stmt = select(Follow).where(Follow.novel_id == novel.id)
    follows = (await db.execute(follows_stmt)).scalars().all()

    for follow in follows:
        notification = Notification(
            user_id=follow.user_id,
            type="chapter_baru",
            title=f"Chapter Baru: {novel.title}",
            message=f"Bab {chapter.chapter_number}: {chapter.title} telah dirilis!",
            novel_id=novel.id,
            chapter_id=chapter.id,
        )
        db.add(notification)
    await db.commit()


# ==============================================================================
# Chapter Reader Endpoint
# ==============================================================================
@router.get(
    "/{id}",
    response_model=StandardResponse[ChapterDetailOut],
    summary="Get chapter reading content with navigation and increment novel views",
)
async def get_chapter_by_id(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Returns sanitized chapter content, novel metadata, and prev/next links.
    Increments novel.total_views for public reads.
    Enforces draft protection unless caller is the novel author or an admin.
    """
    stmt = (
        select(Chapter)
        .where(Chapter.id == id)
        .options(selectinload(Chapter.novel))
    )
    chapter = (await db.execute(stmt)).scalar_one_or_none()

    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter tidak ditemukan.",
        )

    novel = chapter.novel
    now_utc = datetime.now(timezone.utc)
    is_published = (
        chapter.is_published
        and not chapter.is_draft
        and (chapter.published_at is None or chapter.published_at <= now_utc)
    )

    is_author_or_admin = current_user and (
        current_user.id == novel.author_id or current_user.role == "admin"
    )

    if not is_published and not is_author_or_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter ini berstatus draft atau belum dipublikasikan.",
        )

    # Increment novel total views for published chapter readings
    if is_published:
        novel.total_views += 1
        await db.commit()

    # Find prev and next published chapters
    prev_stmt = (
        select(Chapter.id)
        .where(
            Chapter.novel_id == novel.id,
            Chapter.chapter_number < chapter.chapter_number,
            Chapter.is_published == True,
            Chapter.is_draft == False,
        )
        .order_by(desc(Chapter.chapter_number))
        .limit(1)
    )
    prev_chapter_id = (await db.execute(prev_stmt)).scalar_one_or_none()

    next_stmt = (
        select(Chapter.id)
        .where(
            Chapter.novel_id == novel.id,
            Chapter.chapter_number > chapter.chapter_number,
            Chapter.is_published == True,
            Chapter.is_draft == False,
        )
        .order_by(Chapter.chapter_number.asc())
        .limit(1)
    )
    next_chapter_id = (await db.execute(next_stmt)).scalar_one_or_none()

    return StandardResponse(
        data=ChapterDetailOut(
            id=chapter.id,
            novel_id=novel.id,
            novel_title=novel.title,
            novel_slug=novel.slug,
            chapter_number=chapter.chapter_number,
            title=chapter.title,
            content_html=chapter.content_html,
            is_draft=chapter.is_draft,
            is_published=chapter.is_published,
            published_at=chapter.published_at,
            prev_chapter_id=prev_chapter_id,
            next_chapter_id=next_chapter_id,
            created_at=chapter.created_at,
        )
    )


# ==============================================================================
# Chapter CRUD Operations (Author & Admin)
# ==============================================================================
@router.post(
    "",
    response_model=StandardResponse[ChapterDetailOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chapter with HTML sanitization & notification trigger",
)
async def create_chapter(
    payload: ChapterCreateRequest,
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new chapter.
    Sanitizes content_html.
    Triggers follower notifications if published immediately.
    """
    novel_stmt = select(Novel).where(Novel.id == payload.novel_id)
    novel = (await db.execute(novel_stmt)).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    # Ownership verification
    if novel.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda tidak memiliki izin untuk menambahkan chapter pada novel ini.",
        )

    # Check unique (novel_id, chapter_number)
    dup_stmt = select(Chapter).where(
        Chapter.novel_id == novel.id,
        Chapter.chapter_number == payload.chapter_number,
    )
    if (await db.execute(dup_stmt)).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nomor chapter {payload.chapter_number} sudah digunakan pada novel ini.",
        )

    # Mandatory HTML Sanitization
    clean_html = sanitize_html(payload.content_html)

    now_utc = datetime.now(timezone.utc)
    published_at = payload.published_at
    if payload.is_published and not payload.is_draft and not published_at:
        published_at = now_utc

    new_chapter = Chapter(
        novel_id=novel.id,
        chapter_number=payload.chapter_number,
        title=payload.title.strip(),
        content_html=clean_html,
        is_draft=payload.is_draft,
        is_published=payload.is_published,
        published_at=published_at,
    )
    db.add(new_chapter)
    await db.commit()
    await db.refresh(new_chapter)

    # Dispatch follower notifications if immediately published
    if (
        new_chapter.is_published
        and not new_chapter.is_draft
        and (new_chapter.published_at is None or new_chapter.published_at <= now_utc)
    ):
        await _notify_followers_for_new_chapter(db, novel, new_chapter)

    # Recalculate novel chapters count
    await _recalculate_novel_chapters_count(db, novel.id)

    return StandardResponse(
        data=ChapterDetailOut(
            id=new_chapter.id,
            novel_id=novel.id,
            novel_title=novel.title,
            novel_slug=novel.slug,
            chapter_number=new_chapter.chapter_number,
            title=new_chapter.title,
            content_html=new_chapter.content_html,
            is_draft=new_chapter.is_draft,
            is_published=new_chapter.is_published,
            published_at=new_chapter.published_at,
            created_at=new_chapter.created_at,
        )
    )


@router.put(
    "/{id}",
    response_model=StandardResponse[ChapterDetailOut],
    summary="Update chapter content, status, or schedule",
)
async def update_chapter(
    id: uuid.UUID,
    payload: ChapterUpdateRequest,
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates chapter fields with mandatory HTML sanitization.
    Dispatches follower notifications if status transitions to published.
    """
    stmt = (
        select(Chapter)
        .where(Chapter.id == id)
        .options(selectinload(Chapter.novel))
    )
    chapter = (await db.execute(stmt)).scalar_one_or_none()

    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter tidak ditemukan.",
        )

    novel = chapter.novel
    if novel.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda tidak memiliki izin untuk mengedit chapter ini.",
        )

    # Check chapter_number collision if altered
    if (
        payload.chapter_number is not None
        and payload.chapter_number != chapter.chapter_number
    ):
        dup_stmt = select(Chapter).where(
            Chapter.novel_id == novel.id,
            Chapter.chapter_number == payload.chapter_number,
        )
        if (await db.execute(dup_stmt)).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nomor chapter {payload.chapter_number} sudah digunakan.",
            )
        chapter.chapter_number = payload.chapter_number

    if payload.title is not None:
        chapter.title = payload.title.strip()

    if payload.content_html is not None:
        chapter.content_html = sanitize_html(payload.content_html)

    was_published = chapter.is_published and not chapter.is_draft

    if payload.is_draft is not None:
        chapter.is_draft = payload.is_draft

    if payload.is_published is not None:
        chapter.is_published = payload.is_published

    if payload.published_at is not None:
        chapter.published_at = payload.published_at

    now_utc = datetime.now(timezone.utc)
    is_now_published = chapter.is_published and not chapter.is_draft

    await db.commit()
    await db.refresh(chapter)

    # If transitioning to published for the first time, notify followers
    if not was_published and is_now_published:
        await _notify_followers_for_new_chapter(db, novel, chapter)

    await _recalculate_novel_chapters_count(db, novel.id)

    return StandardResponse(
        data=ChapterDetailOut(
            id=chapter.id,
            novel_id=novel.id,
            novel_title=novel.title,
            novel_slug=novel.slug,
            chapter_number=chapter.chapter_number,
            title=chapter.title,
            content_html=chapter.content_html,
            is_draft=chapter.is_draft,
            is_published=chapter.is_published,
            published_at=chapter.published_at,
            created_at=chapter.created_at,
        )
    )


@router.delete(
    "/{id}",
    response_model=StandardResponse[MessageData],
    summary="Delete chapter and recalculate total chapters",
)
async def delete_chapter(
    id: uuid.UUID,
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """Deletes chapter and recalculates total_chapters."""
    stmt = (
        select(Chapter)
        .where(Chapter.id == id)
        .options(selectinload(Chapter.novel))
    )
    chapter = (await db.execute(stmt)).scalar_one_or_none()

    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter tidak ditemukan.",
        )

    novel = chapter.novel
    if novel.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda tidak memiliki izin untuk menghapus chapter ini.",
        )

    novel_id = novel.id
    await db.delete(chapter)
    await db.commit()

    await _recalculate_novel_chapters_count(db, novel_id)

    return StandardResponse(
        data=MessageData(message="Chapter berhasil dihapus.")
    )


# ==============================================================================
# Editor Media Upload (chapter-images bucket)
# ==============================================================================
@router.post(
    "/upload-image",
    response_model=StandardResponse[ImageUploadResponseData],
    summary="Upload inline image to chapter-images bucket for TipTap editor",
)
async def upload_chapter_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_novelis),
):
    """
    Validates MIME (JPG, PNG, WebP, GIF) and max size 5MB.
    Uploads file to Supabase Storage 'chapter-images' bucket.
    Returns public URL for embedding in TipTap.
    """
    allowed_mimes = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format gambar tidak valid. Gunakan JPEG, PNG, WebP, atau GIF.",
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran gambar maksimal 5 MB.",
        )

    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "jpg"
    storage_path = f"inline/{uuid.uuid4()}.{ext}"

    public_url = storage_service.upload_file(
        bucket=BUCKET_CHAPTER_IMAGES,
        path=storage_path,
        file_bytes=content,
        content_type=file.content_type,
    )

    return StandardResponse(data=ImageUploadResponseData(url=public_url))


# ==============================================================================
# PDF Upload & Background Conversion Pipeline
# ==============================================================================
@router.post(
    "/upload-pdf",
    response_model=StandardResponse[PdfUploadAcceptedData],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload PDF chapter and dispatch async PyMuPDF background conversion worker",
)
async def upload_pdf_chapter(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(require_novelis),
):
    """
    Accepts PDF upload (max 25MB).
    Temporarily stores PDF in private 'pdfs' bucket.
    Dispatches background conversion worker and returns HTTP 202 with job_id.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format file harus berupa dokumen PDF (application/pdf).",
        )

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file PDF maksimal 25 MB.",
        )

    # Store temp PDF in private bucket
    temp_pdf_path = f"incoming/{uuid.uuid4()}.pdf"
    storage_service.upload_file(
        bucket=BUCKET_PDFS,
        path=temp_pdf_path,
        file_bytes=pdf_bytes,
        content_type="application/pdf",
    )

    # Initialize job in registry
    job_id = create_pdf_job()

    # Dispatch background worker
    background_tasks.add_task(process_pdf_conversion, job_id, temp_pdf_path)

    return StandardResponse(
        data=PdfUploadAcceptedData(job_id=job_id, job_status="processing")
    )


@router.get(
    "/pdf-jobs/{job_id}",
    response_model=StandardResponse[PdfJobPollData],
    summary="Poll status of PDF-to-HTML conversion job",
)
async def poll_pdf_job(
    job_id: str,
    response: Response,
    current_user: User = Depends(require_novelis),
):
    """
    Polls the current status of an async PDF conversion job.
    Matches CONTRACTS.md Section 5 schema.
    """
    job_info = get_pdf_job(job_id)
    if not job_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job konversi PDF tidak ditemukan.",
        )

    return StandardResponse(
        status="error" if job_info.get("job_status") == "failed" else "success",
        data=PdfJobPollData(
            job_id=job_info["job_id"],
            job_status=job_info["job_status"],
            chapters=job_info.get("chapters"),
            error=job_info.get("error"),
        ),
    )
