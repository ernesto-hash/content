-- ====================================================================
-- Migration: 20260613000001_video_countries_rls_backfill.sql
-- Ativa RLS em video_countries, video_categories, countries e
-- categories (criadas em 20260610000001_expand_categories.sql)
-- e faz backfill de video_countries a partir do campo videos.category.
-- ====================================================================


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 1: RLS — video_countries
--
-- PADRÃO (igual a galeria_subscricoes / galeria_packs):
-- • SELECT USING (true)        — associações são metadados públicos
-- • INSERT WITH CHECK (false)  — bloqueado para autenticados
-- • UPDATE/DELETE USING (false)— bloqueado para autenticados
-- Writes só via service_role key, que bypassa RLS.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE video_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_countries_select_public"  ON video_countries;
DROP POLICY IF EXISTS "video_countries_insert_service" ON video_countries;
DROP POLICY IF EXISTS "video_countries_update_service" ON video_countries;
DROP POLICY IF EXISTS "video_countries_delete_service" ON video_countries;

CREATE POLICY "video_countries_select_public"
  ON video_countries FOR SELECT
  USING (true);

CREATE POLICY "video_countries_insert_service"
  ON video_countries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "video_countries_update_service"
  ON video_countries FOR UPDATE
  USING (false);

CREATE POLICY "video_countries_delete_service"
  ON video_countries FOR DELETE
  USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 2: RLS — video_categories
-- (mesmo padrão — só service_role escreve)
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_categories_select_public"  ON video_categories;
DROP POLICY IF EXISTS "video_categories_insert_service" ON video_categories;
DROP POLICY IF EXISTS "video_categories_update_service" ON video_categories;
DROP POLICY IF EXISTS "video_categories_delete_service" ON video_categories;

CREATE POLICY "video_categories_select_public"
  ON video_categories FOR SELECT
  USING (true);

CREATE POLICY "video_categories_insert_service"
  ON video_categories FOR INSERT
  WITH CHECK (false);

CREATE POLICY "video_categories_update_service"
  ON video_categories FOR UPDATE
  USING (false);

CREATE POLICY "video_categories_delete_service"
  ON video_categories FOR DELETE
  USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 3: RLS — countries
--
-- Tabela de lookup pública (seed de países).
-- M4 da auditoria: ficou sem RLS desde 20260610000001.
-- SELECT público; writes apenas via service_role (gestão de países
-- é operação administrativa, não de utilizadores).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countries_select_public"  ON countries;
DROP POLICY IF EXISTS "countries_insert_service" ON countries;
DROP POLICY IF EXISTS "countries_update_service" ON countries;
DROP POLICY IF EXISTS "countries_delete_service" ON countries;

CREATE POLICY "countries_select_public"
  ON countries FOR SELECT
  USING (true);

CREATE POLICY "countries_insert_service"
  ON countries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "countries_update_service"
  ON countries FOR UPDATE
  USING (false);

CREATE POLICY "countries_delete_service"
  ON countries FOR DELETE
  USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 4: RLS — categories
--
-- Tabela de lookup pública (seed de categorias de conteúdo).
-- Mesmo padrão que countries.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public"  ON categories;
DROP POLICY IF EXISTS "categories_insert_service" ON categories;
DROP POLICY IF EXISTS "categories_update_service" ON categories;
DROP POLICY IF EXISTS "categories_delete_service" ON categories;

CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_insert_service"
  ON categories FOR INSERT
  WITH CHECK (false);

CREATE POLICY "categories_update_service"
  ON categories FOR UPDATE
  USING (false);

CREATE POLICY "categories_delete_service"
  ON categories FOR DELETE
  USING (false);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 5: ÍNDICE — video_countries(country_id)
--
-- Já criado em 20260610000001 (linha 39).
-- IF NOT EXISTS garante idempotência.
-- ════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_video_countries_country_id
  ON video_countries (country_id);


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 6: BACKFILL — video_countries a partir de videos.category
--
-- LÓGICA:
--   Onde videos.category coincide com um slug da tabela countries,
--   insere a associação em video_countries.
--
-- COBERTURA ESPERADA (slugs com match directo):
--   portugal, brasil, angola, espanha, franca, alemanha, japao,
--   italia, mocambique, cabo-verde, australia, canada, etc.
--
-- ATENÇÃO — SLUG DIVERGENTE:
--   O StudioUpload usa category = 'eua' para Estados Unidos,
--   mas countries tem slug = 'estados-unidos'.
--   Esses vídeos NÃO são incluídos neste backfill.
--   Resolve-se na Etapa 3 (formulário de upload com país separado).
--
-- IDEMPOTÊNCIA:
--   ON CONFLICT DO NOTHING — pode correr N vezes sem duplicados.
--   A PK de video_countries é (video_id, country_id).
--
-- SCOPE:
--   Corre como postgres (service_role) — vê todos os vídeos,
--   incluindo não públicos. Intencional: país é metadado de conteúdo.
--   A filtragem status/visibility acontece na query das páginas.
-- ════════════════════════════════════════════════════════════════════

INSERT INTO video_countries (video_id, country_id)
SELECT
  v.id AS video_id,
  c.id AS country_id
FROM videos v
JOIN countries c ON c.slug = v.category
WHERE v.category IS NOT NULL
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════
-- BLOCO 7: VERIFICAÇÃO FINAL
-- ════════════════════════════════════════════════════════════════════

-- RLS activo nas quatro tabelas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('video_countries', 'video_categories', 'countries', 'categories')
  AND schemaname = 'public'
ORDER BY tablename;

-- Policies criadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('video_countries', 'video_categories', 'countries', 'categories')
ORDER BY tablename, policyname;

-- Resultado do backfill agrupado por país
SELECT
  c.slug         AS country_slug,
  c.name         AS country_name,
  COUNT(*)       AS videos_linked
FROM video_countries vc
JOIN countries c ON c.id = vc.country_id
GROUP BY c.slug, c.name
ORDER BY videos_linked DESC;
