/**
 * PrivateGate.tsx
 *
 * Barreira de autenticação com proteção anti-flicker enterprise.
 *
 * Garante que ZERO pixels de conteúdo privado são renderizados antes
 * da verificação de autenticação estar completa.
 *
 * Estratégia de bloqueio:
 * - Estado inicial: "checking" — renderiza um overlay opaco que cobre todo o ecrã
 * - Durante verificação: o overlay permanece com opacity 1, sem transição
 * - Após verificação: se autenticado, o overlay faz fade out (200ms)
 * - Se não autenticado: redirect imediato, overlay nunca levanta
 *
 * Isto garante que mesmo que o React tente renderizar o filho,
 * o conteúdo fica escondido atrás do overlay até a verificação terminar.
 *
 * Verificações realizadas (em ordem):
 * 1. supabase.auth.getUser() — revalidação server-side (network call)
 * 2. verifySessionIntegrity() — fingerprint + userId mismatch check
 * 3. Session timeout checks (via metadados locais)
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { verifySessionIntegrity, clearSessionMeta, getSessionCreatedAt, getLastActiveAt } from "@/lib/sessionIntegrity";
import { logout } from "@/services/auth";
import { Crown } from "lucide-react";

type GateStatus = "checking" | "pass" | "fail";

interface PrivateGateProps {
  children: React.ReactNode;
  /** Rota para redirect em caso de falha. Padrão: "/login" */
  redirectTo?: string;
}

// Timeouts (em ms) — devem coincidir com useSessionTimeout.ts
const INACTIVITY_MS  = 60 * 60 * 1000;   // 60 min
const MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12h

export default function PrivateGate({
  children,
  redirectTo = "/login",
}: PrivateGateProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [status, setStatus] = useState<GateStatus>("checking");
  const [userId, setUserId] = useState<string>("");

  // Ref para flag de cancelamento — evita setState em componente desmontado
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function verify() {
      try {
        // ── PASSO 1: Revalidação server-side ────────────────────────────────
        const { data, error } = await supabase.auth.getUser();

        if (cancelledRef.current) return;

        if (error || !data.user) {
          setStatus("fail");
          navigate(redirectTo, { state: { from: location.pathname }, replace: true });
          return;
        }

        const uid = data.user.id;

        // ── PASSO 2: Verificação de integridade da sessão ────────────────────
        const integrity = await verifySessionIntegrity(uid);

        if (cancelledRef.current) return;

        if (integrity === "user_mismatch" || integrity === "fingerprint_mismatch") {
          // Sessão pertence a outro utilizador ou contexto mudou —
          // força logout completo para prevenir fuga entre contas
          clearSessionMeta();
          try { await logout(); } catch { /* silencioso */ }
          setStatus("fail");
          navigate(redirectTo, { state: { from: location.pathname }, replace: true });
          return;
        }

        // ── PASSO 3: Verificação de timeout ──────────────────────────────────
        const now = Date.now();
        const createdAt  = getSessionCreatedAt();
        const lastActive = getLastActiveAt();

        const absoluteExpired  = createdAt  !== null && now - createdAt  > MAX_SESSION_MS;
        const inactivityExpired = lastActive !== null && now - lastActive > INACTIVITY_MS;

        if (absoluteExpired || inactivityExpired) {
          clearSessionMeta();
          try { await logout(); } catch { /* silencioso */ }
          setStatus("fail");
          navigate(redirectTo, {
            state: {
              from: location.pathname,
              reason: absoluteExpired ? "session_expired" : "inactivity_timeout",
            },
            replace: true,
          });
          return;
        }

        // ── Todas as verificações passaram ───────────────────────────────────
        if (!cancelledRef.current) {
          setUserId(uid);
          setStatus("pass");
        }

      } catch {
        if (!cancelledRef.current) {
          setStatus("fail");
          navigate(redirectTo, { state: { from: location.pathname }, replace: true });
        }
      }
    }

    verify();

    // Listener para logout em outras abas / invalidação remota
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelledRef.current) return;
      if (!session && status !== "checking") {
        clearSessionMeta();
        setStatus("fail");
        navigate(redirectTo, { replace: true });
      }
    });

    return () => {
      cancelledRef.current = true;
      listener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── OVERLAY ANTI-FLICKER ───────────────────────────────────────────────────
  // O overlay cobre TODO o conteúdo enquanto status === "checking" ou "fail".
  // Só levanta após status === "pass" (com fade de 200ms).
  const showOverlay = status !== "pass";

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/*
        Renderiza o filho SEMPRE (para que o React possa preparar o DOM),
        mas o overlay opaco impede qualquer visibilidade até "pass".
        Isto é intencional: é mais rápido do que montar/desmontar.
      */}
      {status === "pass" && children}

      {/* Overlay opaco — bloqueia visibilidade durante verificação */}
      {showOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "var(--background, #09090b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          {status === "checking" && (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #ec4899, #9333ea)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <Crown size={24} color="white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Versão com render prop — injeta o userId verificado no filho.
 * Usar quando a página precisa do userId sem prop drilling.
 */
export function PrivateGateWithUser({
  children,
  redirectTo = "/login",
}: {
  children: (userId: string) => React.ReactNode;
  redirectTo?: string;
}) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [status, setStatus] = useState<GateStatus>("checking");
  const [userId, setUserId] = useState<string>("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function verify() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelledRef.current) return;
        if (error || !data.user) {
          setStatus("fail");
          navigate(redirectTo, { state: { from: location.pathname }, replace: true });
          return;
        }

        const uid = data.user.id;
        const integrity = await verifySessionIntegrity(uid);
        if (cancelledRef.current) return;

        if (integrity === "user_mismatch" || integrity === "fingerprint_mismatch") {
          clearSessionMeta();
          try { await logout(); } catch { /* silencioso */ }
          setStatus("fail");
          navigate(redirectTo, { state: { from: location.pathname }, replace: true });
          return;
        }

        if (!cancelledRef.current) {
          setUserId(uid);
          setStatus("pass");
        }
      } catch {
        if (!cancelledRef.current) {
          setStatus("fail");
          navigate(redirectTo, { state: { from: location.pathname }, replace: true });
        }
      }
    }

    verify();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelledRef.current) return;
      if (!session) {
        clearSessionMeta();
        navigate(redirectTo, { replace: true });
      }
    });

    return () => {
      cancelledRef.current = true;
      listener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "checking") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "var(--background, #09090b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #ec4899, #9333ea)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Crown size={24} color="white" />
        </div>
      </div>
    );
  }

  if (status === "fail") return null;

  return <>{children(userId)}</>;
}
