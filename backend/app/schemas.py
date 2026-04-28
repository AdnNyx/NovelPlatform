from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

# ENUMS
class NovelStatusEnum(str, Enum):
    ongoing = "ongoing"
    completed = "completed"
    hiatus = "hiatus"

# GENRE SCHEMAS
class GenreBase(BaseModel):
    name: str

class GenreCreate(GenreBase):
    pass

class GenreResponse(GenreBase):
    id: int
    slug: str

    model_config = ConfigDict(from_attributes=True)

# CHAPTER SCHEMAS
class ChapterBase(BaseModel):
    chapter_number: float
    title: Optional[str] = None

class ChapterResponse(ChapterBase):
    id: UUID
    novel_id: UUID
    content: str
    published_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChapterReadResponse(BaseModel):
    id: UUID
    novel_title: str
    novel_slug: str
    chapter_number: float
    title: Optional[str] = None
    content: str
    published_at: datetime
    
    # Navigasi (Float karena chapter bisa berupa 1.5)
    prev_chapter: Optional[float] = None
    next_chapter: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

# NOVEL SCHEMAS
class NovelBase(BaseModel):
    title: str
    author: Optional[str] = None
    synopsis: Optional[str] = None
    cover_image_url: Optional[str] = None
    status: NovelStatusEnum = NovelStatusEnum.ongoing

class NovelCreate(NovelBase):
    # Skema ini digunakan saat Admin membuat novel baru (POST request).
    # Nanti kita bisa tambahkan validasi ekstra di sini jika perlu.
    genre_ids: List[int] = []

class NovelResponse(NovelBase):
    id: UUID
    slug: str
    created_at: datetime
    updated_at: datetime
    genres: List[GenreResponse] = []

    model_config = ConfigDict(from_attributes=True)

class NovelDetailResponse(NovelResponse):
    chapters: List[ChapterResponse] = []

    model_config = ConfigDict(from_attributes=True)