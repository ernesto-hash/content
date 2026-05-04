-- ====================================================================
-- Migration: galeria_subscricoes
-- Executar em: Supabase Dashboard → SQL Editor
-- DEVE ser executada ANTES de security_hardening.sql
-- ====================================================================

-- ════════════════════════════════════════════════════════════════════
-- TABELA PRINCIPAL: galeria_subscricoes
-- Uma linha por utilizador — upsert via user_id (UNIQUE)
-- Escrita APENAS via service_role (Edge Functions / webhook)
-- Leitura permitida ao próprio utilizador (RLS em security_hardening.sql)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS galeria_subscricoes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT,
  stripe_sub_id       TEXT,
  plano               TEXT        NOT NULL DEFAULT 'pendente'
                                  CHECK (plano IN ('pendente','normal','exclusivo','raro','desconhecido')),
  status              TEXT        NOT NULL DEFAULT 'pendente'
                                  CHECK (status IN ('pendente','active','trial','expired','canceled')),
  periodo_fim         TIMESTAMPTZ,
  trial_fim           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT galeria_subscricoes_user_id_unique UNIQUE (user_id)
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_galeria_subscricoes_updated_at ON galeria_subscricoes;
CREATE TRIGGER trg_galeria_subscricoes_updated_at
  BEFORE UPDATE ON galeria_subscricoes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_galeria_subscricoes_user_id
  ON galeria_subscricoes (user_id);

CREATE INDEX IF NOT EXISTS idx_galeria_subscricoes_stripe_customer_id
  ON galeria_subscricoes (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_galeria_subscricoes_status
  ON galeria_subscricoes (status);

-- ════════════════════════════════════════════════════════════════════
-- TABELAS AUXILIARES (se não existirem)
-- galeria_packs e galeria_fotos são necessárias para a galeria
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS galeria_packs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT        NOT NULL,
  descricao     TEXT,
  thumbnail_url TEXT,
  categoria     TEXT        NOT NULL DEFAULT 'Normal',
  fotos_count   INTEGER     NOT NULL DEFAULT 0,
  etiqueta      TEXT        CHECK (etiqueta IN ('Normal','Exclusivo','Raro','Hot')),
  is_premium    BOOLEAN     NOT NULL DEFAULT true,
  views         INTEGER     NOT NULL DEFAULT 0,
  destaque      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galeria_fotos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id       UUID        NOT NULL REFERENCES galeria_packs(id) ON DELETE CASCADE,
  foto_url      TEXT        NOT NULL,
  storage_path  TEXT,
  is_preview    BOOLEAN     NOT NULL DEFAULT false,
  ordem         INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_galeria_fotos_pack_id ON galeria_fotos (pack_id);
CREATE INDEX IF NOT EXISTS idx_galeria_fotos_is_preview ON galeria_fotos (is_preview);

-- ════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════════════
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('galeria_subscricoes','galeria_packs','galeria_fotos','stripe_webhook_events')
ORDER BY table_name;
