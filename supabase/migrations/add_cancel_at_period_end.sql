-- ====================================================================
-- Migration: add_cancel_at_period_end
-- Executar em: Supabase Dashboard → SQL Editor
-- ====================================================================

-- 1. Adicionar coluna cancel_at_period_end
ALTER TABLE galeria_subscricoes
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- 2. Corrigir CHECK constraint do status para incluir 'past_due'
--    (necessário para o webhook registar falhas de pagamento)
ALTER TABLE galeria_subscricoes
  DROP CONSTRAINT IF EXISTS galeria_subscricoes_status_check;

ALTER TABLE galeria_subscricoes
  ADD CONSTRAINT galeria_subscricoes_status_check
  CHECK (status IN ('pendente','active','trial','past_due','expired','canceled'));
