# PROGRESS.md — Build Execution Tracker

> **AGENT INSTRUCTION:** Update this checklist immediately (`[ ]` -> `[x]`) after completing and verifying each task. Do not proceed to the next phase until all gatekeeper checks in the current phase are marked complete.

## Phase 1: Monorepo Scaffolding & Database Migration
- [x] Initialize root structure (`frontend/`, `backend/`, `supabase/migrations/`)
- [x] Write `supabase/migrations/001_initial_schema.sql` with all 12 tables and `DISABLE ROW LEVEL SECURITY`
- [x] Configure Supabase Storage buckets (`covers`, `pdfs`, `chapter-images`)
- [x] Setup `backend/requirements.txt` and `backend/.env.example`
- [x] Setup `frontend/package.json` (excluding `@supabase/supabase-js`) and `frontend/.env.example`

## Phase 2: Backend Core & Dual-Track Authentication
- [x] Implement `app/core/config.py`, `database.py`, `storage.py`, and `security.py`
- [x] Implement RBAC dependencies in `app/api/deps.py` (`get_current_user_optional`, `require_pembaca`, `require_novelis`, `require_admin`)
- [x] Implement Reader Google OAuth (`POST /api/auth/google`) with 7-day `HttpOnly` JWT cookie
- [x] Implement Staff Login (`POST /api/auth/staff/login`) with 5-attempt lockout (15m) & OTP rate limits (60s cooldown, max 3/hr)
- [x] Implement Staff OTP Verification (`POST /api/auth/staff/verify-otp`), Refresh Token, Forgot Password, Logout, and `/api/auth/me`
- [x] **Gatekeeper Check:** Run `python -m compileall backend/app` with zero errors

## Phase 3: Backend Novels, Chapters, & PDF-to-HTML Pipeline
- [x] Implement `app/services/sanitizer.py` with TipTap-compatible HTML allowlist
- [x] Implement `app/services/pdf_converter.py` (PyMuPDF background extraction, image upload to `chapter-images`, temp PDF cleanup)
- [x] Implement Novel CRUD & cover upload (`covers` bucket) with strict `author_id` ownership verification
- [x] Implement Chapter CRUD (Draft, Scheduled, Immediate Publish) & automatic follower notification trigger (`type = 'chapter_baru'`)
- [x] Implement PDF upload (`POST /api/chapters/upload-pdf`) & job polling (`GET /api/chapters/pdf-jobs/{job_id}`)

## Phase 4: Backend Personalization & Admin Module
- [x] Implement Bookmarks (`sedang_dibaca`, `ingin_dibaca`, `favorit`, `selesai`) & Reading Histories (`last_position`)
- [x] Implement Follow Novel, Notifications, Nested Comments (`parent_id` + reply notifications), & Star Ratings (1–5)
- [x] Implement Reader Profile updates (`display_name` & avatar upload)
- [x] Implement Admin endpoints (stats, user role promotion/ban, novel approval/deletion, genre/tag CRUD, comment moderation)

## Phase 5: Frontend Public Zone & Distraction-Free Reader Mode
- [x] Configure Tailwind CSS tokens & CSS variables from `DESIGN.md`
- [x] Build `src/lib/api-client.ts` (`credentials: 'include'`) and `src/types/index.ts`
- [x] Build `(public)` layout with Navbar (no `/staff/login` link), Footer, Lenis + GSAP
- [x] Build Public pages: Home (`/`), `/katalog`, `/ranking`, `/novel/[slug]`, `/login`, and `/profil`
- [x] Build `(reader)` layout **WITHOUT Lenis or GSAP** for `/novel/[slug]/chapter/[id]`
- [x] Implement Reader toolbar (`Terang`/`Sepia`/`Gelap`, font size/family/line-height), Prev/Next navigation, debounced scroll history tracker, and nested comments

## Phase 6: Frontend Hidden Staff Portal & TipTap Editor
- [x] Build `/staff/login` and `/staff/verify-otp` inside `(staff)` layout (**WITHOUT Lenis or GSAP**)
- [x] Build `TipTapEditor` with full formatting toolbar, inline image upload, Reader preview modal, Draft, Schedule, and Publish actions
- [x] Build Novelis Dashboard (`/staff/novelis/dashboard`), Create Novel (`/create`), and Edit Novel (`/edit`) with PDF upload -> TipTap review flow
- [x] Build Admin Dashboard (`/staff/admin/dashboard`), Users management (`/users`), and Novels/Genres/Tags moderation (`/novels`)

## Phase 7: Final Audit & Build Verification
- [x] Confirm zero occurrences of `supabase` inside `frontend/src/` (0 occurrences verified)
- [x] Confirm `Lenis` and `GSAP` are strictly isolated to `frontend/src/app/(public)/` (verified with zero imports in root layout, reader, editor, or staff)
- [x] Confirm zero links to `/staff/login` or `/staff/verify-otp` in public navigation or footer (verified)
- [x] Verify database schema migration `001_initial_schema.sql` (12 canonical tables with explicit `DISABLE ROW LEVEL SECURITY`)
- [x] Verify FastAPI startup, OpenAPI registration of all 48 routes, and `nh3` HTML sanitizer via `backend/verify_backend.py` (zero errors)
- [x] Run `npx tsc --noEmit` in `frontend/` (0 TypeScript errors)
- [x] Run `npm run build` in `frontend/` (production build compiled and generated all 15 routes successfully)
- [x] Create comprehensive `README.md` and `backend/bootstrap_admin.py` for project setup and admin account creation
