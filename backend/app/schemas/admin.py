import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.interaction import InteractionUserOut


class AdminStatsOut(BaseModel):
    total_users: int
    total_novels: int
    total_chapters: int
    reported_comments: int


class AdminCreateStaffRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    display_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    role: str = Field("novelis", pattern="^(novelis|admin)$")


class AdminUpdateRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(pembaca|novelis|admin)$")


class AdminBanUserRequest(BaseModel):
    is_active: bool


class AdminApproveNovelRequest(BaseModel):
    is_approved: bool


class AdminCommentOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    novel_id: uuid.UUID
    chapter_id: uuid.UUID
    content: str
    is_reported: bool
    created_at: datetime
    user: InteractionUserOut

    model_config = ConfigDict(from_attributes=True)
