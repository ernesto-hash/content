-- ====================================================================
-- Security Hardening Migration — VERSÃO FINAL
-- Executar em: Supabase Dashboard → SQL Editor
-- Executar INTEGRALMENTE numa única transacção (ou bloco a bloco pela ordem)
-- ====================================================================


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 1: TABELA DE IDEMPOTÊNCIA DO WEBHOOK STRIPE
-- Deve existir antes de fazer deploy do stripe-webhook function
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id            TEXT        PRIMARY KEY,           -- event.id do Stripe (globalmente único)
  event_type    TEXT        NOT NULL,
  outcome       TEXT        NOT NULL DEFAULT 'processing'
                            CHECK (outcome IN ('processing', 'ok', 'error', 'skipped')),
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT                               -- preenchido quando outcome = 'error'
);

-- Limpeza automática de eventos com mais de 30 dias
-- (opcional — pode ser feito por cron job externo)
COMMENT ON TABLE stripe_webhook_events IS
  'Registo de eventos Stripe processados. Garante idempotência no webhook.';

-- Apenas service_role pode ler/escrever esta tabela
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Sem policies de utilizador autenticado → apenas service_role (que bypassa RLS) acede
-- Isto impede qualquer leitura da tabela por utilizadores normais


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 2: RBAC — COLUNA role EM profiles
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'creator', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 3: TRIGGER — BLOQUEIO DE ALTERAÇÃO DE role
--
-- PORQUÊ TRIGGER E NÃO APENAS POLICY:
-- • Policies WITH CHECK não têm acesso ao valor OLD (anterior)
-- • Um trigger BEFORE UPDATE tem acesso a OLD.role e NEW.role
-- • Permite bloquear explicitamente a mudança do campo
-- • auth.uid() retorna NULL em operações via service_role key
--   → service_role pode alterar roles; utilizadores autenticados não podem
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- auth.uid() retorna NULL quando a chamada vem de service_role (sem JWT)
    -- Retorna o UUID do utilizador quando vem de uma chamada autenticada
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION
        'ROLE_CHANGE_FORBIDDEN: alteração de role requer service_role. '
        'user=% tentou mudar de "%" para "%"',
        auth.uid(), OLD.role, NEW.role;
    END IF;
    -- auth.uid() IS NULL → operação de service_role → permitido
    RAISE NOTICE '[security] role alterado de "%" para "%" via service_role', OLD.role, NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 3B: COLUNA storage_path EM galeria_fotos
--
-- Guarda o path relativo dentro do bucket (ex: "pack1/foto1.jpg").
-- Necessária para as storage policies fazerem JOIN com a tabela.
-- O upload deve guardar data.path (retornado pelo supabase.storage.upload).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE galeria_fotos
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Backfill para registos existentes que tenham foto_url pública
UPDATE galeria_fotos
SET storage_path = REGEXP_REPLACE(
  foto_url,
  '^.*/storage/v1/object/public/galeria-fotos/(.+)$',
  '\1'
)
WHERE storage_path IS NULL
  AND foto_url LIKE '%/storage/v1/object/public/galeria-fotos/%';

-- Índice para a JOIN na storage policy (performance)
CREATE INDEX IF NOT EXISTS idx_galeria_fotos_storage_path
  ON galeria_fotos(storage_path)
  WHERE storage_path IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════
-- BLOCO 4: ACTIVAR RLS EM TODAS AS TABELAS SENSÍVEIS
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_subscricoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_packs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_fotos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 5: VIEW PÚBLICA DE PROFILES
--
-- PORQUÊ VIEW E NÃO POLICY USING(true):
-- • RLS filtra LINHAS, não COLUNAS
-- • Com USING(true) qualquer utilizador autenticado pode fazer
--   SELECT role, email, metadata, campos_sensíveis FROM profiles
-- • A view expõe apenas colunas seguras, sem campos sensíveis (role, etc.)
-- • A view pertence ao owner postgres → bypassa RLS da tabela subjacente
--   (comportamento intencional — a segurança está na projecção de colunas)
-- ════════════════════════════════════════════════════════════════════

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

-- Garantir acesso ao Supabase anon e authenticated roles
GRANT SELECT ON profiles_public TO anon;
GRANT SELECT ON profiles_public TO authenticated;

COMMENT ON VIEW profiles_public IS
  'Vista pública de profiles — apenas campos não-sensíveis. '
  'Usar para queries de criadores/modelos em vez da tabela profiles directamente. '
  'A tabela profiles directamente só deve ser consultada pelo próprio utilizador.';


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 6: POLICIES — profiles
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles_select_own"    ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON profiles;

-- Utilizadores lêem apenas o PRÓPRIO perfil completo
-- (para editar perfil, ver o próprio role, etc.)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Inserção do próprio perfil (signup flow)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Actualização do próprio perfil
-- Nota: o trigger prevent_role_escalation bloqueia mudanças ao campo role
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- NOTA: NÃO existe policy "select_public" com USING(true)
-- Leituras de outros perfis devem usar a view profiles_public


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 7: POLICIES — galeria_subscricoes
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subs_select_own"     ON galeria_subscricoes;
DROP POLICY IF EXISTS "subs_insert_service" ON galeria_subscricoes;
DROP POLICY IF EXISTS "subs_update_service" ON galeria_subscricoes;
DROP POLICY IF EXISTS "subs_delete_service" ON galeria_subscricoes;

-- Utilizadores vêem apenas a própria subscrição
CREATE POLICY "subs_select_own"
  ON galeria_subscricoes FOR SELECT
  USING (auth.uid() = user_id);

-- Writes só via service_role (stripe-webhook usa service_role key que bypassa RLS)
-- Estas policies bloqueiam clientes autenticados normais
CREATE POLICY "subs_insert_service"
  ON galeria_subscricoes FOR INSERT
  WITH CHECK (false);

CREATE POLICY "subs_update_service"
  ON galeria_subscricoes FOR UPDATE
  USING (false);

CREATE POLICY "subs_delete_service"
  ON galeria_subscricoes FOR DELETE
  USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 8: POLICIES — galeria_packs
--
-- ESTRATÉGIA:
-- • Metadados dos packs (título, thumbnail, fotos_count) → todos os autenticados
--   Necessário para mostrar CTAs de upgrade, página de planos, upsell
-- • O conteúdo premium real está em galeria_fotos, não aqui
-- • galeria_fotos é onde a restrição por subscrição se aplica
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "packs_select_subscribers" ON galeria_packs;
DROP POLICY IF EXISTS "packs_select_preview"     ON galeria_packs;
DROP POLICY IF EXISTS "packs_select_authenticated" ON galeria_packs;

-- Todos os utilizadores autenticados podem ver metadados de packs
-- (necessário para UX de upgrade — mostrar o que existe sem revelar o conteúdo)
CREATE POLICY "packs_select_authenticated"
  ON galeria_packs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas service_role pode escrever packs (gestão via dashboard admin)
DROP POLICY IF EXISTS "packs_insert_service" ON galeria_packs;
DROP POLICY IF EXISTS "packs_update_service" ON galeria_packs;
DROP POLICY IF EXISTS "packs_delete_service" ON galeria_packs;

CREATE POLICY "packs_insert_service"
  ON galeria_packs FOR INSERT WITH CHECK (false);
CREATE POLICY "packs_update_service"
  ON galeria_packs FOR UPDATE USING (false);
CREATE POLICY "packs_delete_service"
  ON galeria_packs FOR DELETE USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 9: POLICIES — galeria_fotos
--
-- ESTRATÉGIA DE PREVIEWS:
-- • is_preview = TRUE  → acessível a QUALQUER utilizador autenticado
--   (não é público para a internet — requer login)
--   Objetivo: mostrar teaser do pack a não-subscritores autenticados
-- • is_preview = FALSE → apenas subscritores activos/trial
--
-- IMPORTANTE: "acessível a autenticados" ≠ "público para a internet"
-- Mesmo previews requerem auth.uid() IS NOT NULL
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "fotos_select_subscribers" ON galeria_fotos;
DROP POLICY IF EXISTS "fotos_select_authenticated" ON galeria_fotos;

CREATE POLICY "fotos_select_authenticated"
  ON galeria_fotos FOR SELECT
  USING (
    -- Deve estar autenticado (requer login — não é público para a internet)
    auth.uid() IS NOT NULL
    AND (
      -- Fotos de preview: qualquer utilizador autenticado pode ver
      is_preview = TRUE
      OR
      -- Fotos premium: apenas subscritores activos ou em trial
      EXISTS (
        SELECT 1
        FROM galeria_subscricoes
        WHERE user_id    = auth.uid()
          AND status     IN ('active', 'trial')
          AND (periodo_fim IS NULL OR periodo_fim > NOW())
      )
    )
  );

-- Writes apenas via service_role
DROP POLICY IF EXISTS "fotos_insert_service" ON galeria_fotos;
DROP POLICY IF EXISTS "fotos_update_service" ON galeria_fotos;
DROP POLICY IF EXISTS "fotos_delete_service" ON galeria_fotos;

CREATE POLICY "fotos_insert_service"
  ON galeria_fotos FOR INSERT WITH CHECK (false);
CREATE POLICY "fotos_update_service"
  ON galeria_fotos FOR UPDATE USING (false);
CREATE POLICY "fotos_delete_service"
  ON galeria_fotos FOR DELETE USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 10: POLICIES — videos
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "videos_select_public"  ON videos;
DROP POLICY IF EXISTS "videos_select_own"     ON videos;
DROP POLICY IF EXISTS "videos_insert_creator" ON videos;
DROP POLICY IF EXISTS "videos_update_own"     ON videos;
DROP POLICY IF EXISTS "videos_delete_own"     ON videos;

CREATE POLICY "videos_select_public"
  ON videos FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "videos_select_own"
  ON videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "videos_insert_creator"
  ON videos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('creator', 'admin')
    )
  );

CREATE POLICY "videos_update_own"
  ON videos FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "videos_delete_own"
  ON videos FOR DELETE
  USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 11: POLICIES — interacoes (likes/dislikes)
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "interacoes_count_public" ON interacoes;
DROP POLICY IF EXISTS "interacoes_insert_own"   ON interacoes;
DROP POLICY IF EXISTS "interacoes_delete_own"   ON interacoes;

-- Contagem de likes visível a todos (necessário para exibir nº de gostos)
CREATE POLICY "interacoes_count_public"
  ON interacoes FOR SELECT
  USING (true);

CREATE POLICY "interacoes_insert_own"
  ON interacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interacoes_delete_own"
  ON interacoes FOR DELETE
  USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 12: POLICIES — subscriptions (seguir criadores)
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subscriptions_count_public" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own"   ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_own"   ON subscriptions;

CREATE POLICY "subscriptions_count_public"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "subscriptions_insert_own"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "subscriptions_delete_own"
  ON subscriptions FOR DELETE
  USING (auth.uid() = subscriber_id);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 13: STORAGE — buckets e policies
--
-- ATENÇÃO: definir os buckets como private SÓ depois de implementar
-- signed URLs no frontend. Activar bucket private sem signed URLs
-- quebra a visualização de imagens.
--
-- FASE 1 (agora): aplicar policies de storage (podem coexistir com
--                 bucket public durante desenvolvimento)
-- FASE 2 (antes de produção): tornar bucket private no Dashboard
--                              + implementar signed URLs no frontend
-- ════════════════════════════════════════════════════════════════════

-- Garantir que os buckets existem e que galeria-fotos é privado
INSERT INTO storage.buckets (id, name, public)
  VALUES ('galeria-fotos', 'galeria-fotos', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('video-uploads', 'video-uploads', false)
  ON CONFLICT (id) DO NOTHING;

-- ── Storage: galeria-fotos ───────────────────────────────────────────────────
--
-- DUAS POLICIES QUE ESPELHAM EXACTAMENTE A TABLE RLS DE galeria_fotos:
--
--   1. PREVIEW  → qualquer utilizador autenticado, mas APENAS se o ficheiro
--                 estiver marcado is_preview=true na tabela galeria_fotos.
--                 Um utilizador sem subscrição não consegue assinar ficheiros
--                 premium mesmo que conheça o path.
--
--   2. PREMIUM  → apenas subscritores activos/trial podem assinar qualquer
--                 ficheiro do bucket.
--
-- A JOIN é feita via galeria_fotos.storage_path = storage.objects.name
-- (storage_path guarda o path relativo dentro do bucket, ex: "pack1/foto1.jpg")
--
-- NOTA: policies em Supabase Storage são combinadas com OR.
-- Um subscritor cumpre a policy premium e não precisa da preview.
-- Um não-subscritor só cumpre a policy preview se o ficheiro for is_preview=true.

DROP POLICY IF EXISTS "galeria_fotos_read_subscribers"    ON storage.objects;
DROP POLICY IF EXISTS "galeria_fotos_read_authenticated"  ON storage.objects;
DROP POLICY IF EXISTS "galeria_fotos_storage_previews"    ON storage.objects;
DROP POLICY IF EXISTS "galeria_fotos_storage_subscribers" ON storage.objects;

-- Policy 1: PREVIEW — autenticado + is_preview=true na tabela
CREATE POLICY "galeria_fotos_storage_previews"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'galeria-fotos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM galeria_fotos gf
      WHERE gf.storage_path = name
        AND gf.is_preview = true
    )
  );

-- Policy 2: PREMIUM — subscritor activo/trial pode ler qualquer ficheiro
CREATE POLICY "galeria_fotos_storage_subscribers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'galeria-fotos'
    AND EXISTS (
      SELECT 1 FROM galeria_subscricoes gs
      WHERE gs.user_id = auth.uid()
        AND gs.status IN ('active', 'trial')
        AND (gs.periodo_fim IS NULL OR gs.periodo_fim > NOW())
    )
  );

-- ── Storage: video-uploads — policies separadas por operação ────────────────
-- FOR ALL substituído por SELECT/INSERT/UPDATE/DELETE separados:
-- Motivo: FOR ALL é menos auditável e viola o princípio do menor privilégio.
-- Operações separadas permitem ajustes finos sem risco de sobre-permissão.

DROP POLICY IF EXISTS "video_uploads_manage_own"    ON storage.objects;
DROP POLICY IF EXISTS "video_uploads_insert_creator" ON storage.objects;
DROP POLICY IF EXISTS "video_uploads_select_own"     ON storage.objects;
DROP POLICY IF EXISTS "video_uploads_update_own"     ON storage.objects;
DROP POLICY IF EXISTS "video_uploads_delete_own"     ON storage.objects;

-- SELECT: o creator vê os próprios ficheiros
CREATE POLICY "video_uploads_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- INSERT: apenas creators/admins podem fazer upload (na própria pasta)
CREATE POLICY "video_uploads_insert_creator"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('creator', 'admin')
    )
  );

-- UPDATE: o creator actualiza os próprios ficheiros
CREATE POLICY "video_uploads_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: o creator apaga os próprios ficheiros
CREATE POLICY "video_uploads_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 14: VERIFICAÇÃO FINAL
-- Executar após aplicar todos os blocos acima para confirmar que
-- as tabelas, views, trigger e policies foram criadas correctamente
-- ════════════════════════════════════════════════════════════════════

-- Verifica tabela de idempotência
SELECT 'stripe_webhook_events' AS tabela,
       COUNT(*) AS policies
FROM pg_policies
WHERE tablename = 'stripe_webhook_events';

-- Verifica trigger de role
SELECT tgname AS trigger, tgrelid::regclass AS tabela
FROM pg_trigger
WHERE tgname = 'trg_prevent_role_escalation';

-- Verifica view pública
SELECT viewname, definition
FROM pg_views
WHERE viewname = 'profiles_public';

-- Lista todas as policies activas nas tabelas críticas
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN (
  'profiles', 'galeria_subscricoes', 'galeria_packs',
  'galeria_fotos', 'videos', 'interacoes', 'subscriptions'
)
ORDER BY tablename, policyname;
