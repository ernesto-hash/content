// src/pages/HomeAuthenticated.tsx
// Dashboard inicial para utilizadores autenticados
// ✅ DIVERSIDADE: busca 500, intercala por modelo, pagina localmente
// ✅ PUBLICIDADE REAL: AdBanner usa Supabase Realtime — actualiza após pagamento
// ✅ SEM ANÚNCIOS: mostra espaço vazio com link "Anunciar aqui"

import { useCallback, useEffect, useRef, useState } from "react";

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
  Zap, User, ChevronDown, ThumbsDown, Bell,
  Sun, Moon, VolumeX,
} from "lucide-react";

type Video = {
  id: string; title: string | null; thumbnail_url: string | null;
  video_url: string | null;
  views: number; duration: number | null; created_at: string;
  category: string | null; likes_count: number;
  user_id: string; creator_name: string | null; creator_avatar: string | null;
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
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
function interleaveDiversity(videos: Video[]): Video[] {
  const groups = new Map<string, Video[]>();
  for (const v of videos) {
    if (!groups.has(v.user_id)) groups.set(v.user_id, []);
    groups.get(v.user_id)!.push(v);
  }
  const queues  = [...groups.values()].sort((a, b) => b.length - a.length);
  const result: Video[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of queues) { if (q.length > 0) { result.push(q.shift()!); changed = true; } }
  }
  return result;
}

// ─────────────────────────────────────────────
// VideoCard
// ─────────────────────────────────────────────
function VideoCard({ video, isLiked, isDisliked, isSaved, onLike, onDislike, onSave, index = 0 }: {
  video: Video; isLiked: boolean; isDisliked: boolean; isSaved: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
  onDislike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  index?: number;
}) {
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
      className="group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={isPreviewing ? { borderRadius: "0.75rem", boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
    >
      <Link to={`/video/${video.id}`} className="block relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-2" onClick={handleLinkClick}>
        {/* Thumbnail */}
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title ?? ""} loading={index < 6 ? "eager" : "lazy"}
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
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {video.creator_avatar ? <img src={video.creator_avatar} alt="" className="w-full h-full object-cover" /> : <User size={8} className="text-white/30 m-auto" />}
          </div>
          <span className="text-[10px] text-foreground/35 truncate">{video.creator_name ?? "Criador"}</span>
        </div>
        <Link to={`/video/${video.id}`} onClick={handleLinkClick}>
          <h3 className="text-sm font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">{video.title || "Sem título"}</h3>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-foreground/32 pt-0.5">
          <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/45" />{fmtNum(video.likes_count)}</span>
          <span className="ml-auto">{fmtRelative(video.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

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
// Componente principal
// ─────────────────────────────────────────────
export default function HomeAuthenticated() {
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
        creator_name:   p?.full_name ?? p?.username ?? null,
        creator_avatar: p?.avatar_url ?? null,
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
        .select("id,title,thumbnail_url,video_url,views,duration,created_at,category,user_id", { count: "exact" })
        .eq("status", "published").eq("visibility", "public")
        .in("user_id", subs).order("created_at", { ascending: false }).range(0, 499);
      const enriched    = await bulkEnrich(data ?? []);
      const interleaved = interleaveDiversity(enriched);
      setTotalCount(count ?? 0);
      setAllVideos(interleaved); setDisplayed(interleaved.slice(0, PAGE_SIZE));
      setPage(0); setHasMore(interleaved.length > PAGE_SIZE);
      setLoading(false); isFetchingRef.current = false; return;
    }

    let q = supabase.from("videos")
      .select("id,title,thumbnail_url,video_url,views,duration,created_at,category,user_id", { count: "exact" })
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
    const interleaved = interleaveDiversity(sorted);

    setAllVideos(interleaved); setDisplayed(interleaved.slice(0, PAGE_SIZE));
    setPage(0); setHasMore(interleaved.length > PAGE_SIZE);
    setLoading(false); isFetchingRef.current = false;
  }, [activeFilter]);

  useEffect(() => { if (currentUserId !== null) fetchAll(); }, [fetchAll, currentUserId]);

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
              <p className="text-sm font-bold text-foreground/80">{greeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋</p>
              <p className="text-[10px] text-foreground/30">O que queres ver hoje?</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-foreground/35">
            <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink/50" />{fmtNum(myLikesCount)} gostos</span>
            <span className="flex items-center gap-1"><Bell size={11} className="text-neon-purple/50" />{fmtNum(mySubsCount)} subscrições</span>
            <span className="flex items-center gap-1"><Bookmark size={11} className="text-neon-blue/50" />{fmtNum(savedIds.size)} guardados</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            ["para_mim",    "Para si",       Sparkles],
            ["alta",        "Em Alta",       Flame],
            ["recentes",    "Recentes",      Zap],
            ["vistos",      "Mais Vistos",   TrendingUp],
            ["subscricoes", "Subscrições",   Bell],
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
          {!loading && <span className="ml-auto text-[10px] text-foreground/25">{fmtNum(totalCount)} vídeos</span>}
        </div>

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
              {activeFilter === "subscricoes" ? "Sem vídeos de canais subscritos" : "Sem vídeos encontrados"}
            </p>
            {activeFilter === "subscricoes"
              ? <Link to="/app/modelos" className="text-sm text-neon-pink hover:text-neon-pink/80">Descobrir modelos →</Link>
              : <button onClick={() => setActiveFilter("para_mim")} className="text-sm text-neon-pink hover:text-neon-pink/80">Ver todos os vídeos</button>
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
              {loadingMore ? <><Loader2 size={14} className="animate-spin" />A carregar...</> : <><ChevronDown size={14} />Carregar mais vídeos</>}
            </button>
          </div>
        )}

        {/* ✅ Anúncio real extra */}
        {!loading && displayed.length > 0 && <AdBanner placement="all_pages" />}
      </div>
    </LayoutAuthenticated>
  );
}