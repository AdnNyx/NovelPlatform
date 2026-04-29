import os
import re
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Novel, Genre, Chapter
from app.schemas import NovelCreate, NovelResponse, NovelDetailResponse
from fastapi import Query
from sqlalchemy import or_, select, func


router = APIRouter()

# Help Function
def generate_slug(title: str) -> str:
    """Mengubah 'Judul Novel Baru!' menjadi 'judul-novel-baru' untuk URL"""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

# Endpoints

@router.post("/", response_model=NovelResponse, status_code=status.HTTP_201_CREATED)
async def create_novel(novel_in: NovelCreate, db: AsyncSession = Depends(get_db)):
    """Menambahkan data novel baru ke database."""
    
    slug = generate_slug(novel_in.title)
    
    # Check Slug
    result = await db.execute(select(Novel).where(Novel.slug == slug))
    existing_novel = result.scalars().first()
    if existing_novel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Novel dengan judul ini (atau slug yang sama) sudah ada."
        )
    
    # Object SQLAlchemy
    new_novel = Novel(
        title=novel_in.title,
        slug=slug,
        author=novel_in.author,
        synopsis=novel_in.synopsis,
        cover_image_url=novel_in.cover_image_url,
        status=novel_in.status
    )
    if novel_in.genre_ids:
        genre_result = await db.execute(select(Genre).where(Genre.id.in_(novel_in.genre_ids)))
        db_genres = genre_result.scalars().all()
        new_novel.genres = list(db_genres)
    
    # Save in Database
    db.add(new_novel)
    await db.commit()
    await db.refresh(new_novel)
    
    return new_novel

@router.get("/", response_model=List[NovelResponse])
async def get_novels(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Mengambil daftar semua novel."""
    
    # Query
    result = await db.execute(select(Novel).offset(skip).limit(limit))
    novels = result.scalars().all()
    
    return novels

@router.get("/latest")
async def get_latest_novels(
    page: int = Query(1, ge=1, description="Nomor halaman aktif"),
    limit: int = Query(12, ge=1, le=50, description="Jumlah item per halaman"),
    search: str | None = Query(None, description="Kata kunci pencarian judul"),
    genre_id: int | None = Query(None, description="Filter berdasarkan ID Genre"), 
    status: str | None = Query(None, description="Filter berdasarkan Status (ongoing, dll)"), 
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil daftar novel dengan sistem Pagination, Pencarian, dan Filter Kombinasi.
    """
    query = select(Novel).options(selectinload(Novel.genres))
    
    conditions = []
    
    # Filter Text
    if search:
        conditions.append(Novel.title.ilike(f"%{search}%"))
        
    # Filter Status
    if status:
        conditions.append(Novel.status == status)

    # - Filter Genre
    if genre_id:
        conditions.append(Novel.genres.any(Genre.id == genre_id))

    if conditions:
        query = query.where(*conditions)

    count_query = select(func.count()).select_from(query.subquery())
    total_items = (await db.execute(count_query)).scalar() or 0
    total_pages = math.ceil(total_items / limit) if total_items > 0 else 1

    # Offset & Limit
    skip = (page - 1) * limit
    query = query.order_by(Novel.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    novels = result.scalars().all()

    # Response
    return {
        "data": novels,
        "meta": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "limit": limit
        }
    }

@router.get("/search", response_model=List[NovelResponse])
async def search_novels(
    q: str = Query(..., min_length=2, description="Kata kunci pencarian (minimal 2 huruf)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Mesin pencari sederhana berdasarkan Judul atau Nama Penulis.
    """
    search_pattern = f"%{q}%"
    
    result = await db.execute(
        select(Novel).where(
            or_(
                Novel.title.ilike(search_pattern),
                Novel.author.ilike(search_pattern)
            )
        )
    )
    search_results = result.scalars().all()
    
    return search_results

@router.get("/stats/summary")
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    novel_count = await db.execute(select(func.count(Novel.id)))
    chapter_count = await db.execute(select(func.count(Chapter.id)))
    genre_count = await db.execute(select(func.count(Genre.id)))

    return {
        "total_novels": novel_count.scalar() or 0,
        "total_chapters": chapter_count.scalar() or 0,
        "total_genres": genre_count.scalar() or 0
    }

@router.get("/{slug}", response_model=NovelDetailResponse)
async def get_novel_detail(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Mengambil detail satu novel berdasarkan SLUG, lengkap dengan daftar genre dan chapternya.
    Sangat optimal untuk halaman 'Table of Contents' (Daftar Isi) di Next.js.
    """
    result = await db.execute(
        select(Novel)
        .options(selectinload(Novel.genres), selectinload(Novel.chapters))
        .where(Novel.slug == slug)
    )
    novel = result.scalars().first()
    
    if not novel:
        raise HTTPException(status_code=404, detail="Novel tidak ditemukan.")
        
    return novel

@router.patch("/{novel_id}/cover", response_model=NovelResponse)
async def upload_novel_cover(
    novel_id: str,
    file: UploadFile = File(..., description="File gambar cover (JPG/PNG/WEBP)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint untuk mengunggah dan memperbarui gambar cover novel.
    """
    try:
        valid_id = uuid.UUID(novel_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format novel_id tidak valid (harus UUID)")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar (JPG, PNG, dll).")
        
    result = await db.execute(
        select(Novel).options(selectinload(Novel.genres)).where(Novel.id == valid_id)
    )
    novel = result.scalars().first()
    
    if not novel:
        raise HTTPException(status_code=404, detail="Novel tidak ditemukan.")
        
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join("static", "covers", filename)
    
    file_bytes = await file.read()
    with open(filepath, "wb") as f:
        f.write(file_bytes)
        
    # Perbarui URL di database
    base_url = "http://localhost:8000"
    novel.cover_image_url = f"{base_url}/static/covers/{filename}"
    novel.updated_at = datetime.now(timezone.utc)
    
    db.add(novel)
    await db.commit()
    await db.refresh(novel)
    
    return novel
