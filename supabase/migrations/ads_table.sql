-- ====================================================================
-- Migration: ads_table
-- Sistema de publicidade paga com Stripe
-- Executar no Supabase Dashboard → SQL Editor
-- ====================================================================

-- Drop tables antigas (sem dados reais ainda — sistema antigo era fake)
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS ads_webhook_events CASCADE;

CREATE TABLE ads (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name      text        NOT NULL,
  company_email     text        NOT NULL,
  website_url       text        NOT NULL,
  headline          text        NOT NULL,
  description       text        NOT NULL,
  cta_text          text        DEFAULT 'Saber mais',
  logo_url          text,
  bg_color          text        DEFAULT '#0f0f1a',
  accent_color      text        DEFAULT '#ec4899',
  plan_id           text        NOT NULL,
  plan_days         integer     NOT NULL,
  plan_price        numeric(10,2) NOT NULL,
  placement         text[]      NOT NULL DEFAULT '{"all_pages"}',
  status            text        DEFAULT 'pending',
  stripe_session_id text,
  stripe_payment_id text,
  paid_at           timestamptz,
  starts_at         timestamptz,
  ends_at           timestamptz,
  impressions       integer     DEFAULT 0,
  clicks            integer     DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir (empresa a anunciar / webhook)
CREATE POLICY "Anyone can create ads"
  ON ads FOR INSERT
  WITH CHECK (true);

-- Apenas anúncios activos e dentro do prazo são visíveis publicamente
CREATE POLICY "Active ads are visible"
  ON ads FOR SELECT
  USING (
    status = 'active'
    AND starts_at <= now()
    AND ends_at >= now()
  );

-- Permitir actualização de impressions/clicks (via anon key do frontend)
CREATE POLICY "Allow stats update"
  ON ads FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Service role full access (bypass RLS de qualquer forma, mas por clareza)
CREATE POLICY "Service role full access"
  ON ads
  USING (true)
  WITH CHECK (true);

-- Tabela de idempotência do webhook
CREATE TABLE ads_webhook_events (
  id           text        PRIMARY KEY,
  event_type   text,
  outcome      text        DEFAULT 'processing',
  processed_at timestamptz DEFAULT now()
);

ALTER TABLE ads_webhook_events ENABLE ROW LEVEL SECURITY;
-- Sem policies → apenas service_role acede

-- Índices de performance
CREATE INDEX idx_ads_status     ON ads (status);
CREATE INDEX idx_ads_ends_at    ON ads (ends_at);
CREATE INDEX idx_ads_placement  ON ads USING gin (placement);
