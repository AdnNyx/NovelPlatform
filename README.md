# Web Baca Novel Publik

> **Modern Public Web Novel Reading Platform**  
> Complete open-access reading experience for public visitors with personalization for authenticated readers and a dedicated hidden content portal for novel authors and administrators.

---

## 1. Architectural Highlights

- **Guest Access:** All novels, chapters, ratings, reviews, rankings, and comments are publicly accessible without authentication.
- **Dual-Track Authentication:**
  - **Reader (`pembaca`):** 1-Click passwordless Google OAuth (`id_token`). Enables Bookshelf/Bookmarks, Reading History with auto-scroll resume, Follow Novel notifications, ratings, and chapter comments.
  - **Staff (`novelis` & `admin`):** Secure dual-step authentication via Username/Email + Password + 6-digit Email OTP. Hidden portal (`/staff/login` & `/staff/verify-otp`) not exposed in public navigation or sitemaps.
- **Strict Security & RBAC Isolation:**
  - **Zero Direct Frontend Supabase Access:** Next.js frontend has **zero** imports of `@supabase/supabase-js`. 100% of data operations route through Python FastAPI (`/api/...`).
  - **Supabase as Pure Database & Storage:** PostgreSQL Row Level Security (RLS) is disabled across all tables; Python FastAPI holds 100% responsibility for authentication and RBAC.
  - **HttpOnly Cookies:** JWT tokens (`access_token`, `staff_access_token`, `staff_refresh_token`) are issued via secure `HttpOnly`, `SameSite=Lax` cookies with silent refresh support.
  - **Backend HTML Sanitization:** TipTap Rich Text Editor inputs and PDF-to-HTML converted contents are strictly sanitized using `nh3` to prevent Stored XSS.
- **Animation & Performance Isolation:**
  - **Public Pages `(public)`:** Smooth scrolling powered by **Lenis** + entrance/card reveals with **GSAP**.
  - **Reader Mode `(reader)`:** **Zero Lenis and Zero GSAP**. Distraction-free native scrolling with customizable themes (Terang, Sepia, Gelap), typography (Plus Jakarta Sans, Lora, JetBrains Mono), font sizing, line spacing, and debounced scroll position tracking.
  - **Staff Portal `(staff)`:** **Zero Lenis and Zero GSAP**. Utilitarian, high-density dashboard with TipTap Rich Text Editor and PyMuPDF async background conversion.

---

## 2. Monorepo Directory Layout

```text
web-baca-novel-publik/
├── AGENTS.md               # Canonical architecture, schema, & API specification
├── Antigravity.md          # Execution protocol & phase gatekeepers
├── DESIGN.md               # Visual design tokens & styling guide
├── CONTRACTS.md            # Exact API payload contracts & sanitizer allowlist
├── PROGRESS.md             # Implementation progress tracker
├── README.md               # This setup and run guide
├── backend/                # Python 3.11+ FastAPI REST API
│   ├── app/
│   │   ├── api/            # API routers (auth, novels, chapters, personal, novelis, admin)
│   │   ├── core/           # Config, database engine, storage helper, security/JWT
│   │   ├── models/         # SQLAlchemy ORM models (User, Novel, Chapter, Interaction)
│   │   ├── schemas/        # Pydantic v2 validation models
│   │   └── services/       # Email OTP, nh3 sanitizer, PyMuPDF background converter
│   ├── bootstrap_admin.py  # CLI script to create/promote initial admin
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Backend environment variables template
├── frontend/               # Next.js 14 App Router, TypeScript & Tailwind CSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/   # Public pages with Lenis + GSAP (Home, Katalog, Detail, Ranking, Profil)
│   │   │   ├── (reader)/   # Distraction-free Reader Mode (Native scrolling, No Lenis/GSAP)
│   │   │   └── (staff)/    # Hidden Staff Portal & TipTap Editor (No Lenis/GSAP)
│   │   ├── components/     # UI components for public, reader, editor, and staff
│   │   ├── lib/            # Centralized API fetch client (credentials: "include")
│   │   └── types/          # Strict snake_case TypeScript interfaces
│   ├── package.json        # Frontend dependencies (Zero @supabase/supabase-js)
│   ├── tailwind.config.ts  # Design system tokens matching DESIGN.md
│   └── .env.example        # Frontend environment variables template
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql  # Canonical 12 tables DDL (RLS explicitly disabled)
    └── storage_setup.sql           # Setup for storage buckets (covers, pdfs, chapter-images)
```

---

## 3. Database & Supabase Storage Setup

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Note your **Database Connection String (URI)**, **Project URL**, and **Service Role Key** (under Project Settings -> API).

### Step 2: Execute Schema Migration
1. In the Supabase dashboard, open the **SQL Editor**.
2. Copy and execute the contents of [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql).
3. This creates all 12 canonical tables (`users`, `genres`, `tags`, `novels`, `chapters`, `bookmarks`, `histories`, `follows`, `notifications`, `comments`, `ratings`, `otp_codes`) and explicitly executes `DISABLE ROW LEVEL SECURITY` on every table.

### Step 3: Configure Storage Buckets
Execute the SQL in [supabase/storage_setup.sql](supabase/storage_setup.sql) or verify in the **Storage** dashboard that 3 buckets exist:
- **`covers`**: Public bucket (for novel covers).
- **`chapter-images`**: Public bucket (for inline chapter images).
- **`pdfs`**: Private bucket (for temporary PDF upload during background extraction).

### Step 4: Bootstrap the Initial Admin User
Run the bootstrap script from the repository root:
```bash
python backend/bootstrap_admin.py --email admin@example.com --username admin --name "Super Admin" --password "AdminPassword123!"
```
*Alternatively, you can insert an admin record directly via Supabase SQL Editor:*
```sql
INSERT INTO users (username, email, display_name, password_hash, role, is_active)
VALUES (
    'admin',
    'admin@example.com',
    'Super Admin',
    -- Bcrypt hash for password 'AdminPassword123!'
    '$2b$12$e8x.0L7P5GqHh7uUjIklve5K8PqT59H788gqJ.H9/H3O5gT7K7z2e',
    'admin',
    TRUE
);
```

---

## 4. Backend Setup (FastAPI)

### Prerequisites
- Python 3.11+
- Virtual environment tool (`venv` or `virtualenv`)

### Setup Steps
1. Navigate to the backend directory or initialize from root:
   ```bash
   cd backend
   python -m venv .venv
   ```

2. Activate the virtual environment:
   - **Windows:**
     ```powershell
     .venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   # Database (AsyncPG connection pool)
   DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres

   # Supabase Storage & Service Key
   SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

   # Security & JWT Secrets
   JWT_SECRET_KEY=generate_a_minimum_32_character_random_hex_key_here
   JWT_ALGORITHM=HS256

   # Google OAuth Client ID for Reader Login
   GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID].apps.googleusercontent.com

   # CORS & Frontend Origins
   FRONTEND_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000

   # Runtime Environment
   IS_PRODUCTION=false

   # SMTP Configuration for Staff OTP Emails
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM_EMAIL=noreply@novelnest.com
   SMTP_FROM_NAME="Web Baca Novel Publik"
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
6. Open interactive OpenAPI documentation:  
   👉 `http://localhost:8000/docs`

---

## 5. Frontend Setup (Next.js)

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm (or pnpm / yarn)

### Setup Steps
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Set the API endpoint and Google Client ID:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID].apps.googleusercontent.com
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open the web application in your browser:  
   👉 `http://localhost:3000`

6. To build for production:
   ```bash
   npm run build
   npm start
   ```

---

## 6. Route Navigation Reference

| Path | Description | Access Control |
| :--- | :--- | :--- |
| `/` | Landing page (Hero, Trending, Latest, Leaderboard) | Public (Guest) |
| `/katalog` | Full Novel Catalog with Search, Filters & Sort | Public (Guest) |
| `/novel/[slug]` | Novel Detail, Synopsis, Reviews, Chapter List | Public (Guest) |
| `/novel/[slug]/chapter/[id]` | Distraction-free Reader Mode + Comments | Public (Guest) |
| `/ranking` | Weekly, Monthly, All-time Leaderboards | Public (Guest) |
| `/login` | Reader Login via Google OAuth | Public |
| `/profil` | Reader Profile, Bookshelf/Bookmarks, Reading History | Authenticated (`pembaca`) |
| `/staff/login` | Staff Step 1 (Username/Email + Password) | Hidden Internal Route |
| `/staff/verify-otp` | Staff Step 2 (6-digit Email OTP Verification) | Hidden Internal Route |
| `/staff/novelis/dashboard` | Author Dashboard (metrics & novel management) | Role `novelis` or `admin` |
| `/staff/novelis/novel/create` | Create Novel (TipTap Editor & PyMuPDF async extraction) | Role `novelis` or `admin` |
| `/staff/novelis/novel/[id]/edit` | Edit Novel & Chapter Management | Role `novelis` or `admin` |
| `/staff/admin/dashboard` | Admin Dashboard (platform stats & comment moderation) | Role `admin` only |
| `/staff/admin/novels` | Moderate Novels, Approve/Reject, Genre/Tag CRUD | Role `admin` only |
| `/staff/admin/users` | User management, Role promotions, Ban/Unban | Role `admin` only |

---

## 7. Verification & Testing

### Backend Verification
Run the backend verification suite to validate all 48 OpenAPI routes and the `nh3` HTML sanitizer against Stored XSS:
```bash
python backend/verify_backend.py
```

### Frontend Typecheck & Build
Run the TypeScript compiler and Next.js production build:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 8. License
This project is proprietary and intended for the **Web Baca Novel Publik** platform.
