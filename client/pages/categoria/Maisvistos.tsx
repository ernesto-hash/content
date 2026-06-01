// src/pages/MaisVistos.tsx
// CondiÃ§Ã£o: views >= 500.000
// Realtime: re-fetch automÃ¡tico
// Sem skeleton cards â€” sÃ³ mostra vÃ­deos reais ou estado vazio

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Eye, Heart, Play, Search, Clock,
  ChevronRight, Loader2, Film, VolumeX, Crown,
} from "lucide-react";

const MIN_VIEWS = 500_000;

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
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "â€”";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ViewsBar({ views, max }: { views: number; max: number }) {
  const pct = max > 0 ? Math.round((views / max) * 100) : 0;
  return (
    <div className="h-1 rounded-full bg-white/8 overflow-hidden mt-2">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
        style={{ width: `${pct}%` }} />
    </div>
  );
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function VideoCard({ video, rank, maxViews }: { video: Video; rank: number; maxViews: number }) {
  const { t } = useTranslation();
  const isMillion = video.views >= 1_000_000;
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
      className={`group bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300 ${
        isMillion ? "border-emerald-500/30 hover:border-emerald-500/60 hover:bg-white/8" : "border-white/10 hover:border-emerald-500/30 hover:bg-white/8"
      }`}
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
        <div className={`absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg ${
          rank === 1 ? "bg-gradient-to-br from-yellow-400 to-orange-400"
          : rank <= 3 ? "bg-gradient-to-br from-emerald-400 to-green-500"
          : "bg-white/20 backdrop-blur-sm"
        }`}>
          {rank <= 3 ? <Crown size={14} /> : `#${rank}`}
        </div>
        {isMillion && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold shadow-lg">
            +1M views
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs flex items-center gap-1">
            <Clock size={10} /> {fmtDuration(video.duration)}
          </div>
        )}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-emerald-500/80 flex items-center justify-center backdrop-blur-sm shadow-xl">
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
      <div className="p-4 space-y-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-emerald-400 transition-colors leading-snug">
          {video.title || t("studio.common.noTitle")}
        </h3>
        <div className="flex items-center justify-between text-xs text-foreground/45">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold"><Eye size={11} /> {fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink" /> {fmtNum(video.likes_count)}</span>
          {video.category && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium capitalize">
              {video.category}
            </span>
          )}
        </div>
        <ViewsBar views={video.views} max={maxViews} />
      </div>
    </Link>
  );
}

export default function MaisVistosPage() {
  const { t } = useTranslation();
  useDocumentTitle({ title: "VÃ­deos Mais Vistos - SuckOrSex" });
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
      .order("views", { ascending: false })
      .limit(100);

    if (!vids) { setLoading(false); return; }

    const withLikes: Video[] = await Promise.all(
      (vids as any[]).map(async (v) => {
        const { count } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", v.id);
        return { ...v, likes_count: count ?? 0 };
      })
    );

    withLikes.sort((a, b) => b.views - a.views);
    setVideos(withLikes);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const videoChannel = supabase
      .channel("maisvistos-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => fetchData())
      .subscribe();
    const likesChannel = supabase
      .channel("maisvistos-likes")
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

  const maxViews   = displayed[0]?.views ?? 1;
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-transparent border border-emerald-500/20 p-8">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Eye size={20} className="text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  Mais Vistos
                </h1>
              </div>
              <p className="text-foreground/60 text-sm max-w-md">
                {t("pages.category.maisvistos.desc", { minViews: fmtNum(MIN_VIEWS) })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-emerald-400">{loading ? "â€”" : displayed.length}</p>
                <p className="text-xs text-foreground/45 mt-0.5">{t("pages.category.maisvistos.champions")}</p>
              </div>
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-green-400">{loading ? "â€”" : fmtNum(totalViews)}</p>
                <p className="text-xs text-foreground/45 mt-0.5">{t("pages.category.maisvistos.totalViews")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <Search size={15} className="text-foreground/40 flex-shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pages.category.maisvistos.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30" />
        </div>

        {/* ConteÃºdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
            <p className="text-foreground/40 text-sm">{t("pages.category.maisvistos.loading")}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Eye size={28} className="text-foreground/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/60 font-medium">{t("pages.category.maisvistos.emptyTitle")}</p>
              <p className="text-foreground/35 text-sm max-w-xs">
                {t("pages.category.maisvistos.emptyDesc", { minViews: fmtNum(MIN_VIEWS) })}
              </p>
            </div>
            <Link to="/populares" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm hover:bg-emerald-500/18 transition-all mt-2">
              {t("pages.category.maisvistos.seePopular")} <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((v, i) => <VideoCard key={v.id} video={v} rank={i + 1} maxViews={maxViews} />)}
          </div>
        )}

      </div>
    </Layout>
  );
}
