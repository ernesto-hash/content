-- ====================================================================
-- Migration: galeria_upgrade
-- Executar APÓS galeria_subscricoes.sql e security_hardening.sql
-- Adiciona: legenda, bucket de thumbs, policies de admin
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. Coluna legenda em galeria_fotos
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE galeria_fotos ADD COLUMN IF NOT EXISTS legenda TEXT;

-- ────────────────────────────────────────────────────────────────────
-- 2. Bucket público para thumbnails dos packs
--    (fotos do conteúdo ficam em galeria-fotos, privado)
--    (thumbnails de capa ficam aqui, público)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('galeria-thumbs', 'galeria-thumbs', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- ────────────────────────────────────────────────────────────────────
-- 3. Policies de admin — galeria_packs
--    Permite que utilizadores com role='admin' façam CRUD completo.
--    As policies existentes "service" já têm WITH CHECK (false)
--    o que bloqueia qualquer autenticado; estas novas policies
--    abrem excepção explícita para admins.
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "packs_insert_admin" ON galeria_packs;
DROP POLICY IF EXISTS "packs_update_admin" ON galeria_packs;
DROP POLICY IF EXISTS "packs_delete_admin" ON galeria_packs;

CREATE POLICY "packs_insert_admin"
  ON galeria_packs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "packs_update_admin"
  ON galeria_packs FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "packs_delete_admin"
  ON galeria_packs FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────
-- 4. Policies de admin — galeria_fotos
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fotos_insert_admin" ON galeria_fotos;
DROP POLICY IF EXISTS "fotos_update_admin" ON galeria_fotos;
DROP POLICY IF EXISTS "fotos_delete_admin" ON galeria_fotos;

CREATE POLICY "fotos_insert_admin"
  ON galeria_fotos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "fotos_update_admin"
  ON galeria_fotos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "fotos_delete_admin"
  ON galeria_fotos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────
-- 5. Policies de storage — galeria-fotos (admin pode fazer upload)
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "galeria_fotos_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "galeria_fotos_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "galeria_fotos_delete_admin" ON storage.objects;

CREATE POLICY "galeria_fotos_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'galeria-fotos'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "galeria_fotos_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'galeria-fotos'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "galeria_fotos_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'galeria-fotos'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────
-- 6. Policies de storage — galeria-thumbs (público + admin upload)
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "galeria_thumbs_read_public"  ON storage.objects;
DROP POLICY IF EXISTS "galeria_thumbs_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "galeria_thumbs_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "galeria_thumbs_delete_admin" ON storage.objects;

CREATE POLICY "galeria_thumbs_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'galeria-thumbs');

CREATE POLICY "galeria_thumbs_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'galeria-thumbs'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "galeria_thumbs_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'galeria-thumbs'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "galeria_thumbs_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'galeria-thumbs'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────
-- 7. Verificação
-- ────────────────────────────────────────────────────────────────────
SELECT
  column_name, data_type
FROM information_schema.columns
WHERE table_name = 'galeria_fotos'
ORDER BY ordinal_position;
