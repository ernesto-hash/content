/**
 * RoleProtectedRoute.tsx
 *
 * Guard de rota com dupla verificação:
 *   1. Autenticação (getUser() — server-side)
 *   2. Role mínimo requerido (query à tabela profiles)
 *
 * Uso:
 *   <RoleProtectedRoute minRole="creator">
 *     <StudioDashboard />
 *   </RoleProtectedRoute>
 *
 * Comportamento:
 *   - Não autenticado → redirect /login
 *   - Autenticado mas sem role suficiente → redirect /unauthorized (ou /dashboard)
 *   - Role válido → renderiza filho
 */

import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { type UserRole, hasMinRole } from "@/lib/rbac";

type RouteStatus = "checking" | "allowed" | "no_auth" | "no_role";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  minRole: UserRole;
  /** Rota de redirect se não autenticado. Padrão: "/login" */
  authRedirect?: string;
  /** Rota de redirect se autenticado mas sem role. Padrão: "/dashboard" */
  roleRedirect?: string;
}

export default function RoleProtectedRoute({
  children,
  minRole,
  authRedirect  = "/login",
  roleRedirect  = "/dashboard",
}: RoleProtectedRouteProps) {
  const location = useLocation();
  const [status, setStatus] = useState<RouteStatus>("checking");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function check() {
      try {
        // Passo 1: autenticação server-side
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (cancelledRef.current) return;

        if (authError || !authData.user) {
          setStatus("no_auth");
          return;
        }

        // Passo 2: role na BD (nunca confiar no JWT/localStorage)
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (cancelledRef.current) return;

        if (error || !data) {
          // Sem perfil — trata como "user"
          setStatus(hasMinRole("user", minRole) ? "allowed" : "no_role");
          return;
        }

        const userRole = (data.role as string) === "creator" || (data.role as string) === "admin"
          ? (data.role as UserRole)
          : "user" as UserRole;

        setStatus(hasMinRole(userRole, minRole) ? "allowed" : "no_role");

      } catch {
        if (!cancelledRef.current) setStatus("no_auth");
      }
    }

    check();
    return () => { cancelledRef.current = true; };
  }, [minRole]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple" />
      </div>
    );
  }

  if (status === "no_auth") {
    return <Navigate to={authRedirect} state={{ from: location.pathname }} replace />;
  }

  if (status === "no_role") {
    return <Navigate to={roleRedirect} replace />;
  }

  return <>{children}</>;
}
