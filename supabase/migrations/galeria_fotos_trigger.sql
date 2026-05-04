-- ====================================================================
-- Migration: galeria_fotos_trigger
-- Trigger que mantém fotos_count em galeria_packs sincronizado
-- automaticamente com as linhas em galeria_fotos.
-- Executar no SQL Editor do Supabase Dashboard.
-- ====================================================================

-- ── 1. Função do trigger ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_fotos_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE galeria_packs
    SET fotos_count = fotos_count + 1
    WHERE id = NEW.pack_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE galeria_packs
    SET fotos_count = GREATEST(fotos_count - 1, 0)
    WHERE id = OLD.pack_id;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Se o pack_id mudou (raro, mas defensivo)
    IF OLD.pack_id IS DISTINCT FROM NEW.pack_id THEN
      UPDATE galeria_packs SET fotos_count = GREATEST(fotos_count - 1, 0) WHERE id = OLD.pack_id;
      UPDATE galeria_packs SET fotos_count = fotos_count + 1               WHERE id = NEW.pack_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- ── 2. Trigger em galeria_fotos ──────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sync_fotos_count ON galeria_fotos;

CREATE TRIGGER trg_sync_fotos_count
  AFTER INSERT OR DELETE OR UPDATE OF pack_id
  ON galeria_fotos
  FOR EACH ROW
  EXECUTE FUNCTION sync_fotos_count();

-- ── 3. Backfill — recalcular fotos_count para todos os packs ─────────
-- Garante que packs com fotos já inseridas ficam correctos.
UPDATE galeria_packs p
SET fotos_count = (
  SELECT COUNT(*)
  FROM galeria_fotos f
  WHERE f.pack_id = p.id
);

-- ── 4. Verificação ───────────────────────────────────────────────────
SELECT
  p.id,
  p.titulo,
  p.fotos_count            AS fotos_count_coluna,
  COUNT(f.id)              AS fotos_count_real
FROM galeria_packs p
LEFT JOIN galeria_fotos f ON f.pack_id = p.id
GROUP BY p.id, p.titulo, p.fotos_count
ORDER BY p.titulo;
