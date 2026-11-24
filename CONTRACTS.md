# CONTRACTS.md — Payload Schemas, Sanitizer Allowlist & Auth Transport Rules

> **INTEGRATION DIRECTIVE:**
> Follow these exact payload conventions and security configurations so `frontend/` and `backend/` integrate seamlessly without field-name mismatches, broken TipTap formatting, or dropped authentication cookies.

---

## 1. JSON Naming & Serialization Convention

- **Strict `snake_case` Everywhere:** All FastAPI Pydantic response schemas and Next.js TypeScript interfaces (`frontend/src/types/index.ts`) **MUST** use `snake_case` field names matching the PostgreSQL column names in `AGENTS.md` (e.g., `cover_url`, `display_name`, `author_id`, `chapter_number`, `content_html`, `last_position`, `is_published`).
- **Standard API Envelope:**
  - **Success:**
    ```json
    {
      "status": "success",
      "data": { ... },
      "meta": { "page": 1, "limit": 20, "total": 145 }
    }
    ```
  - **Error (FastAPI `HTTPException`):**
    ```json
    {
      "detail": "Human-readable error message explaining the failure"
    }
    ```

---

## 2. Backend HTML Sanitizer Allowlist (`backend/app/services/sanitizer.py`)

Because Novelis authors use TipTap formatting (headings, alignment, lists, blockquotes, horizontal rules, links, inline images) and PDF-to-HTML conversion, standard sanitizer defaults will break alignment and images if configured too strictly.

Configure `nh3` (or `bleach`) with this exact allowlist:

- **Allowed Tags:**
  `p`, `br`, `h1`, `h2`, `h3`, `strong`, `b`, `em`, `i`, `u`, `s`, `strike`, `ul`, `ol`, `li`, `blockquote`, `hr`, `a`, `img`, `span`
- **Allowed Attributes per Tag:**
  - `p`, `h1`, `h2`, `h3`: `style` (strictly restricted to `text-align: left`, `text-align: center`, `text-align: right`, `text-align: justify`)
  - `a`: `href`, `target`, `rel` (enforce `rel="noopener noreferrer"`, allow `http://` and `https://` schemes only)
  - `img`: `src`, `alt`, `title`, `width`, `height` (allow `https://` URLs pointing to Supabase Storage `chapter-images` bucket)
- **Explicitly Blocked:** `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<style>`, and all inline event handlers (`onload`, `onerror`, `onclick`).

---

## 3. Cross-Origin Cookie & CORS Configuration

During local development (`http://localhost:3000` -> `http://localhost:8000`) and production, authentication relies on `HttpOnly` cookies rather than `localStorage` tokens:

1. **FastAPI CORS Middleware (`backend/app/main.py`):**
   - `allow_origins=[settings.FRONTEND_URL]` (never use `["*"]` when credentials are enabled).
   - `allow_credentials=True`
   - `allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]`
   - `allow_headers=["Content-Type", "Authorization"]`
2. **Cookie Flags set by `/api/auth/*`:**
   - `httponly=True`
   - `samesite="lax"`
   - `secure=settings.IS_PRODUCTION` (`False` on `http://localhost`, `True` on `https://`)
   - `path="/"`
3. **Next.js API Client (`frontend/src/lib/api-client.ts`):**
   - Every `fetch` request **MUST** include `credentials: "include"`.
   - If a Staff request receives `HTTP 401`, the client should automatically attempt one silent refresh via `POST /api/auth/staff/refresh` before redirecting to `/staff/login`.

---

## 4. File Upload Validation Rules (Backend)

Enforce MIME-type (magic bytes / header) and file-size validation on all multipart upload endpoints before forwarding files to Supabase Storage:

| Endpoint | Target Bucket | Allowed Formats | Max Size |
| :--- | :--- | :--- | :--- |
| `POST /api/novels` (cover) & `PUT /api/novels/{id}` | `covers` | `image/jpeg`, `image/png`, `image/webp` | `5 MB` |
| `POST /api/profile/avatar` | `covers` (under `/avatars/`) | `image/jpeg`, `image/png`, `image/webp` | `2 MB` |
| `POST /api/chapters/upload-image` | `chapter-images` | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | `5 MB` |
| `POST /api/chapters/upload-pdf` | `pdfs` (temporary) | `application/pdf` | `25 MB` |

---

## 5. PDF Conversion Job Polling Contract

- **`POST /api/chapters/upload-pdf` Response (`HTTP 202 Accepted`):**
  ```json
  {
    "status": "success",
    "data": {
      "job_id": "uuid-string",
      "job_status": "processing"
    }
  }
  ```

- **`GET /api/chapters/pdf-jobs/{job_id}` Response (`HTTP 200 OK`):**
  - **While running:**
    ```json
    {
      "status": "success",
      "data": {
        "job_id": "uuid-string",
        "job_status": "processing"
      }
    }
    ```
  - **When finished:**
    ```json
    {
      "status": "success",
      "data": {
        "job_id": "uuid-string",
        "job_status": "completed",
        "chapters": [
          {
            "suggested_title": "Bab 1: Awal Perjalanan",
            "content_html": "<h1>Bab 1: Awal Perjalanan</h1><p>...</p>"
          }
        ]
      }
    }
    ```
  - **On failure:**
    ```json
    {
      "status": "error",
      "data": {
        "job_id": "uuid-string",
        "job_status": "failed",
        "error": "Reason"
      }
    }
    ```