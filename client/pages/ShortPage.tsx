import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, VolumeX, Volume2, User, Eye, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import BrandedOverlay from "@/components/BrandedOverlay";

type ShortData = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

function fmtViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

export default function ShortPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<ShortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("id, slug, title, thumbnail_url, video_url, views, created_at, profiles(full_name, username, avatar_url)")
        .eq("slug", slug)
        .eq("is_short", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setVideo(data as unknown as ShortData);
      }
      setLoading(false);
    })();
  }, [slug]);

  useDocumentTitle({
    title: video
      ? `${video.title} — Short | SuckOrSex`
      : "Short | SuckOrSex",
    description: video
      ? `${video.title} — Short exclusivo de ${video.profiles?.full_name ?? video.profiles?.username ?? "modelo"} no SuckOrSex.`
      : undefined,
    image: video?.thumbnail_url ?? null,
    type: "video.other",
    url: video ? `https://suckorsex.com/short/${video.slug}` : undefined,
  });

  useEffect(() => {
    if (!video) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "short-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title,
      "description": video.title,
      "thumbnailUrl": video.thumbnail_url,
      "uploadDate": video.created_at,
      "contentUrl": video.video_url,
      "embedUrl": `https://suckorsex.com/short/${video.slug}`,
      "author": {
        "@type": "Person",
        "name": video.profiles?.full_name || video.profiles?.username || "SuckOrSex",
      },
      "publisher": {
        "@type": "Organization",
        "name": "SuckOrSex",
        "url": "https://suckorsex.com",
      },
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("short-schema")?.remove();
    };
  }, [video]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 size={36} className="text-neon-pink animate-spin" />
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-center px-8">
        <Zap size={48} className="text-white/15" />
        <p className="text-white/50">Short não encontrado.</p>
        <Link to="/shorts" className="text-neon-pink text-sm hover:underline">Ver todos os Shorts</Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Barra superior */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-black/50 text-white/80 hover:text-white transition-colors pointer-events-auto"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <Zap size={16} className="text-neon-pink" fill="currentColor" />
          <span className="font-black text-white text-lg">Short</span>
        </div>
      </div>

      {/* Player 9:16 centralizado */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="relative bg-black overflow-hidden"
          style={{ aspectRatio: "9/16", height: "100dvh", maxWidth: "calc(100dvh * 9 / 16)" }}
        >
          {/* Progresso */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/15 z-20">
            <div
              className="h-full bg-neon-pink"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
          </div>

          <BrandedOverlay
            username={video?.profiles?.username}
            onDismiss={() => { videoRef.current?.play().catch(() => {}); }}
          />
          {video.video_url ? (
            <video
              ref={videoRef}
              src={video.video_url}
              poster={video.thumbnail_url ?? undefined}
              className="w-full h-full object-cover cursor-pointer"
              loop
              muted={muted}
              playsInline
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={() => {
                const vid = videoRef.current;
                if (vid?.duration) setProgress((vid.currentTime / vid.duration) * 100);
              }}
              onClick={togglePlay}
            />
          ) : (
            <div
              className="w-full h-full bg-black"
              style={video.thumbnail_url ? {
                backgroundImage: `url(${video.thumbnail_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : undefined}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                <Play size={28} fill="white" className="text-white ml-1" />
              </div>
            </div>
          )}

          {/* Mute */}
          <button
            onClick={() => setMuted(m => !m)}
            className="absolute top-16 right-4 z-30 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Info */}
          <div className="absolute bottom-8 left-4 right-4 z-10">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-white/10 flex-shrink-0">
                {video.profiles?.avatar_url ? (
                  <img src={video.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={16} className="text-white/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {video.profiles?.full_name || video.profiles?.username || "Modelo"}
                </p>
                {video.profiles?.username && (
                  <p className="text-xs text-white/55">@{video.profiles.username}</p>
                )}
              </div>
            </div>

            <p className="text-[13px] text-white/90 line-clamp-2 mb-2 leading-snug">{video.title}</p>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-white/45">
                <Eye size={10} />{fmtViews(video.views)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
