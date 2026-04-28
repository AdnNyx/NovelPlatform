import fitz
import os
import uuid
import re

BASE_URL = "http://localhost:8000"

def extract_html_from_pdf(pdf_bytes: bytes) -> str:
    """
    Mengekstrak teks DAN ilustrasi gambar dari file PDF mentah.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    chapter_html = ""

    img_dir = "static/illustrations"
    os.makedirs(img_dir, exist_ok=True)

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        page_height = page.rect.height
        
        blocks = page.get_text("dict")["blocks"]
        
        for b in blocks:
            # BLOK TEKS (type == 0)
            if b.get("type") == 0:
                bbox = b["bbox"]
                y0 = bbox[1] 
                y1 = bbox[3] 
                
                if y0 < (page_height * 0.08) or y1 > (page_height * 0.92):
                    continue
                
                block_text = ""
                for line in b["lines"]:
                    for span in line["spans"]:
                        block_text += span["text"] + " "
                
                clean_text = " ".join(block_text.split())
                
                if not clean_text:
                    continue
                
                # 1. Regex SUPER LENGKAP (Mendukung English & Bahasa Indonesia)
                # Mendeteksi: Chapter 1, Bab 1, Prologue, Prolog, Epilogue, Epilog, Daftar Isi
                heading_pattern = r'^(volume\s*\d*\s*[-:]?\s*)?(chapter\s*\d+|bab\s*\d+|prologue|prolog|epilogue|epilog|table of contents|daftar isi|afterword)'
                is_heading = re.search(heading_pattern, clean_text, re.IGNORECASE)
                
                # 2. Logika Pembungkusan Teks
                # Batas karakter dinaikkan jadi 150 untuk menoleransi judul chapter yang panjang
                if is_heading and len(clean_text) < 150:
                    chapter_html += f"<h2>{clean_text}</h2>\n"
                else:
                    # Trik Cerdas: Jika teksnya adalah Daftar Isi yang tergabung/menempel panjang
                    if "table of contents" in clean_text.lower() or "daftar isi" in clean_text.lower() or len(clean_text) > 300:
                        # Kita sisipkan <br> ganda dan warna agar setiap Chapter pindah ke baris baru!
                        clean_text = re.sub(
                            r'(Chapter\s*\d+|Bab\s*\d+|Prologue|Prolog|Epilogue|Epilog)', 
                            r'<br/><br/><strong class="text-indigo-600">\1</strong>', 
                            clean_text, 
                            flags=re.IGNORECASE
                        )
                    
                    chapter_html += f"<p>{clean_text}</p>\n"
            # Block Image (type == 1)
            elif b.get("type") == 1:
                image_bytes = b.get("image")
                image_ext = b.get("ext", "png")
                
                if image_bytes:
                    # 1. Buat nama file yang 100% unik agar tidak bentrok antar chapter
                    image_filename = f"{uuid.uuid4().hex}.{image_ext}"
                    image_path = os.path.join(img_dir, image_filename)
                    
                    # 2. Tulis file gambar ke dalam disk local
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                        
                    # 3. Sisipkan tag gambar ke dalam aliran teks HTML!
                    # Kita bungkus dengan tag <div> dan class CSS agar saat di Next.js
                    # Anda bisa menengahkan gambar (justify-center) dengan mudah.
                    image_url = f"{BASE_URL}/static/illustrations/{image_filename}"
                    
                    img_html = (
                        f'\n<div class="illustration-wrapper my-8 flex justify-center">'
                        f'<img src="{image_url}" alt="Ilustrasi Chapter" class="max-w-full h-auto rounded-md shadow-md" loading="lazy" />'
                        f'</div>\n'
                    )
                    chapter_html += img_html
                    
    doc.close()
    return chapter_html