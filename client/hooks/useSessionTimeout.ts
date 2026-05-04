/**
 * useSessionTimeout.ts
 *
 * Timeout de sessão com duas estratégias:
 *
 * 1. INATIVIDADE: se o utilizador não interagir durante INACTIVITY_MINUTES,
 *    a sessão é invalidada.
 *
 * 2. ABSOLUTO: independentemente de atividade, a sessão expira após
 *    MAX_SESSION_HOURS. Previne sessões abertas indefinidamente.
 *
 * Eventos que resetam o timer de inatividade:
 *   mousemove, keydown, click, scroll, touchstart
 */

import { useEffect, useRef, useCallback } from "react";
import { touchLastActive, getLastActiveAt, getSessionCreatedAt } from "@/lib/sessionIntegrity";
import { logout } from "@/services/auth";

// Configuração de timeouts
const INACTIVITY_MINUTES = 60;      // logout após 60 min sem atividade
const MAX_SESSION_HOURS  = 12;      // logout absoluto após 12h, mesmo com atividade
const CHECK_INTERVAL_MS  = 60_000;  // verificar cada 60 segundos

const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;
const MAX_SESSION_MS = MAX_SESSION_HOURS * 60 * 60 * 1000;

interface UseSessionTimeoutOptions {
  /** Chamado quando a sessão expira — deve fazer logout e redirect */
  onExpire: () => void;
  /** Se false, o hook fica desativado (ex: em páginas públicas) */
  enabled?: boolean;
}

export function useSessionTimeout({
  onExpire,
  enabled = true,
}: UseSessionTimeoutOptions): void {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Regista atividade do utilizador e atualiza lastActive
  const handleActivity = useCallback(() => {
    touchLastActive();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Adiciona listeners de atividade
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    // Verificação periódica dos timeouts
    const interval = setInterval(async () => {
      const now = Date.now();

      // 1. Timeout absoluto
      const createdAt = getSessionCreatedAt();
      if (createdAt !== null && now - createdAt > MAX_SESSION_MS) {
        clearInterval(interval);
        try { await logout(); } catch { /* silencioso */ }
        onExpireRef.current();
        return;
      }

      // 2. Timeout por inatividade
      const lastActive = getLastActiveAt();
      if (lastActive !== null && now - lastActive > INACTIVITY_MS) {
        clearInterval(interval);
        try { await logout(); } catch { /* silencioso */ }
        onExpireRef.current();
        return;
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
    };
  }, [enabled, handleActivity]);
}
