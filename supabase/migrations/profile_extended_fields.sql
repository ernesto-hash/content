-- profile_extended_fields.sql
-- Adds bio, banner_url, location, website columns to profiles
-- Creates avatars bucket (public) with per-user RLS policies

-- ── 1. Extend profiles table ─────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio        TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS location   TEXT,
  ADD COLUMN IF NOT EXISTS website    TEXT;

-- ── 2. Create avatars bucket (public) ────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- ── 3. Storage RLS policies for avatars ──────────────────────────────────────
-- Public bucket → anyone can read.
-- Uploads restricted to own folder: path must start with auth.uid().

DROP POLICY IF EXISTS "avatars_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"     ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"     ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"     ON storage.objects;

-- Read: anyone (bucket is public)
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Insert: authenticated + path starts with own user id
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update: own files only
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: own files only
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
