/**
 * useUserRole.ts
 *
 * Hook que carrega e expõe o role do utilizador autenticado.
 * O role vem da tabela `profiles.role` — nunca do JWT (que pode estar em cache).
 *
 * Retorna:
 *   role    — "user" | "creator" | "admin" | null (se não autenticado)
 *   loading — true enquanto carrega
 *   can     — função de verificação de permissão (atalho)
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { type UserRole, type Permission, can as canFn } from "@/lib/rbac";

interface UseUserRoleResult {
  role: UserRole | null;
  loading: boolean;
  can: (permission: Permission) => boolean;
}

export function useUserRole(): UseUserRoleResult {
  const [role, setRole]     = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Usa getUser() para garantir que o utilizador é real
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          if (!cancelled) { setRole(null); setLoading(false); }
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (!cancelled) {
          if (error || !data) {
            setRole("user"); // fallback seguro
          } else {
            // Validação defensiva — garante que o valor é um role válido
            const r = data.role as string;
            setRole(r === "creator" || r === "admin" ? r : "user");
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setRole(null); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return canFn(role, permission);
  };

  return { role, loading, can };
}
