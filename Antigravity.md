# Antigravity.md — Execution & Anti-Drift Protocol (Gemini 3.8 Flash)

> **OPERATIONAL ROLE & CONTEXT:**
> You are operating as an **Autonomous Software Engineering Agent** inside the **Antigravity** workspace powered by **Gemini 3.8 Flash**.
> This document governs your **execution discipline, workflow mechanics, and verification gates**. For all system specifications, database schemas, RBAC matrices, and API contracts, refer strictly to **`AGENTS.md`** in the project root directory.
>
> **DOMAIN IDENTIFIER PRESERVATION:** While operational instructions are written in English for maximum model precision, you **MUST** preserve all exact database enum values, table/column names, route slugs, and Indonesian UI labels specified in `AGENTS.md` (e.g., `'pembaca'`, `'novelis'`, `'admin'`, `'chapter_baru'`, `'Terang'`, `'Gelap'`, `'Sepia'`, `/novel/[slug]/chapter/[id]`).

---

## 1. Core Execution Rules (Zero-Shortcut Policy)

Because of high model execution speed, you are **STRICTLY PROHIBITED** from skipping phases or writing hollow boilerplate. Enforce this mandatory execution loop on every task:

1. **Read `AGENTS.md` Before Acting:**
   - Before creating or modifying any file, ensure all architectural rules and contracts in `AGENTS.md` are loaded into your active context.
2. **Plan-First Artifact (Plan Before Code):**
   - At the start of each phase, outline a concise file-level execution plan listing files to create/modify and required dependencies. Begin writing code only after verifying alignment with the repository conventions.
3. **Zero Placeholders or Stubs:**
   - **STRICTLY PROHIBITED:** Writing `# TODO: implement logic here`, `// coming soon`, `pass`, or returning hardcoded mock data in any backend route or frontend component. Every function you write must be production-complete according to specification.
4. **One Completed Phase = One Verification Gate:**
   - You **MUST NOT** move to Frontend (`frontend/`) tasks until all Backend (`backend/`) endpoints and SQL migrations (`supabase/`) for the corresponding phase are implemented and pass syntax/import verification.
5. **Cross-Session State Sync via `PROGRESS.md`:**
   - Create and maintain `PROGRESS.md` in the project root. Mark each sub-task as completed (`[x]`) immediately after finishing it so cross-session context in Antigravity is never lost or duplicated.

---

## 2. Anti-Drift Guardrails

AI models frequently default to standard patterns that violate this project's architecture. If you detect any of the following conditions in your plan or generated code, **HALT AND REMEDIATE IMMEDIATELY**:

| No | Drift Trap | Absolute Correction Rule |
| :--- | :--- | :--- |
| **1** | Installing `@supabase/supabase-js` or calling `supabase.from(...)` in `frontend/` | **PROHIBITED.** Next.js frontend **MUST** communicate exclusively with the Python FastAPI REST API (`NEXT_PUBLIC_API_URL`) via an internal `fetch` wrapper. |
| **2** | Enabling Row Level Security (RLS) in Supabase SQL migrations | **PROHIBITED.** Ensure RLS is explicitly disabled on all tables; authorization is handled 100% by FastAPI using `SUPABASE_SERVICE_ROLE_KEY`. |
| **3** | Mounting Lenis or GSAP in root `app/layout.tsx` | **PROHIBITED.** Lenis + GSAP **MUST** exist solely inside `frontend/src/app/(public)/layout.tsx`. Route groups `(reader)` and `(staff)` must remain completely free of both libraries. |
| **4** | Placing `/staff/login` links in the public Navbar, Footer, or Sitemap | **PROHIBITED.** Routes `/staff/login` and `/staff/verify-otp` must remain hidden from all public navigation elements. |
| **5** | Building email+password registration for Readers, or Google OAuth for Staff | **PROHIBITED.** Readers (`pembaca`) = Google OAuth (`id_token`) only. Staff (`novelis`/`admin`) = Username/Email + Password + 6-digit Email OTP. |
| **6** | Running PDF-to-HTML conversion synchronously inside a request handler | **PROHIBITED.** Use FastAPI `BackgroundTasks` + PyMuPDF (`fitz`): store temporarily in `pdfs` bucket, extract images to `chapter-images`, delete temporary PDF, and expose a job-polling endpoint. |
| **7** | Persisting raw TipTap or PDF-extracted HTML directly to PostgreSQL | **PROHIBITED.** All `content_html` payloads **MUST** be sanitized on the backend using `nh3` or `bleach` before `INSERT`/`UPDATE`. |

---

## 3. Directory Structure & Environment Conventions

Follow this canonical folder hierarchy to prevent naming collisions or structural drift across sessions:

```text
/
├── AGENTS.md                        # Canonical architecture & API contracts
├── Antigravity.md                   # Agent execution & verification protocol
├── PROGRESS.md                      # Phase-by-phase completion tracker
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # DDL for all 12 tables + constraints + RLS disabled
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py                  # FastAPI entrypoint, CORS middleware, router registration
│       ├── core/
│       │   ├── config.py            # Pydantic BaseSettings (.env loader)
│       │   ├── database.py          # Async SQLAlchemy / AsyncPG connection pool
│       │   ├── storage.py           # Supabase Storage client (covers, pdfs, chapter-images)
│       │   └── security.py          # JWT, Argon2/Bcrypt, OTP hashing, Google OAuth verifier
│       ├── api/
│       │   ├── deps.py              # RBAC dependencies (optional_user, pembaca, novelis, admin)
│       │   └── routes/
│       │       ├── auth.py          # Google OAuth & Staff Login + 2FA Email OTP
│       │       ├── novels.py        # Public catalog, novel detail, ratings, novelis CRUD
│       │       ├── chapters.py      # Chapter reader, comments, chapter CRUD, PDF upload & job status
│       │       ├── personal.py      # Bookmarks, histories, follows, notifications, profile
│       │       └── admin.py         # User management, roles, bans, novel approval, genres/tags, moderation
│       ├── services/
│       │   ├── pdf_converter.py     # PyMuPDF parser -> clean HTML + embedded image extractor
│       │   ├── email_service.py     # SMTP dispatcher for 6-digit OTP codes
│       │   └── sanitizer.py         # Server-side HTML sanitizer (nh3/bleach)
│       └── schemas/                 # Pydantic request/response models per domain
└── frontend/
    ├── .env.example
    ├── package.json
    └── src/
        ├── app/
        │   ├── layout.tsx           # Clean root layout (global fonts & metadata ONLY, NO Lenis)
        │   ├── (public)/            # Public layout with Navbar, Footer, Lenis + GSAP
        │   ├── (reader)/            # Distraction-free reading layout (NO Lenis & NO GSAP)
        │   └── (staff)/             # Internal staff portal layout (NO Lenis & NO GSAP)
        ├── components/
        │   ├── public/              # Hero, NovelCard, FilterBar, RankingTabs, Navbar, Footer
        │   ├── reader/              # ReaderControls, ChapterContent, ScrollTracker, CommentTree
        │   ├── editor/              # TipTapEditor, PdfUploadModal, ChapterPreviewModal
        │   └── staff/               # SidebarStaff, NovelForm, UserTable, ModerationTable
        ├── lib/
        │   └── api-client.ts        # Single HTTP client wrapper for FastAPI (credentials: 'include')
        └── types/
            └── index.ts             # TypeScript interfaces matching FastAPI schemas
```

### Environment Configuration Rules (`.env`)
- Always provide complete `.env.example` templates in both `backend/` and `frontend/`.
- **NEVER** overwrite or delete existing `.env` files populated by the user.
- Default local service ports:
  - **Backend FastAPI:** `http://localhost:8000`
  - **Frontend Next.js:** `http://localhost:3000`

---

## 4. Mandatory Phase Gatekeepers

You are **NOT permitted** to mark a phase as complete until every verification criterion below passes:

### Phase 1: Database & Project Scaffolding
- [ ] `supabase/migrations/001_initial_schema.sql` defines all 12 tables (`users`, `genres`, `tags`, `novels`, `chapters`, `bookmarks`, `histories`, `follows`, `notifications`, `comments`, `ratings`, `otp_codes`) with exact constraints from `AGENTS.md` and RLS disabled.
- [ ] `backend/requirements.txt` and `frontend/package.json` are initialized with approved dependencies only.

### Phase 2: Backend Core & Dual-Auth System
- [ ] Run Python bytecode compilation check (`python -m compileall backend/app`) and confirm zero syntax or import errors.
- [ ] Confirm `POST /api/auth/staff/login` enforces: max 5 failed login attempts = 15-minute account lock, 60-second OTP resend cooldown, max 3 OTP requests/hour, and explicit rejection of `pembaca` role accounts.
- [ ] Confirm `POST /api/auth/google` verifies Google `id_token` directly without password or OTP prompts.

### Phase 3: Backend Novel, Chapter, & PDF-to-HTML Pipeline
- [ ] Confirm `services/pdf_converter.py` extracts embedded images to the `chapter-images` bucket, generates valid HTML (`<h1>`, `<h2>`, `<p>`, `<img>`), sanitizes the output HTML, and deletes temporary PDFs from the `pdfs` bucket.
- [ ] Confirm publishing a chapter (`is_published = true` and `is_draft = false`) automatically inserts notifications (`type = 'chapter_baru'`) for all users following that novel.

### Phase 4: Backend Personalization & Admin Module
- [ ] Confirm all `/api/admin/*` endpoints are guarded by the `require_admin` dependency.
- [ ] Confirm all author mutation endpoints verify `novel.author_id == current_user.id` (unless caller has `admin` role).

### Phase 5: Frontend Public & Reader Mode
- [ ] Run a codebase search across `frontend/src/` and confirm **zero** occurrences of `supabase`.
- [ ] Confirm `Lenis` is initialized **only** inside `frontend/src/app/(public)/` and does not leak into `(reader)` or `(staff)`.
- [ ] Confirm the reader page (`/novel/[slug]/chapter/[id]`) includes font size, font family, line height, and theme controls (`Terang`, `Gelap`, `Sepia`), Prev/Next/Chapter List navigation, and a debounced scroll tracker posting to `POST /api/histories`.

### Phase 6: Frontend Staff Portal & TipTap Rich Text Editor
- [ ] Confirm `TipTapEditor` implements every toolbar control specified in `AGENTS.md` Section 6.3 (Bold, Italic, Underline, Strikethrough, H1–H3, Align Left/Center/Right/Justify, Bullet/Numbered List, Blockquote, Horizontal Rule, Undo/Redo, Inline Image upload, Link insertion, Preview modal, Save Draft, Schedule Publish, and Immediate Publish).
- [ ] Confirm the PDF upload workflow polls conversion status and loads the resulting HTML into `TipTapEditor` for author review prior to publishing.

### Phase 7: Final Build & Audit Gate
- [ ] Run `npm run build` (and `npx tsc --noEmit`) inside `frontend/` and verify zero TypeScript or Next.js build errors.
- [ ] Start `uvicorn app.main:app` inside `backend/` and verify all routes register cleanly in `/openapi.json` without startup errors.

---

## 5. Debugging & Error Remediation Protocol

When encountering terminal, compiler, or runtime errors:
1. **Never disable security checks or strip required features** to silence an error (e.g., do not suppress TypeScript strictness with blanket `@ts-ignore` comments or remove RBAC validation dependencies).
2. **Trace errors from the bottom of the stack trace (root cause)**, fix the underlying defect at its source, and re-run the verification command until clean.
3. If an installed package exhibits a minor API signature difference in `package.json` or `requirements.txt`, adapt the call site to match the installed library version without swapping out the core stack defined in `AGENTS.md`.