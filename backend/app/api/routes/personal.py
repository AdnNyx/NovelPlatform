import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user_optional, require_pembaca
from app.core.database import get_db
from app.core.storage import BUCKET_COVERS, storage_service
from app.models.interaction import (
    Bookmark,
    Comment,
    Follow,
    History,
    Notification,
    Rating,
)
from app.models.novel import Chapter, Genre, Novel, Tag
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.base import MessageData, StandardResponse
from app.schemas.interaction import (
    CommentCreateRequest,
    CommentOut,
    GenreOut,
    RatingCreateRequest,
    RatingOut,
    TagOut,
)
from app.schemas.personal import (
    AvatarUploadResponse,
    BookmarkCreateRequest,
    BookmarkNovelOut,
    BookmarkOut,
    FollowNovelResponse,
    HistoryCreateRequest,
    HistoryOut,
    NotificationListOut,
    NotificationOut,
    NovelUserStateOut,
    ProfileUpdateRequest,
)

router = APIRouter(tags=["Personalization & Interactions"])


# ==============================================================================
# 1. Bookmarks (Bookshelf)
# ==============================================================================
@router.get(
    "/bookmarks",
    response_model=StandardResponse[List[BookmarkOut]],
    summary="Get user's bookmarked novels by category",
)
async def get_bookmarks(
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all bookmarked novels for the authenticated reader."""
    stmt = (
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id)
        .options(selectinload(Bookmark.novel))
        .order_by(desc(Bookmark.created_at))
    )
    bookmarks = (await db.execute(stmt)).scalars().all()
    return StandardResponse(data=bookmarks)


@router.post(
    "/bookmarks",
    response_model=StandardResponse[BookmarkOut],
    summary="Upsert bookmark category for a novel",
)
async def upsert_bookmark(
    payload: BookmarkCreateRequest,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Upserts novel bookmark into one of: sedang_dibaca, ingin_dibaca, favorit, selesai."""
    # Verify novel exists
    novel_stmt = select(Novel).where(Novel.id == payload.novel_id)
    novel = (await db.execute(novel_stmt)).scalar_one_or_none()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    stmt = select(Bookmark).where(
        Bookmark.user_id == current_user.id,
        Bookmark.novel_id == payload.novel_id,
    ).options(selectinload(Bookmark.novel))
    bookmark = (await db.execute(stmt)).scalar_one_or_none()

    if bookmark:
        bookmark.category = payload.category
    else:
        bookmark = Bookmark(
            user_id=current_user.id,
            novel_id=payload.novel_id,
            category=payload.category,
        )
        db.add(bookmark)

    await db.commit()
    await db.refresh(bookmark, ["novel"])
    return StandardResponse(data=bookmark)


@router.delete(
    "/bookmarks/{novel_id}",
    response_model=StandardResponse[MessageData],
    summary="Remove a novel from bookmarks",
)
async def remove_bookmark(
    novel_id: uuid.UUID,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Removes a bookmark entry for the novel."""
    stmt = select(Bookmark).where(
        Bookmark.user_id == current_user.id,
        Bookmark.novel_id == novel_id,
    )
    bookmark = (await db.execute(stmt)).scalar_one_or_none()
    if bookmark:
        await db.delete(bookmark)
        await db.commit()
    return StandardResponse(
        data=MessageData(message="Bookmark berhasil dihapus.")
    )


# ==============================================================================
# 2. Reading Histories
# ==============================================================================
@router.get(
    "/histories",
    response_model=StandardResponse[List[HistoryOut]],
    summary="Get user's reading history for 1-click resume",
)
async def get_reading_history(
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Returns the user's reading history ordered by most recently read."""
    stmt = (
        select(History)
        .where(History.user_id == current_user.id)
        .options(selectinload(History.novel), selectinload(History.chapter))
        .order_by(desc(History.updated_at))
    )
    histories = (await db.execute(stmt)).scalars().all()

    result: List[HistoryOut] = []
    for h in histories:
        result.append(
            HistoryOut(
                id=h.id,
                novel_id=h.novel_id,
                chapter_id=h.chapter_id,
                last_position=h.last_position,
                updated_at=h.updated_at,
                novel_title=h.novel.title if h.novel else "Novel",
                novel_slug=h.novel.slug if h.novel else "",
                cover_url=h.novel.cover_url if h.novel else None,
                chapter_number=h.chapter.chapter_number if h.chapter else 1,
                chapter_title=h.chapter.title if h.chapter else "Bab",
            )
        )
    return StandardResponse(data=result)


@router.post(
    "/histories",
    response_model=StandardResponse[HistoryOut],
    summary="Upsert debounced chapter reading scroll progress",
)
async def upsert_reading_history(
    payload: HistoryCreateRequest,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Updates reading progress percentage (0.00-100.00) for a novel."""
    stmt = (
        select(History)
        .where(
            History.user_id == current_user.id,
            History.novel_id == payload.novel_id,
        )
        .options(selectinload(History.novel), selectinload(History.chapter))
    )
    history = (await db.execute(stmt)).scalar_one_or_none()

    now_utc = datetime.now(timezone.utc)
    if history:
        history.chapter_id = payload.chapter_id
        history.last_position = payload.last_position
        history.updated_at = now_utc
    else:
        history = History(
            user_id=current_user.id,
            novel_id=payload.novel_id,
            chapter_id=payload.chapter_id,
            last_position=payload.last_position,
            updated_at=now_utc,
        )
        db.add(history)

    await db.commit()
    await db.refresh(history, ["novel", "chapter"])

    return StandardResponse(
        data=HistoryOut(
            id=history.id,
            novel_id=history.novel_id,
            chapter_id=history.chapter_id,
            last_position=history.last_position,
            updated_at=history.updated_at,
            novel_title=history.novel.title if history.novel else "Novel",
            novel_slug=history.novel.slug if history.novel else "",
            cover_url=history.novel.cover_url if history.novel else None,
            chapter_number=history.chapter.chapter_number if history.chapter else 1,
            chapter_title=history.chapter.title if history.chapter else "Bab",
        )
    )


# ==============================================================================
# 3. Follows & Novel User State
# ==============================================================================
@router.post(
    "/follows/{novel_id}",
    response_model=StandardResponse[FollowNovelResponse],
    summary="Follow a novel to receive new chapter notifications",
)
async def follow_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Follows a novel for release notifications."""
    stmt = select(Follow).where(
        Follow.user_id == current_user.id,
        Follow.novel_id == novel_id,
    )
    follow_entry = (await db.execute(stmt)).scalar_one_or_none()

    if not follow_entry:
        follow_entry = Follow(user_id=current_user.id, novel_id=novel_id)
        db.add(follow_entry)
        await db.commit()

    return StandardResponse(
        data=FollowNovelResponse(novel_id=novel_id, is_following=True)
    )


@router.delete(
    "/follows/{novel_id}",
    response_model=StandardResponse[FollowNovelResponse],
    summary="Unfollow a novel",
)
async def unfollow_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Unfollows a novel."""
    stmt = select(Follow).where(
        Follow.user_id == current_user.id,
        Follow.novel_id == novel_id,
    )
    follow_entry = (await db.execute(stmt)).scalar_one_or_none()
    if follow_entry:
        await db.delete(follow_entry)
        await db.commit()

    return StandardResponse(
        data=FollowNovelResponse(novel_id=novel_id, is_following=False)
    )


@router.get(
    "/novels/{slug}/user-state",
    response_model=StandardResponse[NovelUserStateOut],
    summary="Get user interaction state for a novel (follow, bookmark, history, rating)",
)
async def get_novel_user_state(
    slug: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Returns bookmark status, following state, last resume point, and rating."""
    novel_stmt = select(Novel).where(Novel.slug == slug)
    novel = (await db.execute(novel_stmt)).scalar_one_or_none()

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    if not current_user:
        return StandardResponse(
            data=NovelUserStateOut(
                is_following=False,
                bookmark_category=None,
                last_history=None,
                user_rating=None,
                user_review=None,
            )
        )

    # 1. Check Follow
    f_stmt = select(Follow).where(
        Follow.user_id == current_user.id, Follow.novel_id == novel.id
    )
    is_following = bool((await db.execute(f_stmt)).scalar_one_or_none())

    # 2. Check Bookmark
    b_stmt = select(Bookmark).where(
        Bookmark.user_id == current_user.id, Bookmark.novel_id == novel.id
    )
    bookmark = (await db.execute(b_stmt)).scalar_one_or_none()

    # 3. Check History
    h_stmt = (
        select(History)
        .where(History.user_id == current_user.id, History.novel_id == novel.id)
        .options(selectinload(History.novel), selectinload(History.chapter))
    )
    history = (await db.execute(h_stmt)).scalar_one_or_none()
    last_history: Optional[HistoryOut] = None
    if history:
        last_history = HistoryOut(
            id=history.id,
            novel_id=history.novel_id,
            chapter_id=history.chapter_id,
            last_position=history.last_position,
            updated_at=history.updated_at,
            novel_title=novel.title,
            novel_slug=novel.slug,
            cover_url=novel.cover_url,
            chapter_number=history.chapter.chapter_number if history.chapter else 1,
            chapter_title=history.chapter.title if history.chapter else "Bab",
        )

    # 4. Check Rating
    r_stmt = select(Rating).where(
        Rating.user_id == current_user.id, Rating.novel_id == novel.id
    )
    rating = (await db.execute(r_stmt)).scalar_one_or_none()

    return StandardResponse(
        data=NovelUserStateOut(
            is_following=is_following,
            bookmark_category=bookmark.category if bookmark else None,
            last_history=last_history,
            user_rating=rating.score if rating else None,
            user_review=rating.review if rating else None,
        )
    )


# ==============================================================================
# 4. Notifications
# ==============================================================================
@router.get(
    "/notifications",
    response_model=StandardResponse[NotificationListOut],
    summary="List reader notifications and unread badge count",
)
async def list_notifications(
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves reader notification bell items ordered by created_at DESC."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
    )
    notifications = (await db.execute(stmt)).scalars().all()

    unread_stmt = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    )
    unread_count = (await db.execute(unread_stmt)).scalar() or 0

    return StandardResponse(
        data=NotificationListOut(
            notifications=notifications,
            unread_count=unread_count,
        )
    )


@router.put(
    "/notifications/{id}/read",
    response_model=StandardResponse[MessageData],
    summary="Mark single notification as read",
)
async def mark_notification_read(
    id: uuid.UUID,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Marks a single notification as read."""
    stmt = select(Notification).where(
        Notification.id == id, Notification.user_id == current_user.id
    )
    notification = (await db.execute(stmt)).scalar_one_or_none()
    if notification:
        notification.is_read = True
        await db.commit()
    return StandardResponse(
        data=MessageData(message="Notifikasi ditandai sebagai telah dibaca.")
    )


@router.put(
    "/notifications/read-all",
    response_model=StandardResponse[MessageData],
    summary="Mark all user notifications as read",
)
async def mark_all_notifications_read(
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Marks all user notifications as read."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    notifications = (await db.execute(stmt)).scalars().all()
    for n in notifications:
        n.is_read = True
    await db.commit()

    return StandardResponse(
        data=MessageData(message="Semua notifikasi telah ditandai dibaca.")
    )


# ==============================================================================
# 5. Reader Profile & Avatar
# ==============================================================================
@router.put(
    "/profile",
    response_model=StandardResponse[UserOut],
    summary="Update reader display name",
)
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Updates authenticated reader's display name."""
    current_user.display_name = payload.display_name.strip()
    await db.commit()
    await db.refresh(current_user)
    return StandardResponse(data=current_user)


@router.post(
    "/profile/avatar",
    response_model=StandardResponse[AvatarUploadResponse],
    summary="Upload user avatar to covers bucket under avatars/ (max 2MB)",
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """
    Validates MIME (JPG, PNG, WebP) and max size 2MB.
    Uploads avatar into Supabase Storage 'covers' bucket under 'avatars/'.
    """
    allowed_mimes = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format avatar harus berupa JPG, PNG, atau WebP.",
        )

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file avatar maksimal 2 MB.",
        )

    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "jpg"
    path = f"avatars/{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"

    uploaded_url = storage_service.upload_file(
        bucket=BUCKET_COVERS,
        path=path,
        file_bytes=content,
        content_type=file.content_type,
    )

    current_user.avatar_url = uploaded_url
    await db.commit()

    return StandardResponse(data=AvatarUploadResponse(avatar_url=uploaded_url))


# ==============================================================================
# 6. Nested Comments & Comment Reporting
# ==============================================================================
@router.get(
    "/chapters/{id}/comments",
    response_model=StandardResponse[List[CommentOut]],
    summary="Get nested comments tree for a chapter",
)
async def get_chapter_comments(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Returns top-level comments and nested replies for a chapter."""
    stmt = (
        select(Comment)
        .where(Comment.chapter_id == id, Comment.parent_id == None)
        .options(
            selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.user),
        )
        .order_by(desc(Comment.created_at))
    )
    comments = (await db.execute(stmt)).scalars().all()
    return StandardResponse(data=comments)


@router.post(
    "/chapters/{id}/comments",
    response_model=StandardResponse[CommentOut],
    status_code=status.HTTP_201_CREATED,
    summary="Post a comment or nested reply on a chapter",
)
async def post_chapter_comment(
    id: uuid.UUID,
    payload: CommentCreateRequest,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits a comment or reply.
    Automatically generates notification ('balasan_komentar') for parent comment author.
    """
    chapter_stmt = (
        select(Chapter)
        .where(Chapter.id == id)
        .options(selectinload(Chapter.novel))
    )
    chapter = (await db.execute(chapter_stmt)).scalar_one_or_none()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter tidak ditemukan.",
        )

    parent_comment: Optional[Comment] = None
    if payload.parent_id:
        p_stmt = select(Comment).where(Comment.id == payload.parent_id)
        parent_comment = (await db.execute(p_stmt)).scalar_one_or_none()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Komentar induk tidak ditemukan.",
            )

    new_comment = Comment(
        user_id=current_user.id,
        novel_id=chapter.novel_id,
        chapter_id=id,
        parent_id=payload.parent_id,
        content=payload.content.strip(),
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment, ["user", "replies"])

    # Trigger notification for parent comment author if reply is from another user
    if parent_comment and parent_comment.user_id != current_user.id:
        notif = Notification(
            user_id=parent_comment.user_id,
            type="balasan_komentar",
            title=f"Balasan Baru dari {current_user.display_name}",
            message=f"{current_user.display_name} membalas komentar Anda pada Bab {chapter.chapter_number}: '{payload.content[:50]}...'",
            novel_id=chapter.novel_id,
            chapter_id=chapter.id,
        )
        db.add(notif)
        await db.commit()

    return StandardResponse(data=new_comment)


@router.post(
    "/comments/{id}/report",
    response_model=StandardResponse[MessageData],
    summary="Report an inappropriate comment for admin review",
)
async def report_comment(
    id: uuid.UUID,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """Flags comment as reported for administrator review."""
    stmt = select(Comment).where(Comment.id == id)
    comment = (await db.execute(stmt)).scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Komentar tidak ditemukan.",
        )

    comment.is_reported = True
    await db.commit()

    return StandardResponse(
        data=MessageData(message="Komentar telah dilaporkan untuk ditinjau oleh moderator.")
    )


# ==============================================================================
# 7. Novel Ratings & Reviews
# ==============================================================================
@router.get(
    "/novels/{slug}/ratings",
    response_model=StandardResponse[List[RatingOut]],
    summary="Get ratings and reviews list for a novel",
)
async def get_novel_ratings(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all reviews and star ratings for a novel."""
    novel_stmt = select(Novel).where(Novel.slug == slug)
    novel = (await db.execute(novel_stmt)).scalar_one_or_none()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    stmt = (
        select(Rating)
        .where(Rating.novel_id == novel.id)
        .options(selectinload(Rating.user))
        .order_by(desc(Rating.created_at))
    )
    ratings = (await db.execute(stmt)).scalars().all()
    return StandardResponse(data=ratings)


@router.post(
    "/novels/{slug}/ratings",
    response_model=StandardResponse[RatingOut],
    summary="Submit or update 1-5 star rating & review for a novel",
)
async def submit_novel_rating(
    slug: str,
    payload: RatingCreateRequest,
    current_user: User = Depends(require_pembaca),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits or updates a 1-5 star review.
    Atomically recalculates novel.rating_avg and novel.rating_count.
    """
    novel_stmt = select(Novel).where(Novel.slug == slug)
    novel = (await db.execute(novel_stmt)).scalar_one_or_none()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Novel tidak ditemukan.",
        )

    stmt = select(Rating).where(
        Rating.user_id == current_user.id, Rating.novel_id == novel.id
    ).options(selectinload(Rating.user))
    rating = (await db.execute(stmt)).scalar_one_or_none()

    if rating:
        rating.score = payload.score
        rating.review = payload.review.strip() if payload.review else None
    else:
        rating = Rating(
            user_id=current_user.id,
            novel_id=novel.id,
            score=payload.score,
            review=payload.review.strip() if payload.review else None,
        )
        db.add(rating)

    await db.commit()
    await db.refresh(rating, ["user"])

    # Atomically recalculate novel rating aggregates
    agg_stmt = select(
        func.count(Rating.id),
        func.avg(Rating.score),
    ).where(Rating.novel_id == novel.id)
    count, avg_score = (await db.execute(agg_stmt)).one()

    novel.rating_count = count or 0
    novel.rating_avg = Decimal(str(round(avg_score, 2))) if avg_score is not None else Decimal("0.00")
    await db.commit()

    return StandardResponse(data=rating)


# ==============================================================================
# 8. Public Master Genres & Tags
# ==============================================================================
@router.get(
    "/genres",
    response_model=StandardResponse[List[GenreOut]],
    summary="List all master genres for catalog filtering",
)
async def get_all_genres(db: AsyncSession = Depends(get_db)):
    """Returns list of all available genres."""
    stmt = select(Genre).order_by(Genre.name.asc())
    genres = (await db.execute(stmt)).scalars().all()
    return StandardResponse(data=genres)


@router.get(
    "/tags",
    response_model=StandardResponse[List[TagOut]],
    summary="List all master tags for catalog filtering",
)
async def get_all_tags(db: AsyncSession = Depends(get_db)):
    """Returns list of all available tags."""
    stmt = select(Tag).order_by(Tag.name.asc())
    tags = (await db.execute(stmt)).scalars().all()
    return StandardResponse(data=tags)
