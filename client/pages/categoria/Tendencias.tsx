// src/pages/Tendencias.tsx
// Condição: views >= 50.000 nos últimos 30 dias, ordenado por velocidade (views/dia)
// Realtime: re-fetch automático
// Sem skeleton cards — só mostra vídeos reais ou estado vazio

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  TrendingUp, Eye, Heart, Play, Search, Clock,
  ChevronRight, Loader2, Film, VolumeX, Zap,
} from "lucide-react";

const MIN_VIEWS   = 50_000;
const DAYS_WINDOW = 30;

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
  velocity: number;
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
function daysSince(iso: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function VideoCard({ video, rank, hot }: { video: Video; rank: number; hot?: boolean }) {
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
      className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-neon-blue/40 hover:bg-white/8 transition-all duration-300"
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
        <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center text-white text-xs font-black shadow-lg">
          #{rank}
        </div>
        {hot && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold flex items-center gap-1">
            <Zap size={10} fill="white" /> {t("pages.category.tendencias.badgeHot")}
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs flex items-center gap-1">
            <Clock size={10} /> {fmtDuration(video.duration)}
          </div>
        )}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-neon-blue/80 flex items-center justify-center backdrop-blur-sm shadow-xl">
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
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-neon-blue transition-colors leading-snug">
          {video.title || t("studio.common.noTitle")}
        </h3>
        <div className="flex items-center justify-between text-xs text-foreground/45">
          <span className="flex items-center gap-1"><Eye size={11} /> {fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink" /> {fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1 text-neon-blue/70"><TrendingUp size={10} /> {fmtNum(Math.round(video.velocity))}{t("pages.category.tendencias.velocityUnit")}</span>
        </div>
        {video.category && (
          <span className="inline-block px-2 py-0.5 rounded-md bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[10px] font-medium capitalize">
            {video.category}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function TendenciasPage() {
  const { t } = useTranslation();
  useDocumentTitle({ title: "Vídeos em Tendência - SuckOrSex" });
  const [videos, setVideos]   = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState("");

  const fetchData = useCallback(async () => {
    const since = new Date(Date.now() - DAYS_WINDOW * 86_400_000).toISOString();
    const { data: vids } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, video_url, views, duration, category, created_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .gte("views", MIN_VIEWS)
      .gte("created_at", since)
      .limit(120);

    if (!vids) { setLoading(false); return; }

    const withLikes: Video[] = await Promise.all(
      (vids as any[]).map(async (v) => {
        const { count } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", v.id);
        const days = daysSince(v.created_at);
        return { ...v, likes_count: count ?? 0, velocity: v.views / days };
      })
    );

    withLikes.sort((a, b) => b.velocity - a.velocity);
    setVideos(withLikes);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const videoChannel = supabase
      .channel("tendencias-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => fetchData())
      .subscribe();
    const likesChannel = supabase
      .channel("tendencias-likes")
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-blue/15 via-neon-pink/10 to-transparent border border-neon-blue/20 p-8">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-blue/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center shadow-lg shadow-neon-blue/30">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
                  Tendências
                </h1>
              </div>
              <p className="text-foreground/60 text-sm max-w-md">
                {t("pages.category.tendencias.desc", { minViews: "50K", days: DAYS_WINDOW })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-neon-blue">{loading ? "—" : displayed.length}</p>
                <p className="text-xs text-foreground/45 mt-0.5">{t("pages.category.tendencias.inTrend")}</p>
              </div>
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-neon-pink">{DAYS_WINDOW}d</p>
                <p className="text-xs text-foreground/45 mt-0.5">{t("pages.category.tendencias.window")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <Search size={15} className="text-foreground/40 flex-shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pages.category.tendencias.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30" />
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-neon-blue" />
            <p className="text-foreground/40 text-sm">{t("pages.category.tendencias.loading")}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp size={28} className="text-foreground/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/60 font-medium">{t("pages.category.tendencias.emptyTitle")}</p>
              <p className="text-foreground/35 text-sm max-w-xs">
                {t("pages.category.tendencias.emptyDesc", { minViews: "50K", days: DAYS_WINDOW })}
              </p>
            </div>
            <Link to="/populares" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-blue/10 border border-neon-blue/25 text-neon-blue text-sm hover:bg-neon-blue/18 transition-all mt-2">
              {t("pages.category.tendencias.seePopular")} <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((v, i) => <VideoCard key={v.id} video={v} rank={i + 1} />)}
          </div>
        )}

      </div>
    </Layout>
  );
}
