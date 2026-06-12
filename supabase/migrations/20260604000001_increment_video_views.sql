-- Função para incrementar views de vídeos de forma segura (atomic update)
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void AS $$
  UPDATE videos SET views = views + 1 WHERE id = video_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Permissão para utilizadores anónimos e autenticados
GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO authenticated;
