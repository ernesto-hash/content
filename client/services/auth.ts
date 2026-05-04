// client/services/auth.ts
import { supabase } from "../lib/supabaseClient";
import { registerSession, clearSessionMeta } from "../lib/sessionIntegrity";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Registar fingerprint da sessão imediatamente após login bem-sucedido
  if (data.user) {
    await registerSession(data.user.id);
  }
  return data;
}

export async function register(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  return data;
}

/**
 * Logout seguro:
 * 1. Revoga a sessão no servidor Supabase
 * 2. Limpa metadados de integridade de sessão (fingerprint, timestamps)
 * 3. Limpa chaves Supabase do localStorage
 * 4. Limpa sessionStorage
 */
export async function logout() {
  // Limpa metadados de integridade antes de fazer signOut
  clearSessionMeta();

  // Revoga no servidor
  await supabase.auth.signOut();

  // Limpa localStorage — chaves do Supabase seguem o padrão sb-*
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.startsWith("supabase") || key.startsWith("ss_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // localStorage pode estar bloqueado em contextos específicos
  }

  try {
    sessionStorage.clear();
  } catch {
    // silencioso
  }
}

/**
 * Verifica a sessão atual com revalidação server-side.
 * NUNCA usar getSession() para autenticação — lê apenas do cache local.
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function requestPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function confirmPasswordReset(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function loginWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
}

export async function loginWithTwitter() {
  await supabase.auth.signInWithOAuth({
    provider: "twitter",
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
}
