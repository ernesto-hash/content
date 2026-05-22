// src/pages/Recomendados.tsx
// Página de recomendações para utilizadores SEM conta
//
// Perfil construído a partir de:
//   • Categorias dos vídeos abertos nesta sessão browser (video_views)
//   • Tempo assistido em cada vídeo (watch_pct)
//   • Pesquisas feitas (search_history)
//
// Tabs:
//   • Para si     — mix das categorias mais vistas + mais populares
//   • Do histórico — apenas categorias que viu
//   • Tendências   — mais vistos globalmente
//
// Se o utilizador ainda não viu nada → mostra os mais vistos
// com uma mensagem "Começa a ver vídeos para receber recomendações personalizadas"

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { useRecommendations, getSessionId, RecoTab } from "@/hooks/useRecommendations";
import {
  Sparkles, Eye, Heart, MessageCircle, Clock, Play,
  Grid3x3, List, Search, ChevronDown, ThumbsUp,
  Users, Film, Loader2, X, TrendingUp, History,
  Zap, Star, RefreshCw, VolumeX,
} from "lucide-react";

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
function fmtRelative(iso: string, t: (key: string, opts?: object) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs  = Math.floor(diff / 3600000);
  if (hrs < 1) return t("pages.recomendados.time.now");
  if (hrs < 24) return t("pages.recomendados.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return t("pages.recomendados.time.daysAgo", { count: days });
  return t("pages.recomendados.time.weeksAgo", { count: Math.floor(days / 7) });
}

// ─────────────────────────────────────────────
// Preview helpers
// ─────────────────────────────────────────────
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

// ─────────────────────────────────────────────
// Card de vídeo — Grid
// ─────────────────────────────────────────────
function VideoGridCard({ video }: { video: any }) {
  const { t } = useTranslation();
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
      to={`/video/${video.id}`}
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
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-neon-pink/90 flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={24} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Duration */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            {fmtDuration(video.duration)}
          </span>
        )}

        {/* Relevance badge / VolumeX */}
        {!isPreviewing && video.relevance >= 70 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-neon-pink text-[9px] font-bold">
            <Star size={8} fill="currentColor" /> {video.relevance}%
          </div>
        )}
        {isPreviewing && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={12} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2.5">
        {/* Motivo */}
        <span className="text-[10px] px-2 py-0.5 bg-neon-pink/10 border border-neon-pink/20 text-neon-pink rounded-full inline-flex items-center gap-1">
          <Sparkles size={9} />
          {video.reason}
        </span>

        {/* Criador */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {video.creator_avatar
              ? <img src={video.creator_avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Users size={10} className="text-white/28" /></div>
            }
          </div>
          <span className="text-[11px] text-foreground/45 truncate">{video.creator_name ?? t("common.creator")}</span>
        </div>

        {/* Título */}
        <h3 className="font-semibold text-sm text-foreground/85 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
          {video.title || t("common.noTitle")}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-foreground/38">
          <span className="flex items-center gap-1"><Eye size={11} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink/55" />{fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1"><MessageCircle size={11} />{fmtNum(video.comments_count)}</span>
        </div>

        {/* Compatibilidade */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-pink to-neon-purple rounded-full transition-all duration-700"
              style={{ width: `${video.relevance}%` }}
            />
          </div>
          <span className="text-[10px] text-foreground/35 flex-shrink-0 flex items-center gap-1">
            <ThumbsUp size={9} /> {video.relevance}%
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Card — List
// ─────────────────────────────────────────────
function VideoListCard({ video }: { video: any }) {
  const { t } = useTranslation();
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
      to={`/video/${video.id}`}
      className="group flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-neon-pink/20 hover:bg-white/[0.05] transition-all"
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="relative w-44 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover"
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
          <div className="absolute top-1 right-1 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={10} className="text-white" />
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
            {fmtDuration(video.duration)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
        <span className="text-[10px] px-2 py-0.5 bg-neon-pink/10 border border-neon-pink/18 text-neon-pink rounded-full inline-flex items-center gap-1">
          <Sparkles size={8} />{video.reason}
        </span>
        <h3 className="font-semibold text-sm text-foreground/85 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
          {video.title || t("common.noTitle")}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-foreground/35">
          <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={10} className="text-neon-pink/50" />{fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1 ml-auto"><ThumbsUp size={10} />{video.relevance}{t("pages.recomendados.compatibility")}</span>
        </div>
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
        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/8 overflow-hidden animate-pulse">
          <div className="aspect-video bg-white/5" />
          <div className="p-3.5 space-y-2.5">
            <div className="h-5 bg-white/8 rounded-full w-36" />
            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white/8" /><div className="h-2.5 bg-white/8 rounded w-20" /></div>
            <div className="h-3.5 bg-white/8 rounded" />
            <div className="h-3.5 bg-white/8 rounded w-2/3" />
            <div className="h-1 bg-white/8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function RecomendadosPage() {
  const { t } = useTranslation();
  const { videos, loading, activeTab, setActiveTab, interestProfile,
          profileReady, trackSearch, refresh } = useRecommendations(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dSearch, setDSearch]       = useState("");
  const [viewMode, setViewMode]     = useState<"grid" | "list">("grid");
  const debRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce pesquisa + track
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setDSearch(searchTerm);
      if (searchTerm.trim().length >= 3) await trackSearch(searchTerm);
    }, 500);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [searchTerm, trackSearch]);

  const hasProfile = Object.keys(interestProfile).length > 0;
  const topCats = Object.entries(interestProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const displayed = dSearch.trim()
    ? videos.filter((v) => (v.title ?? "").toLowerCase().includes(dSearch.toLowerCase()))
    : videos;

  const TABS: { id: RecoTab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "para_voce",  label: t("pages.recomendados.tabs.forYou"),      icon: Sparkles,  desc: t("pages.recomendados.tabs.forYouDesc") },
    { id: "historico",  label: t("pages.recomendados.tabs.fromHistory"), icon: History,   desc: t("pages.recomendados.tabs.fromHistoryDesc") },
    { id: "tendencias", label: t("pages.recomendados.tabs.trending"),    icon: TrendingUp,desc: t("pages.recomendados.tabs.trendingDesc") },
  ];

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-7">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/12 via-neon-pink/7 to-neon-blue/5 border border-white/8 p-7">
          <div className="absolute -top-14 -right-14 w-56 h-56 bg-neon-purple/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[11px] font-bold tracking-wider uppercase mb-3">
                <Zap size={10} /> {t("pages.recomendados.hero.badge")}
              </div>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                  {t("pages.recomendados.hero.titleHighlight")}
                </span>{" "}{t("pages.recomendados.hero.titleSuffix")}
              </h1>
              <p className="text-foreground/48 text-sm leading-relaxed">
                {hasProfile
                  ? t("pages.recomendados.hero.subtitleProfile")
                  : t("pages.recomendados.hero.subtitleNoProfile")}
              </p>
            </div>

            {/* Perfil de interesses */}
            {hasProfile && (
              <div className="flex-shrink-0 bg-white/[0.03] border border-white/8 rounded-2xl p-4 min-w-[160px]">
                <p className="text-[10px] text-foreground/35 uppercase tracking-wider font-bold mb-3">{t("pages.recomendados.interests")}</p>
                <div className="space-y-2">
                  {topCats.map(([cat, score]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-[11px] text-foreground/60 capitalize w-20 truncate">{cat}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-pink to-neon-purple rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground/30">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs + Pesquisa ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-xl p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === id
                    ? "bg-neon-pink text-white shadow-sm"
                    : "text-foreground/45 hover:text-foreground/70"
                }`}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* Pesquisa */}
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-neon-purple/35 transition-all">
            <Search size={14} className="text-foreground/33 flex-shrink-0" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("pages.recomendados.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/26"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-foreground/28 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Controlos */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-neon-pink"}`}><Grid3x3 size={14} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-neon-pink"}`}><List size={14} /></button>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground/40 hover:text-neon-pink hover:border-neon-pink/25 transition-all disabled:opacity-40"
              title={t("pages.recomendados.refreshTitle")}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Banner CTA para criar conta ── */}
        {!hasProfile && !loading && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-neon-purple/8 to-neon-pink/8 border border-neon-pink/15">
            <div className="w-10 h-10 rounded-xl bg-neon-pink/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-neon-pink" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/80">{t("pages.recomendados.banner.title")}</p>
              <p className="text-xs text-foreground/40 mt-0.5">{t("pages.recomendados.banner.subtitle")}</p>
            </div>
            <Link
              to="/signup"
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-xs font-bold hover:shadow-md hover:shadow-neon-pink/20 transition-all"
            >
              {t("pages.recomendados.banner.createAccount")}
            </Link>
          </div>
        )}

        {/* ── Conteúdo ── */}
        {loading ? (
          <SkeletonGrid />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Sparkles size={28} className="text-foreground/18" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/55 font-semibold">
                {dSearch ? t("pages.recomendados.empty.withSearch", { query: dSearch }) : t("pages.recomendados.empty.noRecos")}
              </p>
              <p className="text-foreground/28 text-sm max-w-xs">
                {dSearch ? t("pages.recomendados.empty.trySearch") : t("pages.recomendados.empty.watchVideo")}
              </p>
            </div>
            {dSearch && (
              <button onClick={() => setSearchTerm("")} className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors">
                {t("pages.recomendados.clearSearch")}
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((v) => <VideoGridCard key={v.id} video={v} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((v) => <VideoListCard key={v.id} video={v} />)}
          </div>
        )}

        {/* ── Carregar mais ── */}
        {!loading && displayed.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground/60 text-sm font-semibold hover:bg-white/8 hover:border-white/20 hover:text-foreground transition-all"
            >
              <RefreshCw size={14} /> {t("pages.recomendados.loadMore")}
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}