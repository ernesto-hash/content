/**
 * AuthGuard — barreira de autenticação com revalidação server-side.
 *
 * Diferente do ProtectedRoute (que usa Navigate para redirect),
 * este componente é usado dentro de páginas que têm o seu próprio
 * layout e precisam de suprimir conteúdo até a verificação estar completa.
 *
 * Garante:
 * - Sem flicker de conteúdo privado
 * - Revalidação server-side via getUser()
 * - Redirect para /login preservando a rota tentada
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Crown } from "lucide-react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthGuardProps {
  children: (userId: string) => React.ReactNode;
  /** Opcional: spinner personalizado durante verificação */
  loadingFallback?: React.ReactNode;
}

export default function AuthGuard({ children, loadingFallback }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        // getUser() valida o JWT contra o servidor — não aceita tokens revogados
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !data.user) {
          setStatus("unauthenticated");
          navigate("/login", { state: { from: location.pathname }, replace: true });
          return;
        }

        setUserId(data.user.id);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setStatus("unauthenticated");
        navigate("/login", { state: { from: location.pathname }, replace: true });
      }
    }

    verify();

    // Listener para mudanças de sessão em tempo real
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        setStatus("unauthenticated");
        navigate("/login", { state: { from: location.pathname }, replace: true });
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") {
    return loadingFallback ? (
      <>{loadingFallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center animate-pulse">
          <Crown size={24} className="text-white" />
        </div>
      </div>
    );
  }

  // Nunca renderiza conteúdo se não autenticado
  if (status === "unauthenticated") return null;

  return <>{children(userId)}</>;
}
