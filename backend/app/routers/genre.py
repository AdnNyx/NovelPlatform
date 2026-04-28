import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models import Genre
from app.schemas import GenreCreate, GenreResponse

router = APIRouter()

def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

@router.post("/", response_model=GenreResponse, status_code=status.HTTP_201_CREATED)
async def create_genre(genre_in: GenreCreate, db: AsyncSession = Depends(get_db)):
    """Endpoint untuk menambahkan genre baru (Admin)."""
    slug = generate_slug(genre_in.name)
    
    # Cek apakah genre sudah ada
    result = await db.execute(select(Genre).where(Genre.slug == slug))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Genre ini sudah ada.")
        
    new_genre = Genre(name=genre_in.name, slug=slug)
    db.add(new_genre)
    await db.commit()
    await db.refresh(new_genre)
    
    return new_genre

@router.get("/", response_model=List[GenreResponse])
async def get_all_genres(db: AsyncSession = Depends(get_db)):
    """Mengambil semua daftar genre untuk filter di Frontend."""
    result = await db.execute(select(Genre).order_by(Genre.name))
    return result.scalars().all()