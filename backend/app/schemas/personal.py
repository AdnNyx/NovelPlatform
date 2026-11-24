import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ==============================================================================
# Bookmarks Schemas
# ==============================================================================
class BookmarkCreateRequest(BaseModel):
    novel_id: uuid.UUID
    category: str = Field(..., pattern="^(sedang_dibaca|ingin_dibaca|favorit|selesai)$")


class BookmarkNovelOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    cover_url: Optional[str] = None
    status: str
    rating_avg: Decimal
    total_chapters: int
    genres: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BookmarkOut(BaseModel):
    id: uuid.UUID
    novel_id: uuid.UUID
    category: str
    created_at: datetime
    novel: BookmarkNovelOut

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Reading History Schemas
# ==============================================================================
class HistoryCreateRequest(BaseModel):
    novel_id: uuid.UUID
    chapter_id: uuid.UUID
    last_position: Decimal = Field(..., ge=0.0, le=100.0)


class HistoryOut(BaseModel):
    id: uuid.UUID
    novel_id: uuid.UUID
    chapter_id: uuid.UUID
    last_position: Decimal
    updated_at: datetime
    novel_title: str
    novel_slug: str
    cover_url: Optional[str] = None
    chapter_number: int
    chapter_title: str

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Follow & Novel User State
# ==============================================================================
class FollowNovelResponse(BaseModel):
    novel_id: uuid.UUID
    is_following: bool


class NovelUserStateOut(BaseModel):
    is_following: bool
    bookmark_category: Optional[str] = None
    last_history: Optional[HistoryOut] = None
    user_rating: Optional[int] = None
    user_review: Optional[str] = None


# ==============================================================================
# Notifications Schemas
# ==============================================================================
class NotificationOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    message: str
    is_read: bool
    novel_id: Optional[uuid.UUID] = None
    chapter_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListOut(BaseModel):
    notifications: List[NotificationOut]
    unread_count: int


# ==============================================================================
# Profile & Avatar Schemas
# ==============================================================================
class ProfileUpdateRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)


class AvatarUploadResponse(BaseModel):
    avatar_url: str
