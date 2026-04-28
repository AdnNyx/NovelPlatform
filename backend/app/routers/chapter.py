from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import uuid
from app.database import get_db
from app.models import Novel, Chapter
from app.schemas import ChapterResponse, ChapterReadResponse
from app.services.pdf_parser import extract_html_from_pdf

from datetime import datetime, timezone

router = APIRouter()

@router.post("/upload", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def upload_chapter_pdf(
    # Terima novel_id sebagai string murni terlebih dahulu untuk menghindari error Pydantic
    novel_id: str = Form(..., description="ID dari Novel yang sudah dibuat"),
    chapter_number: float = Form(..., description="Nomor chapter (misal: 1, 2, atau 1.5)"),
    title: Optional[str] = Form(None, description="Judul spesifik chapter (opsional)"),
    # PASTIKAN di bawah ini menggunakan File(...), bukan Form(...)
    file: UploadFile = File(..., description="File PDF Light Novel"),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint untuk mengunggah file PDF, mengekstrak teksnya secara otomatis,
    dan menyimpannya sebagai chapter baru ke dalam database.
    """
    
    # 1. Validasi manual UUID
    try:
        valid_novel_id = uuid.UUID(novel_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format novel_id tidak valid (harus UUID)")

    # 2. Validasi tipe file
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File harus berupa PDF.")
        
    # 3. Pastikan novel dengan ID tersebut memang ada di database
    result = await db.execute(select(Novel).where(Novel.id == valid_novel_id))
    novel = result.scalars().first()
    if not novel:
        raise HTTPException(status_code=404, detail="Novel tidak ditemukan.")
        
    try:
        # 4. Baca file ke dalam memori (RAM)
        pdf_bytes = await file.read()
        
        # 5. Ekstrak teks
        extracted_html = extract_html_from_pdf(pdf_bytes)
        
        if not extracted_html.strip():
            raise HTTPException(status_code=400, detail="Gagal mengekstrak teks atau PDF kosong.")
            
        # 6. Simpan ke database
        new_chapter = Chapter(
            novel_id=valid_novel_id,
            chapter_number=chapter_number,
            title=title,
            content=extracted_html
        )
        
        db.add(new_chapter)
        novel.updated_at = datetime.now(timezone.utc)
        db.add(novel)
        await db.commit()
        await db.refresh(new_chapter)
        
        return new_chapter
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal: {str(e)}")

@router.get("/{novel_slug}/{chapter_number}", response_model=ChapterReadResponse)
async def read_chapter(novel_slug: str, chapter_number: float, db: AsyncSession = Depends(get_db)):
    """
    Mengambil isi teks chapter untuk dibaca, beserta kalkulasi tombol Next/Prev.
    """
    # 1. Cari novel berdasarkan slug
    novel_result = await db.execute(select(Novel).where(Novel.slug == novel_slug))
    novel = novel_result.scalars().first()
    
    if not novel:
        raise HTTPException(status_code=404, detail="Novel tidak ditemukan.")

    # 2. Ambil seluruh daftar chapter dari novel ini dan urutkan
    chapters_result = await db.execute(
        select(Chapter)
        .where(Chapter.novel_id == novel.id)
        .order_by(Chapter.chapter_number.asc())
    )
    chapters = chapters_result.scalars().all()
    
    if not chapters:
        raise HTTPException(status_code=404, detail="Belum ada chapter untuk novel ini.")

    # 3. Cari chapter yang sedang di-request beserta posisinya (index)
    current_index = -1
    for i, ch in enumerate(chapters):
        if ch.chapter_number == chapter_number:
            current_index = i
            break
            
    if current_index == -1:
        raise HTTPException(status_code=404, detail="Chapter tidak ditemukan.")

    current_chapter = chapters[current_index]

    # 4. Kalkulasi tombol Prev dan Next
    prev_ch = chapters[current_index - 1].chapter_number if current_index > 0 else None
    next_ch = chapters[current_index + 1].chapter_number if current_index < len(chapters) - 1 else None

    # 5. Susun Response
    return ChapterReadResponse(
        id=current_chapter.id,
        novel_title=novel.title,
        novel_slug=novel.slug,
        chapter_number=current_chapter.chapter_number,
        title=current_chapter.title,
        content=current_chapter.content,
        published_at=current_chapter.published_at,
        prev_chapter=prev_ch,
        next_chapter=next_ch
    )

@router.delete("/{chapter_id}")
async def delete_chapter(
    chapter_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint untuk menghapus sebuah chapter beserta isinya dari database.
    """
    # 1. Validasi format ID
    try:
        valid_id = uuid.UUID(chapter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format chapter_id tidak valid (harus UUID)")
        
    # 2. Cari chapter di database
    result = await db.execute(select(Chapter).where(Chapter.id == valid_id))
    chapter = result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter tidak ditemukan.")
        
    # 3. Hapus chapter dari database
    await db.delete(chapter)
    await db.commit()
    
    return {
        "message": "Chapter berhasil dihapus.",
        "deleted_chapter_number": chapter.chapter_number
    }