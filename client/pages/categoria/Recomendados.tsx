// src/pages/Recomendados.tsx
// CondiÃ§Ã£o: views >= 1.000 E likes >= 100
// Score: viewsÃ—0.5 + likesÃ—0.3 + recÃªnciaÃ—0.2
// Realtime: re-fetch automÃ¡tico
// Sem skeleton cards â€” sÃ³ mostra vÃ­deos reais ou estado vazio

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  ThumbsUp, Eye, Heart, Play, Search, Clock,
  ChevronRight, Loader2, Film, VolumeX, Sparkles,
} from "lucide-react";

const MIN_VIEWS  = 1_000;
const MIN_LIKES  = 100;
const W_VIEWS    = 0.5;
const W_LIKES    = 0.3;
const W_RECENCY  = 0.2;
const DECAY_DAYS = 60;

type Video = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  likes_count: number;
  duration: number | null;
  category: string | null;
  created_at: string;
  score: number;
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "â€”";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function calcScore(views: number, likes: number, createdAt: string, maxViews: number, maxLikes: number): number {
  const normViews = maxViews > 0 ? views / maxViews : 0;
  const normLikes = maxLikes > 0 ? likes / maxLikes : 0;
  const ageDays   = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  const recency   = Math.max(0, 1 - ageDays / DECAY_DAYS);
  return W_VIEWS * normViews + W_LIKES * normLikes + W_RECENCY * recency;
}

function ScoreBadge({ score }: { score: number }) {
  const { t } = useTranslation();
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "text-neon-pink" : pct >= 50 ? "text-blue-400" : "text-foreground/50";
  return <span className={`text-[10px] font-bold ${color}`}>{pct}{t("pages.category.recomendados.matchLabel")}</span>;
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function VideoCard({ video }: { video: Video }) {
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
    <Link to={`/video/${video.id}`}
      className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:bg-white/8 transition-all duration-300"
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}>
      <div className="relative aspect-video bg-black/30 overflow-hidden">
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title ?? ""} className="w-full h-full object-cover" style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }} />
          : <div className="w-full h-full flex items-center justify-center text-foreground/20" style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}><Film size={32} /></div>
        }
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
          <Sparkles size={9} /> {t("pages.category.recomendados.badgeForYou")}
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs flex items-center gap-1">
            <Clock size={10} /> {fmtDuration(video.duration)}
          </div>
        )}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-blue-500/80 flex items-center justify-center backdrop-blur-sm shadow-xl">
              <Play size={22} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}
        {isPreviewing && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={12} className="text-white" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug">
          {video.title || t("studio.common.noTitle")}
        </h3>
        <div className="flex items-center justify-between text-xs text-foreground/45">
          <span className="flex items-center gap-1"><Eye size={11} /> {fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink" /> {fmtNum(video.likes_count)}</span>
          <ScoreBadge score={video.score} />
        </div>
        {video.category && (
          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium capitalize">
            {video.category}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function RecomendadosPage() {
  const { t } = useTranslation();
  useDocumentTitle({ title: "VÃ­deos Recomendados - SuckOrSex" });
  const [videos, setVideos]   = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState("");

  const fetchData = useCallback(async () => {
    const { data: vids } = await supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url, video_url, views, duration, category, created_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .gte("views", MIN_VIEWS)
      .limit(200);

    if (!vids) { setLoading(false); return; }

    const withLikes = await Promise.all(
      (vids as any[]).map(async (v) => {
        const { count } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", v.id);
        return { ...v, likes_count: count ?? 0 };
      })
    );

    const filtered = withLikes.filter((v) => v.likes_count >= MIN_LIKES);
    const maxViews = Math.max(...filtered.map((v) => v.views), 1);
    const maxLikes = Math.max(...filtered.map((v) => v.likes_count), 1);

    const scored: Video[] = filtered.map((v) => ({
      ...v,
      score: calcScore(v.views, v.likes_count, v.created_at, maxViews, maxLikes),
    }));

    scored.sort((a, b) => b.score - a.score);
    setVideos(scored);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const videoChannel = supabase
      .channel("recomendados-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => fetchData())
      .subscribe();
    const likesChannel = supabase
      .channel("recomendados-likes")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_likes" }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(videoChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [fetchData]);

  const displayed = useMemo(() => {
    if (!query.trim()) return videos;
    return videos.filter((v) => (v.title ?? "").toLowerCase().includes(query.toLowerCase()));
  }, [videos, query]);

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-transparent border border-blue-500/20 p-8">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ThumbsUp size={20} className="text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Recomendados
                </h1>
              </div>
              <p className="text-foreground/60 text-sm max-w-md">
                {t("pages.category.recomendados.desc")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-blue-400">{loading ? "â€”" : displayed.length}</p>
                <p className="text-xs text-foreground/45 mt-0.5">{t("pages.category.recomendados.selected")}</p>
              </div>
              <div className="hidden sm:block text-xs text-foreground/35 max-w-[120px] leading-relaxed border border-white/8 rounded-xl p-3 bg-white/3">
                {t("pages.category.recomendados.algorithm")}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <Search size={15} className="text-foreground/40 flex-shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pages.category.recomendados.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30" />
        </div>

        {/* ConteÃºdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-blue-400" />
            <p className="text-foreground/40 text-sm">{t("pages.category.recomendados.loading")}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ThumbsUp size={28} className="text-foreground/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/60 font-medium">{t("pages.category.recomendados.emptyTitle")}</p>
              <p className="text-foreground/35 text-sm max-w-xs">
                {t("pages.category.recomendados.emptyDesc", { minViews: fmtNum(MIN_VIEWS), minLikes: fmtNum(MIN_LIKES) })}
              </p>
            </div>
            <Link to="/recentes" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-sm hover:bg-blue-500/18 transition-all mt-2">
              {t("pages.category.recomendados.seeRecent")} <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}

      </div>
    </Layout>
  );
}
