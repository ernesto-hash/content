// src/pages/Recentes.tsx
// Condição: publicados nos últimos 7 dias
// Realtime: re-fetch automático
// Sem skeleton cards — só mostra vídeos reais ou estado vazio

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Sparkles, Eye, Heart, Play, Search, Clock,
  ChevronRight, Loader2, Film, VolumeX, CalendarDays,
} from "lucide-react";

const DAYS_WINDOW = 7;

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
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return "há menos de 1h";
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function VideoCard({ video }: { video: Video }) {
  const isNew = (Date.now() - new Date(video.created_at).getTime()) < 24 * 3_600_000;
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
      className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-neon-purple/40 hover:bg-white/8 transition-all duration-300"
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
        {isNew && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-neon-purple to-neon-blue text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
            Novo
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs flex items-center gap-1">
            <Clock size={10} /> {fmtDuration(video.duration)}
          </div>
        )}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-neon-purple/80 flex items-center justify-center backdrop-blur-sm shadow-xl">
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
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-neon-purple transition-colors leading-snug">
          {video.title || "Sem título"}
        </h3>
        <div className="flex items-center justify-between text-xs text-foreground/45">
          <span className="flex items-center gap-1"><Eye size={11} /> {fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink" /> {fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1 text-neon-purple/70"><CalendarDays size={10} /> {timeAgo(video.created_at)}</span>
        </div>
        {video.category && (
          <span className="inline-block px-2 py-0.5 rounded-md bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-[10px] font-medium capitalize">
            {video.category}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function RecentesPage() {
  useDocumentTitle({ title: "Vídeos Recentes - SuckOrSex" });
  const [videos, setVideos]   = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState("");
  const [filter, setFilter]   = useState<"todos" | "hoje" | "semana">("todos");

  const fetchData = useCallback(async () => {
    const since = new Date(Date.now() - DAYS_WINDOW * 86_400_000).toISOString();
    const { data: vids } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, video_url, views, duration, category, created_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(120);

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

    setVideos(withLikes);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const videoChannel = supabase
      .channel("recentes-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => fetchData())
      .subscribe();
    const likesChannel = supabase
      .channel("recentes-likes")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_likes" }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(videoChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [fetchData]);

  const displayed = useMemo(() => {
    let list = [...videos];
    if (query.trim()) list = list.filter((v) => (v.title ?? "").toLowerCase().includes(query.toLowerCase()));
    if (filter === "hoje") {
      const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
      list = list.filter((v) => new Date(v.created_at) >= midnight);
    }
    return list;
  }, [videos, query, filter]);

  const todayCount = useMemo(() => {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    return videos.filter((v) => new Date(v.created_at) >= midnight).length;
  }, [videos]);

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/15 via-neon-blue/10 to-transparent border border-neon-purple/20 p-8">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-lg shadow-neon-purple/30">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                  Recentes
                </h1>
              </div>
              <p className="text-foreground/60 text-sm max-w-md">
                Novidades dos últimos <strong className="text-neon-purple">{DAYS_WINDOW} dias</strong>. Conteúdo fresco acabado de publicar.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-neon-purple">{loading ? "—" : videos.length}</p>
                <p className="text-xs text-foreground/45 mt-0.5">esta semana</p>
              </div>
              <div className="text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-black text-neon-blue">{loading ? "—" : todayCount}</p>
                <p className="text-xs text-foreground/45 mt-0.5">hoje</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-foreground/40 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar nos recentes..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30" />
          </div>
          <div className="flex items-center gap-2">
            {(["todos", "hoje", "semana"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                  filter === f
                    ? "bg-neon-purple/15 border-neon-purple/40 text-neon-purple"
                    : "bg-white/5 border-white/10 text-foreground/55 hover:border-white/20"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-neon-purple" />
            <p className="text-foreground/40 text-sm">A carregar vídeos recentes...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles size={28} className="text-foreground/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/60 font-medium">Ainda sem vídeos recentes</p>
              <p className="text-foreground/35 text-sm max-w-xs">
                Os vídeos aparecerão aqui automaticamente assim que forem publicados nos últimos {DAYS_WINDOW} dias.
              </p>
            </div>
            <Link to="/videos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/25 text-neon-purple text-sm hover:bg-neon-purple/18 transition-all mt-2">
              Ver todos os vídeos <ChevronRight size={15} />
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
