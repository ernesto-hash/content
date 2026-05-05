/**
 * profiles.ts — Serviço de perfis com exposição mínima de dados
 *
 * Princípio: nunca usar select("*") em queries de profiles.
 * Cada função seleciona apenas os campos necessários para o seu contexto.
 *
 * Campos sensíveis que NUNCA devem ser retornados ao cliente via RLS:
 *   - email (está na tabela auth.users, não em profiles — mas verificar)
 *   - phone
 *   - stripe_customer_id
 *   - internal_notes
 *   - ban_reason
 *
 * Política RLS recomendada (substitui "profiles_select_all"):
 *
 *   -- Perfis públicos: apenas campos não-sensíveis
 *   CREATE POLICY "profiles_select_public_fields"
 *   ON profiles FOR SELECT
 *   USING (true);
 *
 *   -- Mas adicionar uma view para campos públicos:
 *   CREATE OR REPLACE VIEW public_profiles AS
 *   SELECT id, username, full_name, avatar_url, verified, role, created_at
 *   FROM profiles;
 *
 *   -- Ou restringir via column-level security (Supabase não suporta nativamente,
 *   -- usar funções RPC para expor apenas o necessário).
 */

import { supabase } from "../lib/supabaseClient";

// ─── Tipos com exposição explícita ────────────────────────────────────────────

/** Perfil completo — apenas para o próprio utilizador */
export interface OwnProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  verified: boolean;
  role: string;
  created_at: string;
}

/** Perfil público — exposto a qualquer utilizador */
export interface PublicProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  verified: boolean;
}

/** Perfil mínimo — para listas, sugestões, navegação */
export interface MinimalProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Retorna o perfil completo do utilizador atual.
 * Inclui role — apenas para o próprio utilizador autenticado.
 */
export async function getOwnProfile(userId: string): Promise<OwnProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, verified, role, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as OwnProfile;
}

/**
 * Retorna o perfil público de qualquer utilizador.
 * Não inclui role, email, nem dados sensíveis.
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles_public")
    .select("id, username, full_name, avatar_url, verified")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as PublicProfile;
}

/**
 * Alias para compatibilidade com código existente que usava getProfile().
 * Retorna o perfil completo do próprio utilizador.
 */
export async function getProfile(userId: string): Promise<OwnProfile | null> {
  return getOwnProfile(userId);
}

/**
 * Retorna perfil mínimo (para listas e sugestões de pesquisa).
 */
export async function getMinimalProfile(userId: string): Promise<MinimalProfile | null> {
  const { data, error } = await supabase
    .from("profiles_public")
    .select("id, username, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as MinimalProfile;
}

/**
 * Cria um perfil novo.
 * O userId deve ser o auth.uid() do utilizador autenticado.
 * role deve ser definido explicitamente no signup — nunca inferido depois.
 */
export async function createProfile(params: {
  userId: string;
  username: string;
  full_name: string;
  role?: "user" | "creator";
}): Promise<OwnProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id:        params.userId,
      username:  params.username,
      full_name: params.full_name,
      verified:  false,
      role:      params.role ?? "user",
    })
    .select("id, username, full_name, avatar_url, verified, role, created_at")
    .single();

  if (error || !data) return null;
  return data as OwnProfile;
}

/**
 * Atualiza o perfil do utilizador autenticado.
 * Apenas campos permitidos — role NÃO pode ser alterado pelo próprio utilizador
 * (só por admin via backend).
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<OwnProfile, "username" | "full_name" | "avatar_url">>
): Promise<OwnProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, username, full_name, avatar_url, verified, role, created_at")
    .single();

  if (error || !data) return null;
  return data as OwnProfile;
}
