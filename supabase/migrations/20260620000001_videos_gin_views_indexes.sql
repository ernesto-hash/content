-- Índice GIN para queries .contains("tags", [...]) — operador @>
-- Índice B-tree para ORDER BY views DESC
--
-- NOTA: CREATE INDEX CONCURRENTLY não pode correr dentro de uma transação.
-- As migrations do Supabase CLI correm em transação por padrão, por isso
-- este ficheiro usa CREATE INDEX simples (sem CONCURRENTLY).
-- Se quiseres zero-downtime num ambiente com tráfego intenso, corre as
-- duas linhas manualmente no SQL Editor do Supabase com CONCURRENTLY,
-- e marca depois a migration como aplicada.

CREATE INDEX IF NOT EXISTS idx_videos_tags_gin
  ON videos USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_videos_views_desc
  ON videos (views DESC);
