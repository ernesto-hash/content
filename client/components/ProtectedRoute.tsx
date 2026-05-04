import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { verifySessionIntegrity, clearSessionMeta, getSessionCreatedAt, getLastActiveAt } from "@/lib/sessionIntegrity";
import { logout } from "@/services/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type Status = "loading" | "authenticated" | "unauthenticated";

// Deve coincidir com useSessionTimeout.ts
const INACTIVITY_MS  = 60 * 60 * 1000;    // 60 min
const MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12h

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location     = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function verify() {
      try {
        // 1. Revalidação server-side — rejeita tokens revogados
        const { data, error } = await supabase.auth.getUser();
        if (cancelledRef.current) return;

        if (error || !data.user) {
          setStatus("unauthenticated");
          return;
        }

        const uid = data.user.id;

        // 2. Integridade da sessão — fingerprint + userId mismatch
        const integrity = await verifySessionIntegrity(uid);
        if (cancelledRef.current) return;

        if (integrity === "user_mismatch" || integrity === "fingerprint_mismatch") {
          clearSessionMeta();
          try { await logout(); } catch { /* silencioso */ }
          setStatus("unauthenticated");
          return;
        }

        // 3. Timeout checks
        const now = Date.now();
        const createdAt   = getSessionCreatedAt();
        const lastActive  = getLastActiveAt();
        const absExpired  = createdAt  !== null && (now - createdAt)  > MAX_SESSION_MS;
        const idleExpired = lastActive !== null && (now - lastActive) > INACTIVITY_MS;

        if (absExpired || idleExpired) {
          clearSessionMeta();
          try { await logout(); } catch { /* silencioso */ }
          setStatus("unauthenticated");
          return;
        }

        if (!cancelledRef.current) setStatus("authenticated");

      } catch {
        if (!cancelledRef.current) setStatus("unauthenticated");
      }
    }

    verify();
    return () => { cancelledRef.current = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
