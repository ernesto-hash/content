import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import StudioLayout from "@/components/studio/StudioLayout";
import EmptyState from "@/components/studio/EmptyState";
import { supabase } from "@/lib/supabaseClient";

type Video = { id: string; title: string | null; views?: number | null; created_at: string };

export default function StudioAnalytics() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getSession();
      const user = auth?.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("videos")
        .select("id,title,views,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!isMounted) return;

      if (!error && data) setVideos(data as unknown as Video[]);
      else setVideos([]);

      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalViews = useMemo(() => videos.reduce((acc, v) => acc + (v.views || 0), 0), [videos]);

  const chartData = useMemo(() => {
    // gráfico simples: últimos 10 vídeos por views
    const slice = [...videos].reverse().slice(-10);
    const max = Math.max(1, ...slice.map((x) => x.views || 0));
    return slice.map((v) => ({
      label: (v.title || "Vídeo").slice(0, 10),
      value: v.views || 0,
      pct: ((v.views || 0) / max) * 100,
    }));
  }, [videos]);

  return (
    <StudioLayout subtitle="Métricas essenciais para decisões melhores">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black text-foreground">Estatísticas</h1>
          <p className="text-sm text-foreground/50 mt-1">Visão geral de desempenho (base: seus dados).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass border border-white/10 rounded-2xl p-4">
            <div className="text-xs text-foreground/50">Views totais</div>
            <div className="mt-2 text-2xl font-black text-foreground">{loading ? "…" : totalViews}</div>
            <div className="mt-1 text-xs text-foreground/40">Soma de views dos seus vídeos</div>
          </div>

          <div className="glass border border-white/10 rounded-2xl p-4">
            <div className="text-xs text-foreground/50">Vídeos analisados</div>
            <div className="mt-2 text-2xl font-black text-foreground">{loading ? "…" : videos.length}</div>
            <div className="mt-1 text-xs text-foreground/40">Últimos 20 no Studio</div>
          </div>

          <div className="glass border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-foreground/50">Sugestão</div>
              <TrendingUp size={18} className="text-neon-pink" />
            </div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              Publique com consistência
            </div>
            <div className="mt-1 text-xs text-foreground/40">
              Rotina forte + boa thumbnail + título claro = crescimento.
            </div>
          </div>
        </div>

        <div className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 size={16} className="text-neon-pink" /> Top recente (views)
          </div>

          <div className="p-4">
            {!loading && videos.length === 0 ? (
              <EmptyState
                title="Sem dados ainda"
                description="Envie vídeos para começar a gerar estatísticas."
                icon={<BarChart3 size={22} />}
                actionLabel="Enviar vídeo"
                actionTo="/studio/upload"
              />
            ) : (
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                  ))
                ) : (
                  chartData.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-foreground/60 truncate">{d.label}</div>
                      <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-pink to-neon-purple"
                          style={{ width: `${Math.max(3, d.pct)}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-xs text-foreground/70">{d.value}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}