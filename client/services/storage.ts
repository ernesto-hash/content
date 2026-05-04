/**
 * storage.ts — Supabase Storage com Signed URLs
 *
 * Todos os buckets com conteúdo privado (galeria, uploads de vídeo,
 * avatares de criadores) devem ser configurados como PRIVATE no
 * Supabase Dashboard → Storage → Policies.
 *
 * Configuração obrigatória no Supabase Dashboard:
 *   1. Bucket "galeria-fotos"  → Private
 *   2. Bucket "video-uploads"  → Private
 *   3. Bucket "avatars"        → Public (avatares são públicos por design)
 *   4. Bucket "thumbnails"     → Public (thumbnails são públicos)
 *
 * Políticas RLS de Storage para bucket privado (galeria-fotos):
 *
 *   -- Leitura: apenas utilizadores com subscrição ativa
 *   CREATE POLICY "galeria_fotos_select"
 *   ON storage.objects FOR SELECT
 *   USING (
 *     bucket_id = 'galeria-fotos'
 *     AND EXISTS (
 *       SELECT 1 FROM galeria_subscricoes gs
 *       WHERE gs.user_id = auth.uid()
 *         AND gs.status IN ('active', 'trial')
 *         AND (gs.periodo_fim IS NULL OR gs.periodo_fim > now())
 *     )
 *   );
 *
 *   -- Upload: apenas admins e criadores verificados
 *   CREATE POLICY "galeria_fotos_insert"
 *   ON storage.objects FOR INSERT
 *   WITH CHECK (
 *     bucket_id = 'galeria-fotos'
 *     AND EXISTS (
 *       SELECT 1 FROM profiles p
 *       WHERE p.id = auth.uid()
 *         AND p.role IN ('admin', 'creator')
 *     )
 *   );
 *
 *   -- Vídeos privados: apenas o dono pode ler
 *   CREATE POLICY "video_uploads_select_own"
 *   ON storage.objects FOR SELECT
 *   USING (
 *     bucket_id = 'video-uploads'
 *     AND (storage.foldername(name))[1] = auth.uid()::text
 *   );
 */

import { supabase } from "@/lib/supabaseClient";

// Duração padrão das signed URLs (segundos)
const SIGNED_URL_DURATION = {
  gallery:   60 * 60,       // 1 hora — acesso a fotos premium
  video:     60 * 60 * 2,   // 2 horas — streaming de vídeo
  avatar:    60 * 60 * 24,  // 24 horas — avatares
  thumbnail: 60 * 60 * 24,  // 24 horas — thumbnails
} as const;

type UrlType = keyof typeof SIGNED_URL_DURATION;

/**
 * Gera uma signed URL para um ficheiro num bucket privado.
 * A URL expira após a duração configurada para o tipo.
 *
 * @param bucket  — nome do bucket no Supabase Storage
 * @param path    — caminho do ficheiro dentro do bucket
 * @param type    — tipo de URL (determina a duração)
 * @returns       — signed URL ou null em caso de erro
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  type: UrlType = "gallery"
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_DURATION[type]);

  if (error || !data?.signedUrl) {
    console.error(`[storage] Failed to create signed URL for ${bucket}/${path}:`, error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Gera signed URLs para múltiplos ficheiros num batch.
 * Mais eficiente do que chamar getSignedUrl() em loop.
 */
export async function getSignedUrls(
  bucket: string,
  paths: string[],
  type: UrlType = "gallery"
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  if (paths.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_DURATION[type]);

  if (error || !data) {
    console.error(`[storage] Failed to create signed URLs for ${bucket}:`, error?.message);
    return result;
  }

  for (const item of data) {
    if (item.signedUrl) {
      result.set(item.path, item.signedUrl);
    }
  }

  return result;
}

/**
 * Upload seguro de ficheiro com validação de tipo e tamanho.
 *
 * @param bucket       — bucket de destino
 * @param path         — caminho de destino (ex: "userId/video.mp4")
 * @param file         — File object
 * @param allowedTypes — tipos MIME permitidos
 * @param maxSizeMB    — tamanho máximo em MB
 */
export async function secureUpload(
  bucket: string,
  path: string,
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): Promise<{ path: string } | { error: string }> {
  // Validação de tipo MIME (cliente)
  if (!allowedTypes.includes(file.type)) {
    return { error: `Tipo de ficheiro não permitido. Tipos aceites: ${allowedTypes.join(", ")}` };
  }

  // Validação de extensão (previne bypass de MIME)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeExtMap: Record<string, string[]> = {
    "video/mp4":       ["mp4"],
    "video/webm":      ["webm"],
    "video/quicktime": ["mov"],
    "image/jpeg":      ["jpg", "jpeg"],
    "image/png":       ["png"],
    "image/webp":      ["webp"],
    "image/gif":       ["gif"],
  };
  const allowed = mimeExtMap[file.type] ?? [];
  if (!allowed.includes(ext)) {
    return { error: "Extensão do ficheiro não corresponde ao tipo MIME." };
  }

  // Validação de tamanho
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: `Ficheiro demasiado grande. Máximo: ${maxSizeMB}MB` };
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });

  if (error) {
    return { error: error.message };
  }

  return { path: data.path };
}

/**
 * Remove um ficheiro do storage.
 * Apenas o dono do ficheiro (ou admin) deve poder chamar isto.
 */
export async function removeFile(
  bucket: string,
  path: string
): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error(`[storage] Failed to remove ${bucket}/${path}:`, error.message);
    return false;
  }
  return true;
}

/**
 * Transforma um URL público de storage num path relativo para uso com signed URLs.
 * Ex: "https://xxx.supabase.co/storage/v1/object/public/galeria-fotos/pack1/foto1.jpg"
 *     → "pack1/foto1.jpg"
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}
