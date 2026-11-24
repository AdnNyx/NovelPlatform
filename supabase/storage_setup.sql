-- ==============================================================================
-- Web Baca Novel Publik — Supabase Storage Buckets Setup
-- 1. covers: Public bucket for novel cover images and user avatars
-- 2. pdfs: Private bucket for temporary PDF uploads during conversion
-- 3. chapter-images: Public bucket for inline chapter images
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('covers', 'covers', true),
    ('pdfs', 'pdfs', false),
    ('chapter-images', 'chapter-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
