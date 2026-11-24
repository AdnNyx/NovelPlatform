import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class InteractionUserOut(BaseModel):
    id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None
    role: str

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Comments Schemas
# ==============================================================================
class CommentCreateRequest(BaseModel):
    novel_id: uuid.UUID
    chapter_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    content: str = Field(..., min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: uuid.UUID
    novel_id: uuid.UUID
    chapter_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    content: str
    is_reported: bool
    created_at: datetime
    user: InteractionUserOut
    replies: List["CommentOut"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Ratings Schemas
# ==============================================================================
class RatingCreateRequest(BaseModel):
    score: int = Field(..., ge=1, le=5)
    review: Optional[str] = Field(None, max_length=2000)


class RatingOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    novel_id: uuid.UUID
    score: int
    review: Optional[str] = None
    created_at: datetime
    user: InteractionUserOut

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Master Genres & Tags Schemas
# ==============================================================================
class GenreOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class GenreCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)


class TagOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class TagCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
