import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import {
  Heart, Share2, Play, VolumeX, Volume2,
  ArrowLeft, Loader2, User, Eye, Zap, X,
} from "lucide-react";
import BrandedOverlay from "@/components/BrandedOverlay";

type ShortVideo = {
  id: string;
  slug: string | null;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  user_id: string;
  category: string | null;
  profile?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

function fmtViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

const ShortItem = memo(function ShortItem({
  short,
  videoBasePath,
  modelBasePath,
  isFirst = false,
  onNearEnd,
}: {
  short: ShortVideo;
  videoBasePath: string;
  modelBasePath: string;
  isFirst?: boolean;
  onNearEnd?: () => void;
}) {
  const { t } = useTranslation();
  const containerRef    = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [muted,         setMuted]         = useState(true);
  const [progress,      setProgress]      = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const videoPath = `${videoBasePath}/${short.slug || short.id}`;
  const modelPath = `${modelBasePath}/${short.profile?.id || short.user_id}`;

  const onNearEndRef = useRef(onNearEnd);
  useEffect(() => { onNearEndRef.current = onNearEnd; });

  // IntersectionObserver — só reproduz quando visível
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (isFirst) {
      videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const vid = videoRef.current;
        if (!vid) return;
        if (entry.isIntersecting) {
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
          onNearEndRef.current?.();
        } else {
          vid.pause();
          vid.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
        }
      },
      { threshold: 0.65 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [isFirst]);

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

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    setProgress((vid.currentTime / vid.duration) * 100);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${videoPath}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: short.title ?? "Short", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch { /* cancelled */ }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAuthModal(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full snap-start flex items-center justify-center bg-black flex-shrink-0"
    >
      <div className="relative h-full w-full max-w-[420px] mx-auto overflow-hidden">

        <BrandedOverlay
          username={short.profile?.username}
          showIntro={isFirst}
          onDismiss={() => { videoRef.current?.play().catch(() => {}); }}
        />
        {/* Vídeo */}
        {short.video_url ? (
          <video
            ref={videoRef}
            src={short.video_url}
            poster={short.thumbnail_url ?? undefined}
            className="w-full h-full object-cover cursor-pointer"
            loop
            muted={muted}
            playsInline
            preload={isFirst ? "auto" : "metadata"}
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
          />
        ) : (
          <div
            className="w-full h-full bg-black cursor-pointer"
            style={short.thumbnail_url ? {
              backgroundImage: `url(${short.thumbnail_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : undefined}
            onClick={togglePlay}
          />
        )}

        {/* Barra de progresso */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/15 z-20">
          <div
            className="h-full bg-neon-pink"
            style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
          />
        </div>

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

        {/* Indicador pause */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={28} fill="white" className="text-white ml-1" />
            </div>
          </div>
        )}

        {/* Mute */}
        <button
          onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
          className="absolute top-16 right-4 z-30 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Esquerda — info */}
        <div className="absolute bottom-24 left-4 right-16 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2.5 mb-2">
              <Link to={modelPath} className="flex-shrink-0">
                <div className="w-11 h-11 rounded-full border-2 border-white/50 overflow-hidden bg-white/10 hover:border-neon-pink transition-colors">
                  {short.profile?.avatar_url ? (
                    <img src={short.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={18} className="text-white/60" />
                    </div>
                  )}
                </div>
              </Link>
              <div className="min-w-0">
                <Link
                  to={modelPath}
                  className="block text-sm font-bold text-white leading-tight hover:text-neon-pink transition-colors truncate"
                >
                  {short.profile?.full_name || short.profile?.username || "Modelo"}
                </Link>
                {short.profile?.username && (
                  <p className="text-xs text-white/55">@{short.profile.username}</p>
                )}
              </div>
            </div>

            {short.title && (
              <p className="text-[13px] text-white/90 line-clamp-2 mb-2 leading-snug">
                {short.title}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {short.category && (
                <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-neon-pink text-[10px] font-semibold">
                  {short.category}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-white/45">
                <Eye size={10} />{fmtViews(short.views)}
              </span>
            </div>
          </div>
        </div>

        {/* Direita — acções */}
        <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-5">
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center">
              <Heart size={22} className="text-white" fill="none" />
            </div>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center">
              <Share2 size={20} className="text-white" />
            </div>
            <span className="text-[10px] text-white/60">{t("shorts.share", "Partilhar")}</span>
          </button>

          <Link
            to={videoPath}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-neon-pink flex items-center justify-center hover:bg-neon-pink/80 transition-colors">
              <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
            <span className="text-[10px] text-white/60">{t("shorts.watch", "Ver")}</span>
          </Link>
        </div>
        {showAuthModal && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setShowAuthModal(false); }}
          >
            <div
              className="relative mx-4 bg-[#0e0e14] border border-neon-pink/30 rounded-2xl p-6 text-center max-w-xs w-full"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowAuthModal(false)} className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors">
                <X size={16} />
              </button>
              <Heart size={32} className="text-neon-pink mx-auto mb-3" />
              <p className="text-white font-bold mb-1">{t("shorts.authModal.title", "Cria uma conta gratuita")}</p>
              <p className="text-white/60 text-sm mb-4">{t("shorts.authModal.text", "Para curtir precisas de uma conta gratuita.")}</p>
              <div className="flex flex-col gap-2">
                <Link to="/signup" className="block w-full py-2.5 bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold rounded-xl">
                  {t("shorts.authModal.signup", "Criar conta")}
                </Link>
                <Link to="/login" className="block w-full py-2.5 bg-white/8 border border-white/12 text-white text-sm font-semibold rounded-xl">
                  {t("shorts.authModal.login", "Entrar")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default function ShortsPage() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const [shorts,  setShorts]  = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: videos } = await supabase
        .from("videos")
        .select("id, slug, title, thumbnail_url, video_url, views, duration, created_at, user_id, category")
        .eq("is_short", true)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("views", { ascending: false })
        .limit(20);

      if (!videos || videos.length === 0) {
        setShorts([]);
        setLoading(false);
        return;
      }

      const shuffled = [...(videos as any[])].sort(() => Math.random() - 0.5);
      const userIds = [...new Set(shuffled.map((v: any) => v.user_id))];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const enriched: ShortVideo[] = shuffled.map((v: any) => ({
        ...v,
        profile: profileMap.get(v.user_id),
      }));

      setShorts(enriched);
      setLoading(false);
    })();
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    const { data } = await supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url, video_url, views, duration, created_at, user_id, category")
      .eq("is_short", true)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("views", { ascending: false })
      .range(shorts.length, shorts.length + 9);

    if (!data || data.length === 0) {
      setHasMore(false);
      return;
    }

    const shuffledNew = [...data].sort(() => Math.random() - 0.5);
    const userIds = [...new Set(shuffledNew.map((v: any) => v.user_id))];
    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const enriched: ShortVideo[] = shuffledNew.map((v: any) => ({
      ...v,
      profile: profileMap.get(v.user_id),
    }));

    setShorts(prev => [...prev, ...enriched]);
  }, [shorts.length, hasMore]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">

      {/* Barra superior */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 pt-safe-top py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-black/50 text-white/80 hover:text-white transition-colors pointer-events-auto"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <Zap size={16} className="text-neon-pink" fill="currentColor" />
          <span className="font-black text-white text-lg">Shorts</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={36} className="text-neon-pink animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && shorts.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
          <Zap size={48} className="text-white/15" />
          <p className="text-white/50">{t("shorts.empty", "Sem Shorts disponíveis de momento.")}</p>
          <Link to="/videos" className="text-neon-pink text-sm hover:underline">
            {t("shorts.browseVideos", "Ver todos os vídeos")}
          </Link>
        </div>
      )}

      {/* Scroll TikTok */}
      {!loading && shorts.length > 0 && (
        <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory">
          {shorts.map((short, index) => (
            <ShortItem
              key={short.id}
              short={short}
              videoBasePath="/video"
              modelBasePath="/modelo"
              isFirst={index === 0}
              onNearEnd={index === shorts.length - 2 ? loadMore : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
