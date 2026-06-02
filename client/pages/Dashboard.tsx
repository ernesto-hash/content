// src/pages/HomeAuthenticated.tsx
// Dashboard inicial para utilizadores autenticados
// ✅ DIVERSIDADE: busca 500, intercala por modelo, pagina localmente
// ✅ PUBLICIDADE REAL: AdBanner usa Supabase Realtime — actualiza após pagamento
// ✅ SEM ANÚNCIOS: mostra espaço vazio com link "Anunciar aqui"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const isTouchDeviceDash = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;
import { Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import AdBanner from "@/components/AdBanner";
import { supabase } from "@/lib/supabaseClient";
import {
  Play, Heart, Bookmark, Flame, Sparkles, TrendingUp,
  Eye, Film, Loader2,
  Zap, User, ChevronDown, ChevronRight, ThumbsDown, Bell,
  Sun, Moon, VolumeX, X,
} from "lucide-react";

type Video = {
  id: string; slug?: string | null; title: string | null; thumbnail_url: string | null;
  video_url: string | null;
  views: number; duration: number | null; created_at: string;
  category: string | null; likes_count: number;
  user_id: string; creator_name: string | null; creator_avatar: string | null; creator_username: string | null;
};
type FilterTab = "para_mim" | "alta" | "recentes" | "vistos" | "subscricoes";
const PAGE_SIZE = 24;

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
  if (hrs < 1)  return t("pages.dashboard.time.now");
  if (hrs < 24) return t("pages.dashboard.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7)  return t("pages.dashboard.time.daysAgo", { count: days });
  if (days < 30) return t("pages.dashboard.time.weeksAgo", { count: Math.floor(days / 7) });
  return t("pages.dashboard.time.monthsAgo", { count: Math.floor(days / 30) });
}
function greeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("pages.dashboard.greeting.morning");
  if (h < 18) return t("pages.dashboard.greeting.afternoon");
  return t("pages.dashboard.greeting.evening");
}
function distribuirPorModelo<T extends { user_id: string }>(videos: T[]): T[] {
  if (videos.length === 0) return [];

  const grupos = new Map<string, T[]>();
  for (const v of videos) {
    if (!grupos.has(v.user_id)) grupos.set(v.user_id, []);
    grupos.get(v.user_id)!.push(v);
  }

  const filas = [...grupos.values()].sort(() => Math.random() - 0.5);
  const resultado: T[] = [];
  let posicao = 0;

  while (resultado.length < videos.length) {
    const filasActivas = filas.filter(f => f.length > 0);
    if (filasActivas.length === 0) break;

    const filaIndex = posicao % filasActivas.length;
    const fila = filasActivas[filaIndex];
    resultado.push(fila.shift()!);
    posicao++;
  }

  return resultado;
}

// ─────────────────────────────────────────────
// VideoCard
// ─────────────────────────────────────────────
const VideoCard = memo(function VideoCard({ video, isLiked, isDisliked, isSaved, onLike, onDislike, onSave, index = 0, className = "" }: {
  video: Video; isLiked: boolean; isDisliked: boolean; isSaved: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
  onDislike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  index?: number;
  className?: string;
}) {
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

  const handleMouseEnter = () => { if (!isTouchDeviceDash()) startPreview(); };
  const handleMouseLeave = () => { if (!isTouchDeviceDash()) stopPreview(); };
  const handleTouchStart = () => {
    wasHoldRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => { wasHoldRef.current = true; startPreview(); }, 300);
  };
  const handleTouchEnd = () => { clearTimeout(holdTimerRef.current); if (wasHoldRef.current) stopPreview(); };
  const handleLinkClick = (e: React.MouseEvent) => { if (wasHoldRef.current) { e.preventDefault(); wasHoldRef.current = false; } };

  return (
    <div
      className={`group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={isPreviewing ? { borderRadius: "0.75rem", boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
    >
      <Link to={`/video/${video.slug || video.id}`} className="block relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-2" onClick={handleLinkClick}>
        {/* Thumbnail */}
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title ?? ""} loading={index < 6 ? "eager" : "lazy"} width={320} height={180}
              className="w-full h-full object-cover"
              style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }} />
          : <div className="w-full h-full flex items-center justify-center bg-white/5"
              style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}>
              <Film size={22} className="text-white/15" />
            </div>
        }
        {/* Video preview */}
        <video ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted playsInline preload="none" />
        {!isPreviewing && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/22 transition-colors duration-300" />}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-11 h-11 rounded-full bg-neon-pink flex items-center justify-center shadow-lg shadow-neon-pink/40 scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {video.duration && <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono rounded">{fmtDuration(video.duration)}</div>}
        {video.category && <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 text-neon-pink text-[9px] font-bold rounded border border-neon-pink/18 capitalize">{video.category}</div>}
        {!isPreviewing && (
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => onLike(video.id, e)}
              className={`w-6 h-6 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all ${isLiked ? "bg-neon-pink border-neon-pink/40 text-white" : "bg-black/55 border-white/10 text-white/65 hover:text-neon-pink"}`}>
              <Heart size={10} className={isLiked ? "fill-white" : ""} />
            </button>
            <button onClick={e => onDislike(video.id, e)}
              className={`w-6 h-6 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all ${isDisliked ? "bg-orange-500 border-orange-500/40 text-white" : "bg-black/55 border-white/10 text-white/65 hover:text-orange-400"}`}>
              <ThumbsDown size={9} />
            </button>
            <button onClick={e => onSave(video.id, e)}
              className={`w-6 h-6 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all ${isSaved ? "bg-neon-purple border-neon-purple/40 text-white" : "bg-black/55 border-white/10 text-white/65 hover:text-neon-purple"}`}>
              <Bookmark size={10} className={isSaved ? "fill-white" : ""} />
            </button>
          </div>
        )}
        {isPreviewing && (
          <div className="absolute bottom-1.5 left-1.5 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={11} className="text-white" />
          </div>
        )}
      </Link>
      <div className="space-y-0.5 px-0.5">
        <Link
          to={`/app/modelo/${video.creator_username || video.user_id}`}
          className="flex items-center gap-1.5 mb-1 group/creator w-fit max-w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {video.creator_avatar ? <img src={video.creator_avatar} alt="" loading="lazy" width={16} height={16} className="w-full h-full object-cover" /> : <User size={8} className="text-white/30 m-auto" />}
          </div>
          <span className="text-[10px] text-foreground/35 truncate group-hover/creator:text-foreground/65 transition-colors">{video.creator_name ?? t("common.creator")}</span>
        </Link>
        <Link to={`/video/${video.slug || video.id}`} onClick={handleLinkClick}>
          <h3 className="text-sm font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">{video.title || t("common.noTitle")}</h3>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-foreground/32 pt-0.5">
          <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/45" />{fmtNum(video.likes_count)}</span>
          <span className="ml-auto">{fmtRelative(video.created_at, t)}</span>
        </div>
      </div>
    </div>
  );
});

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-xl bg-white/5 mb-2" />
      <div className="flex items-center gap-1.5 mb-1"><div className="w-4 h-4 rounded-full bg-white/5" /><div className="h-2 bg-white/5 rounded w-14" /></div>
      <div className="h-3 bg-white/5 rounded w-full mb-1" />
      <div className="h-3 bg-white/5 rounded w-2/3 mb-1" />
      <div className="h-2 bg-white/5 rounded w-1/2" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Secção "Em Destaque"
// ─────────────────────────────────────────────
function FeaturedSection({ videos, onLike, onDislike, onSave, likedIds, dislikedIds, savedIds }: {
  videos: Video[];
  onLike: (id: string, e: React.MouseEvent) => void;
  onDislike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  likedIds: Set<string>; dislikedIds: Set<string>; savedIds: Set<string>;
}) {
  const { t } = useTranslation();
  if (videos.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={15} className="text-amber-400" />
        <h2 className="text-sm font-black text-white/80 uppercase tracking-wider">{t("pages.dashboard.featured")}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} onLike={onLike} onDislike={onDislike} onSave={onSave}
            isLiked={likedIds.has(v.id)} isDisliked={dislikedIds.has(v.id)} isSaved={savedIds.has(v.id)}
            className="w-52 sm:w-60 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Linha horizontal por categoria
// ─────────────────────────────────────────────
function CategoryRow({ category, videos, onLike, onDislike, onSave, likedIds, dislikedIds, savedIds }: {
  category: string; videos: Video[];
  onLike: (id: string, e: React.MouseEvent) => void;
  onDislike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  likedIds: Set<string>; dislikedIds: Set<string>; savedIds: Set<string>;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-white/70 uppercase tracking-wider capitalize">{category}</h2>
        <Link to={`/app/categoria/${encodeURIComponent(category)}`}
          className="flex items-center gap-0.5 text-[11px] transition-colors"
          style={{ color: "rgba(236,72,153,0.60)" }}>
          {t("pages.dashboard.viewAll")} <ChevronRight size={11} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} onLike={onLike} onDislike={onDislike} onSave={onSave}
            isLiked={likedIds.has(v.id)} isDisliked={dislikedIds.has(v.id)} isSaved={savedIds.has(v.id)}
            className="w-44 sm:w-52 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Banner de Shorts
// ─────────────────────────────────────────────
function ShortsBanner({ shortsPath }: { shortsPath: string }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("shorts_banner_seen")) return;
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem("shorts_banner_seen", "1");
    }, 10000);
    return () => clearTimeout(timer);
  }, [visible]);

  const close = () => {
    setVisible(false);
    localStorage.setItem("shorts_banner_seen", "1");
  };

  if (!visible) return null;

  return (
    <>
      <style>{`@keyframes shortsCountdown{from{width:100%}to{width:0%}}`}</style>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] bg-[#0e0e14] border border-neon-pink/40 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.2)] overflow-hidden">
        <button
          onClick={close}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors z-10"
        >
          <X size={16} />
        </button>
        <div className="p-4 pr-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-neon-pink flex-shrink-0" fill="currentColor" />
            <span className="font-bold text-white text-sm">Shorts chegaram! ⚡</span>
          </div>
          <p className="text-foreground/55 text-xs leading-relaxed mb-3">
            {t("shorts.banner.text", "Descobre vídeos curtos no estilo TikTok. Scroll infinito, conteúdo exclusivo das tuas modelos favoritas.")}
          </p>
          <Link
            to={shortsPath}
            onClick={close}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all"
          >
            {t("shorts.banner.cta", "Ver Shorts")} →
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
          <div
            className="h-full bg-neon-pink"
            style={{ animation: "shortsCountdown 10s linear forwards" }}
          />
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function HomeAuthenticated() {
  const { t } = useTranslation();
  const [allVideos, setAllVideos]     = useState<Video[]>([]);
  const [displayed, setDisplayed]     = useState<Video[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [page, setPage]               = useState(0);
  const [totalCount, setTotalCount]   = useState(0);
  const isFetchingRef                 = useRef(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("para_mim");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName,      setUserName]      = useState<string | null>(null);
  const [likedIds,      setLikedIds]      = useState<Set<string>>(new Set());
  const [dislikedIds,   setDislikedIds]   = useState<Set<string>>(new Set());
  const [savedIds,      setSavedIds]      = useState<Set<string>>(new Set());
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const subscriptionsRef                 = useRef<string[]>([]);
  const [myLikesCount,  setMyLikesCount]  = useState(0);
  const [mySubsCount,   setMySubsCount]   = useState(0);
  const [shortsPreview, setShortsPreview] = useState<{ id: string; slug: string | null; thumbnail_url: string | null; title: string | null }[]>([]);

  // Em destaque: top-4 por views de criadores distintos (só se ≥2 criadores)
  const featuredVideos = useMemo((): Video[] => {
    if (allVideos.length < 2) return [];
    const byViews = [...allVideos].sort((a, b) => b.views - a.views);
    const seen    = new Set<string>();
    const result: Video[] = [];
    for (const v of byViews) {
      if (!seen.has(v.user_id)) { seen.add(v.user_id); result.push(v); }
      if (result.length === 4) break;
    }
    return seen.size >= 2 ? result : [];
  }, [allVideos]);

  // Top-3 categorias com ≥3 vídeos → linhas horizontais
  const categoryRows = useMemo(() => {
    if (displayed.length === 0) return [];
    const catMap = new Map<string, Video[]>();
    for (const v of displayed) {
      if (!v.category) continue;
      if (!catMap.has(v.category)) catMap.set(v.category, []);
      catMap.get(v.category)!.push(v);
    }
    return [...catMap.entries()]
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3)
      .filter(([, vs]) => vs.length >= 3)
      .map(([cat, vs]) => ({ cat, videos: vs.slice(0, 8) }));
  }, [displayed]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) setCurrentUserId(uid);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("profiles").select("username,full_name").eq("id", currentUserId).maybeSingle()
      .then(({ data }) => { const p = data as any; setUserName(p?.full_name ?? p?.username ?? null); });
    supabase.from("interacoes").select("video_id").eq("user_id", currentUserId).eq("tipo", true)
      .then(({ data }) => { const ids = (data ?? []).map((r: any) => r.video_id); setLikedIds(new Set(ids)); setMyLikesCount(ids.length); });
    supabase.from("interacoes").select("video_id").eq("user_id", currentUserId).eq("tipo", false)
      .then(({ data }) => setDislikedIds(new Set((data ?? []).map((r: any) => r.video_id))));
    supabase.from("subscriptions").select("creator_id").eq("subscriber_id", currentUserId)
      .then(({ data }) => { const ids = (data ?? []).map((r: any) => r.creator_id); subscriptionsRef.current = ids; setSubscriptions(ids); setMySubsCount(ids.length); });
  }, [currentUserId]);

  // 2 bulk queries regardless of video count — same approach as Index.tsx
  async function bulkEnrich(rawVideos: any[]): Promise<Video[]> {
    if (rawVideos.length === 0) return [];
    const uniqueCreatorIds = [...new Set(rawVideos.map((v: any) => v.user_id).filter(Boolean))] as string[];
    const videoIds         = rawVideos.map((v: any) => v.id) as string[];

    const [profilesRes, likesRes] = await Promise.all([
      uniqueCreatorIds.length > 0
        ? supabase.from("profiles_public").select("id,username,full_name,avatar_url").in("id", uniqueCreatorIds)
        : Promise.resolve({ data: [] as any[] }),
      videoIds.length > 0
        ? supabase.from("interacoes").select("video_id").eq("tipo", true).in("video_id", videoIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map<string, any>((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const likesMap   = new Map<string, number>();
    for (const row of (likesRes.data ?? [])) {
      likesMap.set(row.video_id, (likesMap.get(row.video_id) ?? 0) + 1);
    }

    return rawVideos.map((v: any) => {
      const p = profileMap.get(v.user_id);
      return {
        ...v,
        likes_count:    likesMap.get(v.id) ?? 0,
        creator_name:     p?.full_name ?? p?.username ?? null,
        creator_avatar:   p?.avatar_url ?? null,
        creator_username: p?.username ?? null,
      };
    });
  }

  const fetchAll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    const subs = subscriptionsRef.current;

    if (activeFilter === "subscricoes") {
      if (subs.length === 0) {
        setAllVideos([]); setDisplayed([]);
        setLoading(false); isFetchingRef.current = false; return;
      }
      const { data, count } = await supabase.from("videos")
        .select("id,slug,title,thumbnail_url,video_url,views,duration,created_at,category,user_id", { count: "exact" })
        .eq("status", "published").eq("visibility", "public")
        .in("user_id", subs).order("created_at", { ascending: false }).range(0, 499);
      const enriched    = await bulkEnrich(data ?? []);
      const interleaved = distribuirPorModelo(enriched);
      setTotalCount(count ?? 0);
      setAllVideos(interleaved); setDisplayed(interleaved.slice(0, PAGE_SIZE));
      setPage(0); setHasMore(interleaved.length > PAGE_SIZE);
      setLoading(false); isFetchingRef.current = false; return;
    }

    let q = supabase.from("videos")
      .select("id,slug,title,thumbnail_url,video_url,views,duration,created_at,category,user_id", { count: "exact" })
      .eq("status", "published").eq("visibility", "public").range(0, 499);
    if (activeFilter === "vistos" || activeFilter === "alta") q = q.order("views",      { ascending: false });
    else                                                        q = q.order("created_at", { ascending: false });

    const { data, count } = await q;
    setTotalCount(count ?? 0);
    if (!data || data.length === 0) {
      setAllVideos([]); setDisplayed([]);
      setLoading(false); isFetchingRef.current = false; return;
    }

    const enriched    = await bulkEnrich(data as any[]);
    const sorted      = activeFilter === "alta" ? [...enriched].sort((a, b) => b.likes_count - a.likes_count) : enriched;
    const interleaved = distribuirPorModelo(sorted);

    setAllVideos(interleaved); setDisplayed(interleaved.slice(0, PAGE_SIZE));
    setPage(0); setHasMore(interleaved.length > PAGE_SIZE);
    setLoading(false); isFetchingRef.current = false;
  }, [activeFilter]);

  useEffect(() => { if (currentUserId !== null) fetchAll(); }, [fetchAll, currentUserId]);

  useEffect(() => {
    supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url")
      .eq("is_short", true)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("views", { ascending: false })
      .limit(6)
      .then(({ data }) => setShortsPreview((data ?? []) as any[]));
  }, []);

  useEffect(() => {
    const ch = supabase.channel("home-auth-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const loadMore = () => {
    const nextPage  = page + 1;
    const nextSlice = allVideos.slice(0, (nextPage + 1) * PAGE_SIZE);
    setLoadingMore(true);
    setTimeout(() => { setDisplayed(nextSlice); setPage(nextPage); setHasMore(nextSlice.length < allVideos.length); setLoadingMore(false); }, 300);
  };

  const handleLike = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) return;
    if (dislikedIds.has(videoId)) {
      await supabase.from("interacoes").delete().eq("video_id", videoId).eq("user_id", currentUserId).eq("tipo", false);
      setDislikedIds(p => { const s = new Set(p); s.delete(videoId); return s; });
    }
    if (likedIds.has(videoId)) {
      await supabase.from("interacoes").delete().eq("video_id", videoId).eq("user_id", currentUserId).eq("tipo", true);
      setLikedIds(p => { const s = new Set(p); s.delete(videoId); return s; });
      setMyLikesCount(n => Math.max(0, n - 1));
    } else {
      await supabase.from("interacoes").insert({ video_id: videoId, user_id: currentUserId, tipo: true });
      setLikedIds(p => new Set(p).add(videoId));
      setMyLikesCount(n => n + 1);
    }
  };
  const handleDislike = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) return;
    if (likedIds.has(videoId)) {
      await supabase.from("interacoes").delete().eq("video_id", videoId).eq("user_id", currentUserId).eq("tipo", true);
      setLikedIds(p => { const s = new Set(p); s.delete(videoId); return s; });
      setMyLikesCount(n => Math.max(0, n - 1));
    }
    if (dislikedIds.has(videoId)) {
      await supabase.from("interacoes").delete().eq("video_id", videoId).eq("user_id", currentUserId).eq("tipo", false);
      setDislikedIds(p => { const s = new Set(p); s.delete(videoId); return s; });
    } else {
      await supabase.from("interacoes").insert({ video_id: videoId, user_id: currentUserId, tipo: false });
      setDislikedIds(p => new Set(p).add(videoId));
    }
  };
  const handleSave = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) return;
    setSavedIds(p => { const s = new Set(p); s.has(videoId) ? s.delete(videoId) : s.add(videoId); return s; });
  };

  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-5 space-y-5">

        {/* Saudação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-purple/15 flex items-center justify-center">
              {new Date().getHours() >= 18 ? <Moon size={15} className="text-neon-purple/80" /> : <Sun size={15} className="text-amber-400/80" />}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/80">{greeting(t)}{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋</p>
              <p className="text-[10px] text-foreground/30">{t("pages.dashboard.subtitle")}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-foreground/35">
            <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink/50" />{fmtNum(myLikesCount)} {t("pages.dashboard.stats.likes")}</span>
            <span className="flex items-center gap-1"><Bell size={11} className="text-neon-purple/50" />{fmtNum(mySubsCount)} {t("pages.dashboard.stats.subscriptions")}</span>
            <span className="flex items-center gap-1"><Bookmark size={11} className="text-neon-blue/50" />{fmtNum(savedIds.size)} {t("pages.dashboard.stats.saved")}</span>
          </div>
        </div>

        {/* Em Destaque */}
        {!loading && featuredVideos.length > 0 && (
          <FeaturedSection videos={featuredVideos}
            onLike={handleLike} onDislike={handleDislike} onSave={handleSave}
            likedIds={likedIds} dislikedIds={dislikedIds} savedIds={savedIds} />
        )}

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            ["para_mim",    t("pages.dashboard.filters.forYou"),       Sparkles],
            ["alta",        t("pages.dashboard.filters.trending"),      Flame],
            ["recentes",    t("pages.dashboard.filters.recent"),        Zap],
            ["vistos",      t("pages.dashboard.filters.mostViewed"),    TrendingUp],
            ["subscricoes", t("pages.dashboard.filters.subscriptions"), Bell],
          ] as [FilterTab, string, React.ElementType][]).map(([val, label, Icon]) => (
            <button key={val} onClick={() => setActiveFilter(val)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeFilter === val ? "bg-white/12 border-white/22 text-white" : "bg-white/[0.03] border-white/8 text-foreground/42 hover:border-white/15 hover:text-foreground/62"
              }`}>
              <Icon size={11} /> {label}
              {val === "subscricoes" && mySubsCount > 0 && (
                <span className={`text-[9px] px-1 rounded-full ${activeFilter === val ? "bg-white/20 text-white" : "bg-neon-purple/20 text-neon-purple"}`}>{mySubsCount}</span>
              )}
            </button>
          ))}
          {!loading && <span className="ml-auto text-[10px] text-foreground/25">{t("pages.dashboard.totalVideos", { count: fmtNum(totalCount) as unknown as number })}</span>}
        </div>

        {/* Linhas de categoria */}
        {!loading && categoryRows.map(({ cat, videos }) => (
          <CategoryRow key={cat} category={cat} videos={videos}
            onLike={handleLike} onDislike={handleDislike} onSave={handleSave}
            likedIds={likedIds} dislikedIds={dislikedIds} savedIds={savedIds} />
        ))}

        {/* Shorts em Destaque */}
        {shortsPreview.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-neon-pink" fill="currentColor" />
                <h2 className="text-sm font-black text-white/80 uppercase tracking-wider">
                  {t("home.sections.shorts", "Shorts")}
                </h2>
              </div>
              <Link
                to="/app/shorts"
                className="flex items-center gap-1 text-xs text-foreground/45 hover:text-neon-pink transition-colors"
              >
                {t("home.sections.viewAll", "Ver todos")} <ChevronRight size={11} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {shortsPreview.map(s => (
                <Link
                  key={s.id}
                  to="/app/shorts"
                  className="flex-shrink-0 relative w-[90px] h-48 rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-neon-pink/30 transition-colors group"
                >
                  {s.thumbnail_url ? (
                    <img
                      src={s.thumbnail_url}
                      alt={s.title ?? ""}
                      loading="lazy"
                      width={90} height={192}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={20} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-0 right-0 px-1.5">
                    <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">{s.title}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-neon-pink/80 flex items-center justify-center">
                      <Play size={8} fill="white" className="text-white ml-px" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grelha */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {[...Array(20)].map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              {activeFilter === "subscricoes" ? <Bell size={26} className="text-foreground/18" /> : <Film size={26} className="text-foreground/18" />}
            </div>
            <p className="text-foreground/48 font-semibold">
              {activeFilter === "subscricoes" ? t("pages.dashboard.empty.noSubscriptions") : t("pages.dashboard.empty.noVideos")}
            </p>
            {activeFilter === "subscricoes"
              ? <Link to="/app/modelos" className="text-sm text-neon-pink hover:text-neon-pink/80">{t("pages.dashboard.discoverModels")}</Link>
              : <button onClick={() => setActiveFilter("para_mim")} className="text-sm text-neon-pink hover:text-neon-pink/80">{t("pages.dashboard.allVideos")}</button>
            }
          </div>
        ) : (
          <>
            {/* Bloco 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
              {displayed.slice(0, 15).map((v, i) => (
                <VideoCard key={v.id} video={v} index={i}
                  isLiked={likedIds.has(v.id)} isDisliked={dislikedIds.has(v.id)} isSaved={savedIds.has(v.id)}
                  onLike={handleLike} onDislike={handleDislike} onSave={handleSave} />
              ))}
            </div>

            {/* ✅ Anúncio real 1 */}
            {displayed.length > 15 && <AdBanner placement="all_pages" />}

            {/* Bloco 2 */}
            {displayed.length > 15 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                {displayed.slice(15, 35).map((v, i) => (
                  <VideoCard key={v.id} video={v} index={15 + i}
                    isLiked={likedIds.has(v.id)} isDisliked={dislikedIds.has(v.id)} isSaved={savedIds.has(v.id)}
                    onLike={handleLike} onDislike={handleDislike} onSave={handleSave} />
                ))}
              </div>
            )}

            {/* ✅ Anúncio real 2 */}
            {displayed.length > 35 && <AdBanner placement="all_pages" />}

            {/* Bloco 3 */}
            {displayed.length > 35 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                {displayed.slice(35).map((v, i) => (
                  <VideoCard key={v.id} video={v} index={35 + i}
                    isLiked={likedIds.has(v.id)} isDisliked={dislikedIds.has(v.id)} isSaved={savedIds.has(v.id)}
                    onLike={handleLike} onDislike={handleDislike} onSave={handleSave} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ✅ Anúncio real rodapé */}
        {!loading && displayed.length > 0 && <AdBanner placement="all_pages" />}

        {/* Carregar mais */}
        {hasMore && !loading && displayed.length > 0 && (
          <div className="flex justify-center py-2">
            <button onClick={loadMore} disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground/58 text-sm font-semibold hover:bg-white/8 hover:border-white/16 hover:text-foreground transition-all disabled:opacity-50">
              {loadingMore ? <><Loader2 size={14} className="animate-spin" />{t("pages.dashboard.loading")}</> : <><ChevronDown size={14} />{t("pages.dashboard.loadMore")}</>}
            </button>
          </div>
        )}

        {/* ✅ Anúncio real extra */}
        {!loading && displayed.length > 0 && <AdBanner placement="all_pages" />}
      </div>
      <ShortsBanner shortsPath="/app/shorts" />
    </LayoutAuthenticated>
  );
}