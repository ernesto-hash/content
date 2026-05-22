import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload, Film, Clock, TrendingUp, Eye, Heart } from "lucide-react";
import StudioLayout from "@/components/studio/StudioLayout";
import EmptyState from "@/components/studio/EmptyState";
import { supabase } from "@/lib/supabaseClient";

// ─── types ─────────────────────────────────────────────────────────────────────

type VideoRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string;
  thumbnail_url?: string | null;
  views?: number | null;
};

type Kpis = {
  totalVideos: number;
  published: number;
  drafts: number;
  totalViews: number;
  totalLikes: number;
};

// ─── helpers ───────────────────────────────────────────────────────────────────

function statusLabel(status: string | null) {
  const map: Record<string, { label: string; color: string }> = {
    published: { label: "Publicado",   color: "text-emerald-400"  },
    draft:     { label: "Rascunho",    color: "text-foreground/50" },
    private:   { label: "Privado",     color: "text-neon-purple"   },
    unlisted:  { label: "Não listado", color: "text-yellow-400"    },
  };
  return map[status ?? ""] ?? { label: status ?? "—", color: "text-foreground/50" };
}

// ─── component ─────────────────────────────────────────────────────────────────

export default function StudioDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState<string | null>(null);
  const [videos, setVideos]   = useState<VideoRow[]>([]);
  const [kpis, setKpis]       = useState<Kpis>({
    totalVideos: 0,
    published:   0,
    drafts:      0,
    totalViews:  0,
    totalLikes:  0,
  });

  const lastVideos = useMemo(() => videos.slice(0, 5), [videos]);

  // ── fetchData ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (uid: string) => {

    // 1. Vídeos — só colunas que existem na tua tabela
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .select("id, title, status, created_at, thumbnail_url, views")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (videoError) {
      console.error("[Dashboard] Erro vídeos:", videoError.message);
      setLoading(false);
      return;
    }

    const list = (videoData ?? []) as VideoRow[];
    setVideos(list);

    const totalVideos = list.length;
    const published   = list.filter((v) => v.status === "published").length;
    const drafts      = list.filter((v) => v.status === "draft").length;

    // 2. Views — soma coluna `views` da tabela videos (se existir e tiver valor)
    let totalViews = list.reduce((acc, v) => acc + (v.views ?? 0), 0);

    // Se a coluna views estiver sempre 0 ou null, tenta contar em `interacoes`
    if (totalViews === 0 && list.length > 0) {
      const ids = list.map((v) => v.id);
      const { data: intData, error: intError } = await supabase
        .from("interacoes")
        .select("id")
        .in("video_id", ids)
        .eq("tipo", "view");

      if (!intError) totalViews = intData?.length ?? 0;
    }

    // 3. Likes — tabela `video_likes`
    let totalLikes = 0;
    if (list.length > 0) {
      const ids = list.map((v) => v.id);
      const { count, error: likeError } = await supabase
        .from("video_likes")
        .select("*", { count: "exact", head: true })
        .in("video_id", ids);

      if (!likeError) totalLikes = count ?? 0;
    }

    setKpis({ totalVideos, published, drafts, totalViews, totalLikes });
    setLoading(false);
  }, []);

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id ?? null);
    });
  }, []);

  // ── 2. Fetch inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchData(userId);
  }, [userId, fetchData]);

  // ── 3. Realtime — só activo se o WebSocket ligar com sucesso ───────────────
  useEffect(() => {
    if (!userId) return;

    const refresh = () => fetchData(userId);

    // Tenta subscrever — se o WebSocket falhar, o fetch inicial já mostrou os dados
    const videosCh = supabase
      .channel("dash-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, refresh)
      .subscribe();

    const likesCh = supabase
      .channel("dash-likes")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_likes" }, refresh)
      .subscribe();

    const interacoesCh = supabase
      .channel("dash-interacoes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "interacoes" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(videosCh);
      supabase.removeChannel(likesCh);
      supabase.removeChannel(interacoesCh);
    };
  }, [userId, fetchData]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <StudioLayout subtitle={t("studio.dashboard.subtitle")}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-foreground">{t("studio.dashboard.title")}</h1>
            <p className="text-sm text-foreground/50 mt-1">
              {t("studio.dashboard.desc")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/studio/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              <Upload size={16} /> {t("studio.common.uploadBtn")}
            </Link>
            <Link
              to="/studio/videos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground/80 text-sm hover:text-neon-pink hover:bg-white/10 transition-all"
            >
              <Film size={16} /> {t("studio.dashboard.manageBtn")}
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <KpiCard title={t("studio.dashboard.kpi.totalVideos")} value={loading ? "…" : String(kpis.totalVideos)} icon={<Film size={18} />} />
          <KpiCard title={t("studio.dashboard.kpi.published")}   value={loading ? "…" : String(kpis.published)}   icon={<TrendingUp size={18} />} highlight />
          <KpiCard title={t("studio.dashboard.kpi.drafts")}      value={loading ? "…" : String(kpis.drafts)}      icon={<Clock size={18} />} />
          <KpiCard title={t("studio.dashboard.kpi.totalViews")}  value={loading ? "…" : String(kpis.totalViews)}  icon={<Eye size={18} />} />
          <KpiCard title={t("studio.dashboard.kpi.totalLikes")}  value={loading ? "…" : String(kpis.totalLikes)}  icon={<Heart size={18} />} />
        </div>

        {/* Lista recente */}
        <div className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">{t("studio.dashboard.recent.title")}</div>
              <div className="text-xs text-foreground/40">{t("studio.dashboard.recent.desc")}</div>
            </div>
            <Link to="/studio/videos" className="text-sm text-foreground/70 hover:text-neon-pink transition-colors">
              {t("studio.dashboard.recent.viewAll")}
            </Link>
          </div>

          <div className="p-4">
            {!loading && lastVideos.length === 0 ? (
              <EmptyState
                title={t("studio.dashboard.recent.emptyTitle")}
                description={t("studio.dashboard.recent.emptyDesc")}
                icon={<Upload size={22} />}
                actionLabel={t("studio.common.uploadBtn")}
                actionTo="/studio/upload"
              />
            ) : (
              <div className="space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                  : lastVideos.map((v) => {
                      const { color } = statusLabel(v.status);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-10 rounded-xl bg-black/20 border border-white/10 overflow-hidden flex items-center justify-center text-foreground/30 flex-shrink-0">
                              {v.thumbnail_url
                                ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                : <Film size={14} />
                              }
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">
                                {v.title || t("studio.common.noTitle")}
                              </div>
                              <div className="text-xs mt-0.5 flex items-center gap-2">
                                <span className={color}>{t(`studio.status.${v.status ?? "draft"}`)}</span>
                                {(v.views ?? 0) > 0 && (
                                  <span className="text-foreground/40 flex items-center gap-1">
                                    <Eye size={10} /> {v.views}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link
                            to="/studio/videos"
                            className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground/70 hover:text-neon-pink hover:bg-white/10 transition-all flex-shrink-0"
                          >
                            {t("studio.dashboard.recent.manage")}
                          </Link>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        </div>

      </div>
    </StudioLayout>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  title, value, icon, highlight = false,
}: {
  title: string;
  value: string;
  icon: JSX.Element;
  highlight?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`glass border rounded-2xl p-4 ${highlight ? "border-neon-pink/30" : "border-white/10"}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-foreground/50">{title}</div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
          highlight
            ? "bg-neon-pink/10 border-neon-pink/20 text-neon-pink"
            : "bg-white/5 border-white/10 text-neon-pink"
        }`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 text-2xl font-black text-foreground">{value}</div>
      <div className="mt-1 text-xs text-foreground/40">{t("studio.dashboard.kpi.realtime")}</div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-14 h-10 rounded-xl bg-white/10" />
        <div className="flex-1">
          <div className="h-3 w-2/3 bg-white/10 rounded" />
          <div className="h-3 w-1/3 bg-white/10 rounded mt-2" />
        </div>
        <div className="h-8 w-20 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}