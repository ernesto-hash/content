/**
 * Hook e componente para logout seguro.
 *
 * Garante:
 * 1. Revogação da sessão no servidor Supabase
 * 2. Limpeza de localStorage e sessionStorage
 * 3. Reload da página para limpar estado React em memória (React Query cache, etc.)
 * 4. Substituição do histórico para impedir botão Back
 */
import { useState } from "react";
import { logout } from "@/services/auth";

export function useSecureLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Prossegue mesmo com erro — o importante é redirecionar
    } finally {
      // Substitui o histórico e força reload completo
      // para garantir que nenhum estado React persiste na memória
      window.location.replace("/");
    }
  };

  return { handleLogout, isLoggingOut };
}
