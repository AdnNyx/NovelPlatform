# app/models.py
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, DateTime, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base 

# ENUMS
class RoleEnum(enum.Enum):
    admin = "admin"
    reader = "reader"

class NovelStatusEnum(enum.Enum):
    ongoing = "ongoing"
    completed = "completed"
    hiatus = "hiatus"

# ASSOCIATION TABLE (Many-to-Many: Novels <-> Genres)
novel_genres = Table(
    "novel_genres",
    Base.metadata,
    Column("novel_id", UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", Integer, ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True)
)

# MODELS
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.reader, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)

    # Relasi balik ke novel
    novels = relationship("Novel", secondary=novel_genres, back_populates="genres")

class Novel(Base):
    __tablename__ = "novels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    author = Column(String(255))
    synopsis = Column(Text)
    cover_image_url = Column(String(500))
    status = Column(Enum(NovelStatusEnum), default=NovelStatusEnum.ongoing)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relasi
    genres = relationship("Genre", secondary=novel_genres, back_populates="novels", lazy="selectin")
    chapters = relationship("Chapter", back_populates="novel", cascade="all, delete-orphan", order_by="Chapter.chapter_number")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    novel_id = Column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), index=True, nullable=False)
    chapter_number = Column(Float, nullable=False)
    title = Column(String(255))
    content = Column(Text, nullable=False) # Menyimpan HTML hasil parse
    original_pdf_url = Column(String(500), nullable=True)
    published_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relasi balik
    novel = relationship("Novel", back_populates="chapters")

class ReadingProgress(Base):
    __tablename__ = "reading_progress"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    novel_id = Column(UUID(as_uuid=True), ForeignKey("novels.id", ondelete="CASCADE"), primary_key=True)
    last_read_chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    scroll_percentage = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))