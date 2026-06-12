-- Índice composto para queries de listagem (sitemap, homepage, feeds públicos)
CREATE INDEX IF NOT EXISTS idx_videos_status_visibility
  ON videos (status, visibility);

-- Índice para ordenação por data (todas as listagens com ORDER BY created_at)
CREATE INDEX IF NOT EXISTS idx_videos_created_at
  ON videos (created_at DESC);

-- Índice para páginas de criador e canal (WHERE user_id = ...)
CREATE INDEX IF NOT EXISTS idx_videos_user_id
  ON videos (user_id);

-- Índice para lookup directo por slug (página de vídeo individual)
CREATE INDEX IF NOT EXISTS idx_videos_slug
  ON videos (slug);
