-- ====================================================================
-- Migration: profiles_public view
-- Executar em: Supabase Dashboard → SQL Editor
-- Elimina os erros 404 em profiles_public em toda a app
-- ====================================================================

DROP VIEW IF EXISTS profiles_public;

CREATE OR REPLACE VIEW profiles_public AS
SELECT
  id,
  username,
  full_name,
  avatar_url,
  verified,
  created_at
FROM profiles;

GRANT SELECT ON profiles_public TO anon;
GRANT SELECT ON profiles_public TO authenticated;

-- Verificação
SELECT viewname FROM pg_views WHERE viewname = 'profiles_public';
