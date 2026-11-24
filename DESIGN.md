---
colors:
  primary: "#4F46E5"           # Indigo - Primary CTAs, read buttons, active indicators
  primary-hover: "#4338CA"
  secondary: "#D97706"         # Warm Amber - Star rating badges, top rankings, highlights
  surface-light: "#FAFAFA"     # Main background for public pages & staff dashboards
  card-light: "#FFFFFF"
  text-primary: "#111827"
  text-secondary: "#6B7280"
  border-subtle: "#E5E7EB"
  # Reader Mode Exclusive Themes
  reader-light-bg: "#FFFFFF"
  reader-light-text: "#1F2937"
  reader-sepia-bg: "#F4ECD8"   # Eye-friendly warm paper tone for long-form reading
  reader-sepia-text: "#433422"
  reader-dark-bg: "#121214"    # Soft dark charcoal (never pure #000000 to prevent glare)
  reader-dark-text: "#D4D4D8"
typography:
  font-sans: "Plus Jakarta Sans, Inter, sans-serif"
  font-reader-serif: "Lora, Merriweather, Georgia, serif"
  font-mono: "JetBrains Mono, monospace"
rounded:
  card: "12px"
  button: "8px"
  badge: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# DESIGN.md — Design System for Web Baca Novel Publik

> **UI & VISUAL DIRECTIVE FOR AI CODING AGENTS:**
> This file is the **Single Source of Truth** for visual styling, design tokens, typography, layout proportions, and motion rules across **Web Baca Novel Publik**. Map all YAML tokens above into Tailwind CSS / CSS custom properties (`variables.css`).
>
> **UI LABEL PRESERVATION RULE:** While design guidelines are written in English for optimal model comprehension, you **MUST** preserve all exact Indonesian UI strings, theme names, and status labels specified below (e.g., `'Terang'`, `'Sepia'`, `'Gelap'`, `'Ongoing'`, `'Tamat'`, `'Draft'`, `'Mulai Baca'`, `'Publish Chapter'`, `'Simpan'`).

---

## 1. Visual Identity & Atmosphere

This platform adopts a **Modern Editorial Literary** aesthetic with distinct visual atmospheres tailored to each route group's functional purpose:

- **Public Zone `(public)`:** Clean, airy, and cover-driven. Novel cover artwork in a strict `2:3` aspect ratio serves as the primary visual anchor on every card.
- **Reader Zone `(reader)`:** Ultra-minimalist and distraction-free, prioritizing long-form typographic readability inspired by Kindle and Medium.
- **Staff Zone `(staff)`:** Utilitarian and data-dense (compact dashboard), optimized for rapid authoring, chapter editing, and administrative moderation workflows.

---

## 2. Color System & Contrast Rules

- **Primary (`#4F46E5`):** Reserved exclusively for primary Call-to-Action buttons (*Mulai Baca*, *Publish Chapter*, *Simpan*) and active tab/navigation indicators.
- **Secondary (`#D97706`):** Used strictly for `1–5` star rating scores, rank badges/crowns on `/ranking`, and `Tamat` status highlights.
- **Status Badges:**
  - `Ongoing`: Background `#ECFDF5`, Text `#047857` (Emerald).
  - `Tamat`: Background `#FFFBEB`, Text `#B45309` (Amber).
  - `Draft`: Background `#F3F4F6`, Text `#374151` (Gray).
- **Reader Mode Themes:** **MUST** support instant, zero-flicker theme switching via CSS custom properties between **Terang** (`#FFFFFF` / `#1F2937`), **Sepia** (`#F4ECD8` / `#433422`), and **Gelap** (`#121214` / `#D4D4D8`).

---

## 3. Typography & Hierarchy

- **UI & Navigation (`font-sans`):** Uses `Plus Jakarta Sans` with font weight `700` for page/section headings and `500` for button labels and navigation items.
- **Story Content in Reader Mode (`font-reader-serif`):** Defaults to `Lora` at `18px` font size, `1.8` line height, and `1.25em` paragraph bottom spacing to minimize eye strain. Readers can customize settings via the reader toolbar:
  - **Font Size:** `14px` to `24px`
  - **Font Family:** `Serif` (`Lora`), `Sans-Serif` (`Plus Jakarta Sans`), or `Mono` (`JetBrains Mono`)
  - **Line Spacing:** `1.5`, `1.8`, or `2.1`
- **Reading Column Measure:** Constrained to a maximum width of `68ch` (`~720px`) centered horizontally in the viewport to maintain an optimal line length on wide desktop screens.

---

## 4. Layout & Component Rules

- **Novel Card (`NovelCard`):**
  - Cover image container **MUST** enforce `aspect-[2/3]` with `object-cover` and `rounded-xl` (`12px`).
  - Display a maximum of **4 data points** per card: Cover image, Title (clamped to 2 lines via `line-clamp-2`), Primary Genre + Star Rating, and Status badge.
- **TipTap Rich Text Editor (Novelis Portal):**
  - Formatting toolbar **MUST** be sticky (`sticky top-0 z-10`) at the top of the writing canvas with a subtle bottom border (`1px solid #E5E7EB`).
  - The editor writing canvas **MUST** mirror the Reader Mode column width (`max-w-[720px]` centered) so authors experience an accurate layout preview while typing manually or editing PDF-converted HTML.

---

## 5. Motion & Animation Guardrails

- **Public Pages `(public)`:** Smooth scrolling powered by **Lenis** paired with subtle **GSAP** transitions (`duration: 0.5`, `ease: "power2.out"`) strictly limited to hero section entrances and staggered card reveals.
- **Reader Page `(reader)` & Staff Portal `(staff)`:** **ZERO decorative animations and ZERO Lenis.** All reader control panel and theme transitions **MUST** use lightweight native CSS (`transition-colors duration-150`).

---

## 6. Do's & Don'ts (Anti-Patterns)

- **DO:** Render skeleton loaders matching the exact `2:3` cover card dimensions while fetching catalog/ranking lists to prevent Cumulative Layout Shift (CLS).
- **DON'T:** Never use pure black (`#000000`) text on pure white (`#FFFFFF`) backgrounds, or pure white (`#FFFFFF`) text on pure black (`#000000`) backgrounds in Reader Mode; always use the soft `reader-*` palette tokens.
- **DON'T:** Never clutter novel cover thumbnails with multiple overlapping tag badges that obscure the cover illustration.
- **DON'T:** Never add links pointing to `/staff/login` or `/staff/verify-otp` inside the public Navbar or Footer components.