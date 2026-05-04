-- Migration: adicionar role e verified à tabela profiles (se não existirem)
-- Executar em: Supabase Dashboard → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role      TEXT    NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS verified  BOOLEAN NOT NULL DEFAULT false;

-- Índice para lookups por role (RoleProtectedRoute, useUserRole)
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);

-- Verificação
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('role', 'verified');
