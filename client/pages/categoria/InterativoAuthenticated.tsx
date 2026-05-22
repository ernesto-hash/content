// src/pages/categoria/InterativoAuthenticated.tsx
// Categoria: Interativo — slug BD: "interativo"
// Layout: LayoutAuthenticated (requer login)

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  MousePointer2, Eye, Heart, Play, Search,
  ChevronRight, Loader2, Film, SlidersHorizontal, AlertCircle,
} from "lucide-react";
import VideoCard from "@/components/VideoCard";

type Video = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  likes_count: number;
  duration: number | null;
  created_at: string;
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}



export default function InterativoAuthenticatedPage() {
  const { t } = useTranslation();
  const CATEGORY_KEY = "interativo";
  const [videos, setVideos]       = useState<Video[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [query, setQuery]         = useState("");
  const [sort, setSort]           = useState<"recentes" | "views" | "likes">("recentes");

  // ── Redirect se não autenticado ───────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
      }
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: vids, error: fetchError } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, video_url, views, duration, created_at, status, visibility, category")
      .ilike("category", "interativo")
      .order("created_at", { ascending: false })
      .limit(200);

    if (fetchError) {
      setError(`Erro ao carregar vídeos: ${fetchError.message}`);
      setLoading(false);
      return;
    }

    if (!vids || vids.length === 0) {
      const { data: sample } = await supabase
        .from("videos").select("id, category, status, visibility").limit(10);
      const info = sample?.length
        ? `Nenhum vídeo com category~="interativo".\nÚltimos registos: ${JSON.stringify(sample.map((v: any) => ({ category: v.category, status: v.status, visibility: v.visibility })), null, 2)}`
        : "Tabela videos vazia ou sem acesso (verificar RLS).";
      setDebugInfo((import.meta as any).env?.DEV ? info : null);
      setVideos([]);
      setLoading(false);
      return;
    }

    const publishedVids = (vids as any[]).filter(
      (v) => v.status === "published" && v.visibility === "public"
    );

    if (publishedVids.length === 0) {
      const info = `${vids.length} vídeo(s) com category~="interativo" mas nenhum é published+public.\n${JSON.stringify(vids.map((v: any) => ({ status: v.status, visibility: v.visibility })), null, 2)}`;
      setDebugInfo((import.meta as any).env?.DEV ? info : null);
      setVideos([]);
      setLoading(false);
      return;
    }

    const withLikes: Video[] = await Promise.all(
      publishedVids.map(async (v: any) => {
        const { count } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", v.id);
        return {
          id: v.id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          video_url: v.video_url ?? null,
          views: Number(v.views) || 0,
          duration: v.duration ?? null,
          created_at: v.created_at,
          likes_count: count ?? 0,
        };
      })
    );

    setDebugInfo(null);
    setVideos(withLikes);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ch1 = supabase.channel("interativo-auth-videos-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" },
        (payload) => {
          const rec = (payload.new ?? payload.old) as any;
          if (!rec?.category || (rec.category as string).toLowerCase().trim() === "interativo") fetchData();
        }
      ).subscribe();

    const ch2 = supabase.channel("interativo-auth-likes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_likes" },
        () => fetchData()
      ).subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [fetchData]);

  const displayed = useMemo(() => {
    let list = [...videos];
    if (query.trim()) list = list.filter((v) => (v.title ?? "").toLowerCase().includes(query.toLowerCase()));
    if (sort === "views")      list.sort((a, b) => b.views - a.views);
    else if (sort === "likes") list.sort((a, b) => b.likes_count - a.likes_count);
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [videos, query, sort]);

  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-400/20 via-fuchsia-600/10 to-transparent border border-purple-400/25 p-8">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <MousePointer2 size={20} className="text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-600 bg-clip-text text-transparent">
                  {t(`pages.category.list.${CATEGORY_KEY}.title`)}
                </h1>
              </div>
              <p className="text-foreground/60 text-sm max-w-md">{t(`pages.category.list.${CATEGORY_KEY}.desc`)}</p>
            </div>
            <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-foreground">{loading ? "—" : fmtNum(displayed.length)}</p>
              <p className="text-xs text-foreground/45 mt-0.5">{t("pages.category.countUnit")}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-foreground/40 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pages.category.searchIn", { name: t(`pages.category.list.${CATEGORY_KEY}.title`) })}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30" />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-foreground/40" />
            {([
              ["recentes", t("pages.category.sort.recentes")],
              ["views",    t("pages.category.sort.views")],
              ["likes",    t("pages.category.sort.likes")],
            ] as const).map(([s, label]) => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  sort === s
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-foreground/55 hover:border-white/20"
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-0.5">{t("pages.category.errorTitle")}</p>
              <p className="text-red-400/70 text-xs">{error}</p>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-mono whitespace-pre-wrap break-all">
            <p className="font-bold mb-2 text-sm">⚠ Debug (apenas em DEV)</p>
            {debugInfo}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-foreground/40" />
            <p className="text-foreground/40 text-sm">{t("pages.category.loading")}</p>
          </div>
        ) : !error && displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <MousePointer2 size={28} className="text-foreground/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/60 font-medium">{t("pages.category.emptyTitle")}</p>
              <p className="text-foreground/35 text-sm max-w-xs">
                {t("pages.category.emptyDescAuto", { name: t(`pages.category.list.${CATEGORY_KEY}.title`) })}
              </p>
            </div>
            <Link to="/categorias" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-foreground/70 text-sm hover:bg-white/12 transition-all mt-2">
              {t("pages.category.exploreCategories")} <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}

      </div>
    </LayoutAuthenticated>
  );
}
