import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, Film, VolumeX, Play } from "lucide-react";

export type VideoCardData = {
  id: string;
  slug?: string | null;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  likes_count: number;
  duration: number | null;
  created_at: string;
  tags?: string[] | null;
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

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

export default function VideoCard({ video }: { video: VideoCardData }) {
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

  // Desktop
  const handleMouseEnter = () => { if (!isTouchDevice()) startPreview(); };
  const handleMouseLeave = () => { if (!isTouchDevice()) stopPreview(); };

  // Mobile: tap navigates, hold (≥300ms) previews
  const handleTouchStart = () => {
    wasHoldRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      wasHoldRef.current = true;
      startPreview();
    }, 300);
  };
  const handleTouchEnd = () => {
    clearTimeout(holdTimerRef.current);
    if (wasHoldRef.current) stopPreview();
  };
  // Prevent navigation when touch was a hold
  const handleClick = (e: React.MouseEvent) => {
    if (wasHoldRef.current) {
      e.preventDefault();
      wasHoldRef.current = false;
    }
  };

  return (
    <Link
      to={`/video/${video.slug || video.id}`}
      className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 hover:bg-white/8 transition-all duration-300"
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="relative aspect-video bg-black/30 overflow-hidden">
        {/* Thumbnail */}
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title ?? ""}
            className="w-full h-full object-cover"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-foreground/20"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}
          >
            <Film size={32} />
          </div>
        )}

        {/* Video preview element — src set only on hover/touch */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />

        {/* Duration badge */}
        {video.duration != null && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs">
            {fmtDuration(video.duration)}
          </div>
        )}

        {/* Play overlay — hidden while previewing */}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl border border-white/30">
              <Play size={22} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Muted indicator — visible only during preview */}
        {isPreviewing && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={12} className="text-white" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-white transition-colors leading-snug">
          {video.title || "Sem título"}
        </h3>
        <div className="flex items-center justify-between text-xs text-foreground/45">
          <span className="flex items-center gap-1"><Eye size={11} /> {fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-rose-400" /> {fmtNum(video.likes_count)}</span>
          <span>{fmtDate(video.created_at)}</span>
        </div>
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {video.tags.slice(0, 4).map((t) => (
              <a
                key={t}
                href={`/tag/${encodeURIComponent(t)}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-foreground/35 hover:text-neon-pink hover:bg-neon-pink/8 transition-colors"
              >
                #{t}
              </a>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
