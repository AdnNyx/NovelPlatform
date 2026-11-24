import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChapterCreateRequest(BaseModel):
    novel_id: uuid.UUID
    chapter_number: int = Field(..., ge=1)
    title: str = Field(..., min_length=1, max_length=255)
    content_html: str = Field(..., min_length=1)
    is_draft: bool = False
    is_published: bool = True
    published_at: Optional[datetime] = None


class ChapterUpdateRequest(BaseModel):
    chapter_number: Optional[int] = Field(None, ge=1)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content_html: Optional[str] = Field(None, min_length=1)
    is_draft: Optional[bool] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None


class ChapterListItem(BaseModel):
    id: uuid.UUID
    novel_id: uuid.UUID
    chapter_number: int
    title: str
    is_draft: bool
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChapterDetailOut(BaseModel):
    id: uuid.UUID
    novel_id: uuid.UUID
    novel_title: str
    novel_slug: str
    chapter_number: int
    title: str
    content_html: str
    is_draft: bool
    is_published: bool
    published_at: Optional[datetime] = None
    prev_chapter_id: Optional[uuid.UUID] = None
    next_chapter_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ImageUploadResponseData(BaseModel):
    url: str


class PdfUploadAcceptedData(BaseModel):
    job_id: str
    job_status: str


class ExtractedChapter(BaseModel):
    suggested_title: str
    content_html: str


class PdfJobPollData(BaseModel):
    job_id: str
    job_status: str
    chapters: Optional[List[ExtractedChapter]] = None
    error: Optional[str] = None
