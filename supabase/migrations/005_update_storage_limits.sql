-- Fix: raise Supabase Storage bucket file-size limits.
-- avatars bucket: 2 MB → 10 MB
-- receipts bucket: keep 5 MB (or create if missing)

UPDATE storage.buckets
SET file_size_limit = 10485760   -- 10 MB in bytes
WHERE id = 'avatars';

-- Ensure receipts bucket exists with 5 MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
