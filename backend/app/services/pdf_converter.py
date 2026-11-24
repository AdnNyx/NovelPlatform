import io
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
import fitz  # PyMuPDF

from app.core.storage import storage_service, BUCKET_CHAPTER_IMAGES, BUCKET_PDFS
from app.services.sanitizer import sanitize_html

logger = logging.getLogger("pdf_converter")

# In-memory thread-safe status registry for PDF conversion jobs
# job_id -> {"job_status": "processing" | "completed" | "failed", "chapters": [...], "error": "..."}
PDF_JOBS: Dict[str, Dict[str, Any]] = {}


def create_pdf_job() -> str:
    """Initializes a new job entry and returns its unique job_id."""
    job_id = str(uuid.uuid4())
    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "job_status": "processing",
        "chapters": [],
        "error": None,
    }
    return job_id


def get_pdf_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves current status and payload of a PDF conversion job."""
    return PDF_JOBS.get(job_id)


def _detect_image_mime(ext: str) -> str:
    ext = ext.lower().replace(".", "")
    if ext in ("jpg", "jpeg"):
        return "image/jpeg"
    elif ext == "png":
        return "image/png"
    elif ext == "webp":
        return "image/webp"
    return "image/jpeg"


async def process_pdf_conversion(job_id: str, pdf_storage_path: str) -> None:
    """
    Background worker that extracts text and embedded images from a PDF file.
    Always cleans up the temporary PDF in the 'pdfs' bucket in a finally block.
    """
    try:
        logger.info(f"Starting PDF conversion for job {job_id} at {pdf_storage_path}")
        # 1. Download PDF bytes from Supabase Storage private bucket
        pdf_bytes = storage_service.download_file(BUCKET_PDFS, pdf_storage_path)

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        chapters: List[Dict[str, str]] = []

        current_chapter_title: str = "Bab 1: Awal Perjalanan"
        current_html_blocks: List[str] = []

        # Heuristic regex to identify new chapters (e.g., 'Bab 1', 'Chapter 2', 'Bagian 3')
        chapter_heading_pattern = re.compile(
            r"^(bab\s+\d+|chapter\s+\d+|bagian\s+\d+|prolog|epilog)", re.IGNORECASE
        )

        for page_num in range(len(doc)):
            page = doc[page_num]

            # 2. Extract embedded images on this page
            image_list = page.get_images(full=True)
            page_image_tags: List[str] = []
            for img_info in image_list:
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                mime_type = _detect_image_mime(image_ext)

                image_filename = f"extracted/{uuid.uuid4()}.{image_ext}"
                try:
                    uploaded_url = storage_service.upload_file(
                        bucket=BUCKET_CHAPTER_IMAGES,
                        path=image_filename,
                        file_bytes=image_bytes,
                        content_type=mime_type,
                    )
                    page_image_tags.append(
                        f'<p style="text-align: center;"><img src="{uploaded_url}" alt="Ilustrasi Bab" /></p>'
                    )
                except Exception as img_err:
                    logger.warning(f"Failed to upload extracted image: {img_err}")

            # 3. Extract text blocks and apply font size heuristics
            text_page = page.get_text("dict")
            blocks = text_page.get("blocks", [])

            for b in blocks:
                # Text block
                if b.get("type") == 0:
                    for line in b.get("lines", []):
                        spans = line.get("spans", [])
                        if not spans:
                            continue
                        line_text = "".join([s.get("text", "") for s in spans]).strip()
                        if not line_text:
                            continue

                        # Check average font size in this line
                        avg_size = sum([s.get("size", 12) for s in spans]) / len(spans)
                        flags = spans[0].get("flags", 0)
                        is_bold = bool(flags & 2)

                        # Check if line matches a new chapter heading
                        if chapter_heading_pattern.match(line_text) or (avg_size >= 18 and is_bold):
                            # If we already have content in current chapter, save it as a chapter
                            if current_html_blocks:
                                raw_chapter_html = "".join(current_html_blocks)
                                chapters.append({
                                    "suggested_title": current_chapter_title,
                                    "content_html": sanitize_html(raw_chapter_html),
                                })
                                current_html_blocks = []
                            current_chapter_title = line_text
                            current_html_blocks.append(f"<h1>{line_text}</h1>")
                        elif avg_size >= 14:
                            current_html_blocks.append(f"<h2>{line_text}</h2>")
                        else:
                            current_html_blocks.append(f"<p>{line_text}</p>")

            # Append images extracted from this page
            if page_image_tags:
                current_html_blocks.extend(page_image_tags)

        # Append final pending chapter
        if current_html_blocks:
            raw_chapter_html = "".join(current_html_blocks)
            chapters.append({
                "suggested_title": current_chapter_title,
                "content_html": sanitize_html(raw_chapter_html),
            })

        # Fallback if empty
        if not chapters:
            chapters.append({
                "suggested_title": "Bab 1: Transkripsi",
                "content_html": "<p>Tidak ada teks yang dapat diekstraksi dari dokumen PDF.</p>",
            })

        PDF_JOBS[job_id] = {
            "job_id": job_id,
            "job_status": "completed",
            "chapters": chapters,
            "error": None,
        }
        logger.info(f"PDF conversion completed successfully for job {job_id} ({len(chapters)} chapter(s) generated)")

    except Exception as exc:
        logger.error(f"PDF conversion failed for job {job_id}: {exc}", exc_info=True)
        PDF_JOBS[job_id] = {
            "job_id": job_id,
            "job_status": "failed",
            "chapters": [],
            "error": str(exc),
        }
    finally:
        # Mandatory cleanup: remove temporary PDF from private bucket
        try:
            storage_service.delete_file(BUCKET_PDFS, pdf_storage_path)
            logger.info(f"Temporary PDF {pdf_storage_path} successfully deleted from bucket '{BUCKET_PDFS}'")
        except Exception as del_err:
            logger.warning(f"Failed to delete temp PDF {pdf_storage_path}: {del_err}")
