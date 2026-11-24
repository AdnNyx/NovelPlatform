import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NovelAuthorOut(BaseModel):
    id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NovelCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    synopsis: str = Field(..., min_length=10)
    genres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    status: str = Field("ongoing", pattern="^(ongoing|tamat)$")


class NovelUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    synopsis: Optional[str] = Field(None, min_length=10)
    genres: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = Field(None, pattern="^(ongoing|tamat)$")
    cover_url: Optional[str] = None


class NovelOut(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    author: Optional[NovelAuthorOut] = None
    title: str
    slug: str
    cover_url: Optional[str] = None
    synopsis: str
    genres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    status: str
    is_approved: bool
    total_views: int
    total_chapters: int
    rating_avg: Decimal
    rating_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NovelisDashboardStats(BaseModel):
    total_views: int
    total_novels: int
    total_chapters: int
    total_bookmarks: int


class NovelisDashboardData(BaseModel):
    stats: NovelisDashboardStats
    novels: List[NovelOut]
