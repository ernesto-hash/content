// client/components/GaleriaPlano.tsx
// Auth + subscription guard; delegates rendering to the 3 plan layout components.

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { Crown } from "lucide-react";
import GaleriaNormalLayout    from "@/components/layouts/GaleriaNormalLayout";
import GaleriaExclusivoLayout from "@/components/layouts/GaleriaExclusivoLayout";
import GaleriaRaroLayout      from "@/components/layouts/GaleriaRaroLayout";
import type { PlanoNome, Pack } from "@/components/layouts/types";

// ─────────────────────────────────────────────
// Hierarquia de planos
// ─────────────────────────────────────────────
const PLANO_NIVEL: Record<PlanoNome, number> = { normal: 1, exclusivo: 2, raro: 3 };

// ─────────────────────────────────────────────
// Loading spinner
// ─────────────────────────────────────────────
function LoadingSpinner({ corPrimaria }: { corPrimaria: string }) {
  return (
    <LayoutAuthenticated>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: `linear-gradient(135deg,${corPrimaria},#9333ea)` }}
        >
          <Crown size={24} className="text-white" />
        </div>
      </div>
    </LayoutAuthenticated>
  );
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
export interface GaleriaPlanoProps {
  planoRequerido: PlanoNome;
  etiquetaFiltro: "Normal" | "Exclusivo" | "Raro";
  corPrimaria:    string;
  titulo?:        string;
  corGradiente?:  string;
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function GaleriaPlano({
  planoRequerido,
  etiquetaFiltro,
  corPrimaria,
}: GaleriaPlanoProps) {
  const navigate = useNavigate();

  const [loadingAuth,   setLoadingAuth]   = useState(true);
  const [authChecked,   setAuthChecked]   = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [planoUser,  setPlanoUser]  = useState<PlanoNome | null>(null);
  const [subChecked, setSubChecked] = useState(false);
  const [subActivo,  setSubActivo]  = useState(false);

  const [packs,        setPacks]        = useState<Pack[]>([]);
  const [packsLoading, setPacksLoading] = useState(false);

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) {
        setCurrentUserId(uid);
        setAuthChecked(true);
      }
      setLoadingAuth(false);
    });
  }, []);

  // ── 2. Subscription check ────────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked || !currentUserId) return;

    supabase
      .from("galeria_subscricoes")
      .select("status, plano, periodo_fim, trial_fim")
      .eq("user_id", currentUserId)
      .in("status", ["active", "trial"])
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setSubChecked(true); return; }
        const now     = new Date();
        const fimOk   = data.periodo_fim ? new Date(data.periodo_fim) > now : true;
        const trialOk = data.trial_fim   ? new Date(data.trial_fim)   > now : true;
        const valido  =
          (data.status === "active" && fimOk) ||
          (data.status === "trial"  && trialOk);
        if (valido && data.plano) {
          setSubActivo(true);
          setPlanoUser(data.plano as PlanoNome);
        }
        setSubChecked(true);
      });
  }, [authChecked, currentUserId]);

  // ── 3. Access check → redirect ───────────────────────────────────────────
  useEffect(() => {
    if (!subChecked) return;
    if (!subActivo || !planoUser) {
      navigate("/app/galeria?upgrade=true", { replace: true });
      return;
    }
    if (PLANO_NIVEL[planoUser] < PLANO_NIVEL[planoRequerido]) {
      navigate("/app/galeria?upgrade=true", { replace: true });
    }
  }, [subChecked, subActivo, planoUser, planoRequerido, navigate]);

  // ── 4. Fetch packs ───────────────────────────────────────────────────────
  const fetchPacks = useCallback(async () => {
    setPacksLoading(true);
    const { data } = await supabase
      .from("galeria_packs")
      .select("*")
      .eq("etiqueta", etiquetaFiltro)
      .order("created_at", { ascending: false });
    setPacks((data ?? []) as Pack[]);
    setPacksLoading(false);
  }, [etiquetaFiltro]);

  useEffect(() => {
    if (subChecked && subActivo && planoUser && PLANO_NIVEL[planoUser] >= PLANO_NIVEL[planoRequerido]) {
      fetchPacks();
    }
  }, [subChecked, subActivo, planoUser, planoRequerido, fetchPacks]);

  // ── Loading / guard ──────────────────────────────────────────────────────
  const hasAccess = subChecked && subActivo && planoUser && PLANO_NIVEL[planoUser] >= PLANO_NIVEL[planoRequerido];
  const nivelUser = planoUser ? PLANO_NIVEL[planoUser] : 0;

  if (loadingAuth || !subChecked || !hasAccess) {
    return <LoadingSpinner corPrimaria={corPrimaria} />;
  }

  // ── Delegate rendering ───────────────────────────────────────────────────
  const layoutProps = { packs, packsLoading, planoUser, nivelUser };

  if (planoRequerido === "raro")      return <GaleriaRaroLayout      {...layoutProps} />;
  if (planoRequerido === "exclusivo") return <GaleriaExclusivoLayout {...layoutProps} />;
  return <GaleriaNormalLayout {...layoutProps} />;
}
