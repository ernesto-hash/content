// src/pages/Populares.tsx
// Página pública de vídeos populares — dados 100% reais do Supabase
//
// Ordenação:   views | likes (interacoes tipo=true) | recentes
// Período:     hoje | semana | mês | ano | todos
// Categoria:   dinâmica (vem da BD)
// Realtime:    atualiza views/likes em direto
// Paginação:   24 por página + "Carregar mais"

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Flame, Eye, Heart, MessageCircle, Clock, Play,
  Grid3x3, List, TrendingUp, SlidersHorizontal,
  Search, ChevronDown, Calendar, Zap, Award,
  Users, Sparkles, Loader2, Film, X, Filter,
  Star, Crown, VolumeX,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Video = {
  id: string;
  slug?: string | null;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  category: string | null;
  likes_count: number;
  comments_count: number;
  creator_name: string | null;
  creator_avatar: string | null;
};

type SortBy   = "views" | "likes" | "recentes";
type TimePeriod = "hoje" | "semana" | "mes" | "ano" | "todos";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs  = Math.floor(diff / 3600000);
  if (hrs < 1)  return "agora";
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `há ${days}d`;
  if (days < 30) return `há ${Math.floor(days / 7)}sem`;
  return `há ${Math.floor(days / 30)}mes`;
}
function getPeriodStart(period: TimePeriod): string | null {
  const now = new Date();
  switch (period) {
    case "hoje":   { const d = new Date(now); d.setHours(0,0,0,0); return d.toISOString(); }
    case "semana": { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    case "mes":    { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    case "ano":    { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); }
    default: return null;
  }
}

// Medalhas para os 3 primeiros
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[10px] font-black shadow-lg">
      <Award size={10} /> #1
    </span>
  );
  if (rank === 2) return (
    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 text-[10px] font-black">#2</span>
  );
  if (rank === 3) return (
    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-700 to-amber-800 text-white text-[10px] font-black">#3</span>
  );
  return (
    <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-black/60 text-white/70 text-[10px] font-bold backdrop-blur-sm">#{rank}</span>
  );
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

// ─────────────────────────────────────────────
// Card Grid
// ─────────────────────────────────────────────
function VideoGridCard({ video, rank }: { video: Video; rank: number }) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const holdTimerRef    = useRef<ReturnType<typeof setTimeout>>();
  const wasHoldRef      = useRef(false);

  useEffect(() => () => {
    clearTimeout(previewTimerRef.current);
    clearTimeout(holdTimerRef.current);
    if (videoRef.current) videoRef.current.src = "";
  }, []);

  const startPreview = () => {
    const vid = videoRef.current;
    if (!vid || !video.video_url) return;
    clearTimeout(previewTimerRef.current);
    vid.src = video.video_url;
    vid.currentTime = 0;
    vid.play().catch(() => {});
    setIsPreviewing(true);
    previewTimerRef.current = setTimeout(() => vid.pause(), 10_000);
  };
  const stopPreview = () => {
    const vid = videoRef.current;
    if (!vid) return;
    clearTimeout(previewTimerRef.current);
    vid.pause();
    vid.src = "";
    setIsPreviewing(false);
  };
  const handleMouseEnter = () => { if (!isTouchDevice()) startPreview(); };
  const handleMouseLeave = () => { if (!isTouchDevice()) stopPreview(); };
  const handleTouchStart = () => {
    wasHoldRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => { wasHoldRef.current = true; startPreview(); }, 300);
  };
  const handleTouchEnd = () => { clearTimeout(holdTimerRef.current); if (wasHoldRef.current) stopPreview(); };
  const handleClick = (e: React.MouseEvent) => {
    if (wasHoldRef.current) { e.preventDefault(); wasHoldRef.current = false; }
  };

  return (
    <Link
      to={`/video/${video.slug || video.id}`}
      className="group relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/8 hover:border-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/5 transition-all duration-300"
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black/20">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title ?? ""}
            className="w-full h-full object-cover"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}>
            <Film size={28} className="text-white/15" />
          </div>
        )}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />

        {/* Play hover */}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
            <div className="w-14 h-14 rounded-full bg-neon-pink/90 flex items-center justify-center shadow-xl shadow-neon-pink/30">
              <Play size={24} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}

        {isPreviewing && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={12} className="text-white" />
          </div>
        )}

        {/* Rank badge */}
        <RankBadge rank={rank} />

        {/* Duration */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            {fmtDuration(video.duration)}
          </span>
        )}

        {/* Trending tag */}
        {rank <= 3 && !isPreviewing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-neon-pink text-[9px] font-bold">
            <TrendingUp size={8} /> Em alta
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2.5">
        {/* Criador */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {video.creator_avatar
              ? <img src={video.creator_avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Users size={10} className="text-white/30" /></div>
            }
          </div>
          <span className="text-[11px] text-foreground/50 truncate">
            {video.creator_name ?? "Criador"}
          </span>
        </div>

        {/* Título */}
        <h3 className="font-semibold text-sm text-foreground/85 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
          {video.title || "Sem título"}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-foreground/40">
          <span className="flex items-center gap-1"><Eye size={11} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink/60" />{fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1"><MessageCircle size={11} />{fmtNum(video.comments_count)}</span>
        </div>

        {/* Categoria + data */}
        <div className="flex items-center gap-2">
          {video.category && (
            <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-foreground/40 capitalize border border-white/6">
              {video.category}
            </span>
          )}
          <span className="text-[10px] text-foreground/28 ml-auto">{fmtRelative(video.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Card List
// ─────────────────────────────────────────────
function VideoListCard({ video, rank }: { video: Video; rank: number }) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const holdTimerRef    = useRef<ReturnType<typeof setTimeout>>();
  const wasHoldRef      = useRef(false);

  useEffect(() => () => {
    clearTimeout(previewTimerRef.current);
    clearTimeout(holdTimerRef.current);
    if (videoRef.current) videoRef.current.src = "";
  }, []);

  const startPreview = () => {
    const vid = videoRef.current;
    if (!vid || !video.video_url) return;
    clearTimeout(previewTimerRef.current);
    vid.src = video.video_url;
    vid.currentTime = 0;
    vid.play().catch(() => {});
    setIsPreviewing(true);
    previewTimerRef.current = setTimeout(() => vid.pause(), 10_000);
  };
  const stopPreview = () => {
    const vid = videoRef.current;
    if (!vid) return;
    clearTimeout(previewTimerRef.current);
    vid.pause();
    vid.src = "";
    setIsPreviewing(false);
  };
  const handleMouseEnter = () => { if (!isTouchDevice()) startPreview(); };
  const handleMouseLeave = () => { if (!isTouchDevice()) stopPreview(); };
  const handleTouchStart = () => {
    wasHoldRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => { wasHoldRef.current = true; startPreview(); }, 300);
  };
  const handleTouchEnd = () => { clearTimeout(holdTimerRef.current); if (wasHoldRef.current) stopPreview(); };
  const handleClick = (e: React.MouseEvent) => {
    if (wasHoldRef.current) { e.preventDefault(); wasHoldRef.current = false; }
  };

  return (
    <Link
      to={`/video/${video.slug || video.id}`}
      className="group flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-neon-pink/25 hover:bg-white/[0.05] transition-all"
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative w-44 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt=""
            className="w-full h-full object-cover"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}>
            <Film size={18} className="text-white/15" />
          </div>
        )}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <div className="w-9 h-9 rounded-full bg-neon-pink/90 flex items-center justify-center">
              <Play size={14} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {isPreviewing && (
          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={10} className="text-white" />
          </div>
        )}
        <RankBadge rank={rank} />
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
            {fmtDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
        <h3 className="font-semibold text-sm text-foreground/85 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
          {video.title || "Sem título"}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-foreground/40">
          {video.creator_avatar && (
            <img src={video.creator_avatar} alt="" className="w-4 h-4 rounded-full" />
          )}
          <span className="truncate">{video.creator_name ?? "Criador"}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-foreground/38">
          <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(video.views)} views</span>
          <span className="flex items-center gap-1"><Heart size={10} className="text-neon-pink/55" />{fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1"><MessageCircle size={10} />{fmtNum(video.comments_count)}</span>
          <span className="ml-auto text-foreground/25">{fmtRelative(video.created_at)}</span>
        </div>

        {video.category && (
          <span className="inline-block text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-foreground/38 capitalize border border-white/6">
            {video.category}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/8 animate-pulse overflow-hidden">
          <div className="aspect-video bg-white/5" />
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/8" />
              <div className="h-2.5 bg-white/8 rounded w-20" />
            </div>
            <div className="h-3.5 bg-white/8 rounded w-full" />
            <div className="h-3.5 bg-white/8 rounded w-2/3" />
            <div className="flex gap-3">
              <div className="h-2.5 bg-white/8 rounded w-12" />
              <div className="h-2.5 bg-white/8 rounded w-12" />
              <div className="h-2.5 bg-white/8 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const PAGE_SIZE = 24;

export default function PopularesPage() {
  useDocumentTitle({ title: "Vídeos Populares - SuckOrSex" });

  const [videos, setVideos]           = useState<Video[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount]   = useState(0);
  const [page, setPage]               = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  const [totalViews, setTotalViews]   = useState(0);
  const [totalLikes, setTotalLikes]   = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm]       = useState("");
  const [dSearch, setDSearch]             = useState("");
  const [sortBy, setSortBy]               = useState<SortBy>("views");
  const [timePeriod, setTimePeriod]       = useState<TimePeriod>("todos");
  const [selectedCat, setSelectedCat]     = useState("todas");
  const [showFilters, setShowFilters]     = useState(false);
  const [viewMode, setViewMode]           = useState<"grid" | "list">("grid");
  const [availableCats, setAvailableCats] = useState<string[]>([]);

  const debRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce pesquisa
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDSearch(searchTerm), 400);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [searchTerm]);

  // Categorias disponíveis
  useEffect(() => {
    supabase.from("videos").select("category")
      .eq("status", "published").eq("visibility", "public").not("category", "is", null)
       .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((v: any) => v.category as string))].filter(Boolean).sort();
        setAvailableCats(unique as string[]);
      });
  }, []);

  // Fetch vídeos
  const fetchVideos = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setLoading(true); else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;
    const periodStart = getPeriodStart(timePeriod);

    let q = supabase.from("videos")
      .select("id, slug, title, thumbnail_url, video_url, views, duration, created_at, category, user_id", { count: "exact" })
      .eq("status", "published").eq("visibility", "public")
      .range(from, to);

    if (dSearch.trim()) q = q.ilike("title", `%${dSearch.trim()}%`);
    if (selectedCat !== "todas") q = q.ilike("category", selectedCat);
    if (periodStart) q = q.gte("created_at", periodStart);

    // Ordenação DB-level quando possível
    if (sortBy === "views")    q = q.order("views", { ascending: false });
    if (sortBy === "recentes") q = q.order("created_at", { ascending: false });
    if (sortBy === "likes")    q = q.order("created_at", { ascending: false }); // ordenamos client-side depois

    const { data, count } = await q;
    if (!data) { setLoading(false); setLoadingMore(false); return; }

    const vids = data as any[];

    // Enriquecer com likes, comments e criador
    const enriched: Video[] = await Promise.all(
      vids.map(async (v) => {
        const [lkRes, cmRes, profRes] = await Promise.all([
          supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("video_id", v.id).eq("tipo", true),
          supabase.from("comentarios").select("*", { count: "exact", head: true }).eq("video_id", v.id),
          supabase.from("profiles_public").select("username, full_name, avatar_url").eq("id", v.user_id).maybeSingle(),
        ]);
        const prof = profRes.data as any;
        return {
          id:             v.id,
          title:          v.title,
          thumbnail_url:  v.thumbnail_url,
          video_url:      v.video_url ?? null,
          views:          v.views ?? 0,
          duration:       v.duration ?? null,
          created_at:     v.created_at,
          category:       v.category,
          likes_count:    lkRes.count ?? 0,
          comments_count: cmRes.count ?? 0,
          creator_name:   prof?.full_name ?? prof?.username ?? null,
          creator_avatar: prof?.avatar_url ?? null,
        };
      })
    );

    // Ordenar por likes client-side
    const sorted = sortBy === "likes"
      ? [...enriched].sort((a, b) => b.likes_count - a.likes_count)
      : enriched;

    const total = count ?? 0;
    setTotalCount(total);
    setHasMore(from + sorted.length < total);
    setVideos(replace ? sorted : (prev) => [...prev, ...sorted]);

    // Stats globais (só na primeira carga)
    if (replace) {
      const { data: allViews } = await supabase.from("videos").select("views")
        .eq("status", "published").eq("visibility", "public");
      const tv = ((allViews ?? []) as any[]).reduce((a: number, v: any) => a + (v.views ?? 0), 0);
      setTotalViews(tv);

      const { count: tl } = await supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("tipo", true);
      setTotalLikes(tl ?? 0);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [dSearch, sortBy, timePeriod, selectedCat]);

  useEffect(() => { setPage(0); fetchVideos(0, true); }, [fetchVideos]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("populares-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" },
        () => { setPage(0); fetchVideos(0, true); })
      .on("postgres_changes", { event: "*", schema: "public", table: "interacoes" },
        () => { setPage(0); fetchVideos(0, true); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchVideos]);

  const activeFilters = [
    timePeriod !== "todos",
    selectedCat !== "todas",
  ].filter(Boolean).length;

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-purple/15">
                <Flame className="text-neon-pink" size={26} />
              </div>
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                Vídeos Populares
              </span>
            </h1>
            <p className="text-foreground/48 text-sm">
              Os vídeos mais assistidos e curtidos da plataforma
            </p>
          </div>

          {/* Controlos */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pesquisa */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-neon-pink/30 w-48 text-foreground placeholder:text-foreground/28"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/28 hover:text-foreground/60">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* View mode */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/45 hover:text-neon-pink"}`}>
                <Grid3x3 size={15} />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/45 hover:text-neon-pink"}`}>
                <List size={15} />
              </button>
            </div>

            {/* Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                showFilters || activeFilters > 0
                  ? "bg-neon-pink text-white border-neon-pink shadow-md shadow-neon-pink/20"
                  : "bg-white/5 border-white/10 text-foreground/55 hover:text-neon-pink"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-neon-pink text-[9px] flex items-center justify-center font-black">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Ordenação rápida ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-foreground/35 font-medium">Ordenar:</span>
          {([
            ["views",    "Mais Vistos",   Eye],
            ["likes",    "Mais Curtidos", Heart],
            ["recentes", "Recentes",      Sparkles],
          ] as [SortBy, string, React.ElementType][]).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                sortBy === val
                  ? "bg-neon-pink/12 border-neon-pink/35 text-neon-pink"
                  : "bg-white/5 border-white/10 text-foreground/48 hover:border-white/20"
              }`}
            >
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        {/* ── Painel de filtros ── */}
        {showFilters && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-5">

            {/* Período */}
            <div>
              <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-neon-pink rounded-full" /><Calendar size={12} /> Período
              </h3>
              <div className="flex flex-wrap gap-2">
                {([
                  ["hoje",   "Hoje"],
                  ["semana", "Esta semana"],
                  ["mes",    "Este mês"],
                  ["ano",    "Este ano"],
                  ["todos",  "Todos os tempos"],
                ] as [TimePeriod, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setTimePeriod(val)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      timePeriod === val
                        ? "bg-neon-pink/12 border-neon-pink/35 text-neon-pink"
                        : "bg-white/5 border-white/10 text-foreground/48 hover:border-white/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            {availableCats.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1 h-3 bg-neon-purple rounded-full" /><Sparkles size={12} /> Categoria
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCat("todas")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedCat === "todas"
                        ? "bg-neon-purple/12 border-neon-purple/35 text-neon-purple"
                        : "bg-white/5 border-white/10 text-foreground/48 hover:border-white/20"
                    }`}
                  >
                    Todas
                  </button>
                  {availableCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                        selectedCat === cat
                          ? "bg-neon-purple/12 border-neon-purple/35 text-neon-purple"
                          : "bg-white/5 border-white/10 text-foreground/48 hover:border-white/20"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Limpar */}
            {activeFilters > 0 && (
              <div className="flex justify-end pt-1 border-t border-white/6">
                <button
                  onClick={() => { setTimePeriod("todos"); setSelectedCat("todas"); }}
                  className="flex items-center gap-1.5 text-xs text-foreground/38 hover:text-neon-pink transition-colors"
                >
                  <X size={11} /> Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Stats bar ── */}
        {!loading && (
          <div className="flex items-center justify-between text-xs text-foreground/40 px-0.5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-neon-pink" />
                <span className="font-bold text-foreground/65">{fmtNum(totalViews)}</span> visualizações totais
              </span>
              <span className="flex items-center gap-1.5">
                <Heart size={13} className="text-neon-pink" />
                <span className="font-bold text-foreground/65">{fmtNum(totalLikes)}</span> gostos
              </span>
            </div>
            <span>{fmtNum(totalCount)} vídeo{totalCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* ── Conteúdo ── */}
        {loading ? (
          <SkeletonGrid />
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Flame size={28} className="text-foreground/18" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/55 font-semibold">Nenhum vídeo encontrado</p>
              <p className="text-foreground/30 text-sm">{dSearch ? "Tenta uma pesquisa diferente." : "Ajusta os filtros para ver mais resultados."}</p>
            </div>
            <button
              onClick={() => { setSearchTerm(""); setTimePeriod("todos"); setSelectedCat("todas"); }}
              className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((v, i) => <VideoGridCard key={v.id} video={v} rank={i + 1} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((v, i) => <VideoListCard key={v.id} video={v} rank={i + 1} />)}
          </div>
        )}

        {/* ── Carregar mais ── */}
        {hasMore && !loading && videos.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => { const next = page + 1; setPage(next); fetchVideos(next, false); }}
              disabled={loadingMore}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground/65 text-sm font-semibold hover:bg-white/8 hover:border-white/20 hover:text-foreground transition-all disabled:opacity-50"
            >
              {loadingMore ? <><Loader2 size={15} className="animate-spin" />A carregar...</> : <><ChevronDown size={15} />Carregar mais vídeos</>}
            </button>
          </div>
        )}

        {/* Contador */}
        {!loading && videos.length > 0 && (
          <p className="text-center text-xs text-foreground/22 pb-2">
            A mostrar {videos.length} de {fmtNum(totalCount)} vídeo{totalCount !== 1 ? "s" : ""}
          </p>
        )}

      </div>
    </Layout>
  );
}