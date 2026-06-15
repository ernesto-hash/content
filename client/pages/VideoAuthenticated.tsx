// src/pages/VideoAuthenticated.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Play, Pause, Share2, Bookmark, Sparkles, TrendingUp,
  Eye, ThumbsUp, ThumbsDown, MessageCircle,
  Send, User, Calendar, Award, Volume2, VolumeX,
  Maximize, Minimize, SkipForward, SkipBack,
  ChevronUp, Film, Loader2, Clock,
  Users, CheckCircle,
} from "lucide-react";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import BrandedOverlay from "@/components/BrandedOverlay";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type VideoData = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
  category: string | null;
  duration: number | null;
  user_id: string;
  tags: string[] | null;
};

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Comment = {
  id: string;
  conteudo: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type RecommendedVideo = {
  id: string;
  slug?: string | null;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
};

type FullscreenCapableVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

function fmtViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

function fmtDuration(s: number | null) {
  if (!s) return "";
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtRelative(iso: string, t: (key: string, opts?: object) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("video.time.justNow");
  if (mins < 60) return t("video.time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("video.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 30) return t("video.time.daysAgo", { count: days });
  return fmtDate(iso);
}

function jaViuNestaSessionAuth(videoId: string): boolean {
  const key = `viewed_auth_${videoId}`;
  if (sessionStorage.getItem(key)) return true;
  sessionStorage.setItem(key, "1");
  return false;
}

function isIOSDevice() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  );
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  const fsEl = el as FullscreenCapableElement;
  if (el.requestFullscreen) { await el.requestFullscreen(); return; }
  if (fsEl.webkitRequestFullscreen) { await fsEl.webkitRequestFullscreen(); return; }
  if (fsEl.mozRequestFullScreen) { await fsEl.mozRequestFullScreen(); return; }
  if (fsEl.msRequestFullscreen) { await fsEl.msRequestFullscreen(); }
}

async function exitAnyFullscreen(): Promise<void> {
  const fsDoc = document as FullscreenCapableDocument;
  if (document.exitFullscreen) { await document.exitFullscreen(); return; }
  if (fsDoc.webkitExitFullscreen) { await fsDoc.webkitExitFullscreen(); return; }
  if (fsDoc.mozCancelFullScreen) { await fsDoc.mozCancelFullScreen(); return; }
  if (fsDoc.msExitFullscreen) { await fsDoc.msExitFullscreen(); }
}

function getFullscreenElement(): Element | null {
  const fsDoc = document as FullscreenCapableDocument;
  return (
    document.fullscreenElement ||
    fsDoc.webkitFullscreenElement ||
    fsDoc.mozFullScreenElement ||
    fsDoc.msFullscreenElement ||
    null
  );
}

// ─────────────────────────────────────────────
// Componente auxiliar: link do criador seguro
// para mobile — para a propagação do toque
// para que o player não intercete a navegação
// ─────────────────────────────────────────────
function CreatorLink({
  to,
  title,
  className,
  children,
}: {
  to: string;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  const handleTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(to);
  };

  return (
    <span
      role="link"
      tabIndex={0}
      title={title}
      className={className}
      onClick={handleClick}
      onTouchStart={handleTouch}
      onTouchEnd={(e) => {
        e.stopPropagation();
        navigate(to);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(to);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      {children}
    </span>
  );
}

export default function VideoAuthenticated() {
  const { t } = useTranslation();
  const { slug: id } = useParams<{ slug: string }>();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(id ?? "");
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommended, setRecommended] = useState<RecommendedVideo[]>([]);
  const [allPlatformVideos, setAllPlatformVideos] = useState<RecommendedVideo[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<"left" | "right" | null>(null);

  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount = useRef(0);
  const tapSide = useRef<"left" | "right">("right");
  const isTouchActive = useRef(false);

  const isIOS = useMemo(() => isIOSDevice(), []);
  const isMobile = useMemo(() => isMobileDevice(), []);

  // ── SEO dinâmico — igual ao Video.tsx público ──────────────────────────────
  useDocumentTitle({
    title: video ? `${video.title} - SuckOrSex` : "SuckOrSex - Vídeos Porno Grátis & Conteúdo XXX HD",
    description: video?.description ?? undefined,
    image: video?.thumbnail_url ?? null,
    type: "video.other",
    url: video ? `https://suckorsex.com/video/${video.slug ?? video.id}` : undefined,
  });

  useEffect(() => {
    if (!video) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "video-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title,
      "description": video.description || video.title,
      "thumbnailUrl": video.thumbnail_url,
      "uploadDate": video.created_at,
      "contentUrl": video.video_url,
      "embedUrl": `https://suckorsex.com/video/${video.slug || video.id}`,
      "author": {
        "@type": "Person",
        "name": creator?.full_name || creator?.username || "SuckOrSex",
      },
      "publisher": {
        "@type": "Organization",
        "name": "SuckOrSex",
        "url": "https://suckorsex.com",
      },
    });
    document.head.querySelector("#video-schema")?.remove();
    document.head.appendChild(script);
    return () => { document.getElementById("video-schema")?.remove(); };
  }, [video, creator]);

  const clearControlsTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearControlsTimer();
    const v = videoRef.current;
    if (!v) return;
    if (!v.paused) {
      controlsTimer.current = setTimeout(() => { setShowControls(false); }, 5000);
    }
  }, [clearControlsTimer]);

  const revealControlsOnly = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch((err) => console.warn("Play error:", err));
      setShowControls(true);
      scheduleHideControls();
    } else {
      v.pause();
      clearControlsTimer();
      setShowControls(true);
    }
  }, [scheduleHideControls, clearControlsTimer]);

  const toggleMute = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    revealControlsOnly();
  }, [revealControlsOnly]);

  const handleDesktopAndroidFullscreen = useCallback(async () => {
    try {
      if (!getFullscreenElement()) {
        const target = playerRef.current ?? videoRef.current;
        if (target) { await requestElementFullscreen(target); setIsFullscreen(true); }
      } else {
        await exitAnyFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) { console.warn("Fullscreen error:", err); }
  }, []);

  const handleIOSFullscreen = useCallback(() => {
    try {
      const v = videoRef.current as FullscreenCapableVideo | null;
      if (!v) return;
      if (v.webkitDisplayingFullscreen) { setIsFullscreen(false); return; }
      if (typeof v.webkitEnterFullscreen === "function") {
        v.webkitEnterFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) { console.warn("iOS fullscreen error:", err); }
  }, []);

  const toggleFullscreen = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isIOS) { handleIOSFullscreen(); revealControlsOnly(); return; }
    await handleDesktopAndroidFullscreen();
    revealControlsOnly();
  }, [handleDesktopAndroidFullscreen, handleIOSFullscreen, isIOS, revealControlsOnly]);

  useEffect(() => {
    const handleChange = () => { setIsFullscreen(!!getFullscreenElement()); };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange as EventListener);
    document.addEventListener("mozfullscreenchange", handleChange as EventListener);
    document.addEventListener("MSFullscreenChange", handleChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange as EventListener);
      document.removeEventListener("mozfullscreenchange", handleChange as EventListener);
      document.removeEventListener("MSFullscreenChange", handleChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current as FullscreenCapableVideo | null;
    if (!v) return;
    const onIOSBegin = () => setIsFullscreen(true);
    const onIOSEnd = () => setIsFullscreen(false);
    v.addEventListener("webkitbeginfullscreen", onIOSBegin as EventListener);
    v.addEventListener("webkitendfullscreen", onIOSEnd as EventListener);
    return () => {
      v.removeEventListener("webkitbeginfullscreen", onIOSBegin as EventListener);
      v.removeEventListener("webkitendfullscreen", onIOSEnd as EventListener);
    };
  }, [video?.video_url]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e
      ? (e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX)
      : e.clientX;
    if (clientX === undefined) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    revealControlsOnly();
  }, [revealControlsOnly]);

  const goToPreviousVideo = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!id || allPlatformVideos.length === 0) return;
    const idx = allPlatformVideos.findIndex((item) => item.id === id);
    if (idx === -1) return;
    const prev = allPlatformVideos[idx > 0 ? idx - 1 : allPlatformVideos.length - 1];
    navigate(`/app/video/${prev.slug || prev.id}`);
  }, [allPlatformVideos, id, navigate]);

  const goToNextVideo = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!id || allPlatformVideos.length === 0) return;
    const idx = allPlatformVideos.findIndex((item) => item.id === id);
    if (idx === -1) return;
    const next = allPlatformVideos[idx < allPlatformVideos.length - 1 ? idx + 1 : 0];
    navigate(`/app/video/${next.slug || next.id}`);
  }, [allPlatformVideos, id, navigate]);

  const handleVideoTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // ✅ Ignora toques em links, botões e elementos com data-creator-link
    if (
      target.closest("button") ||
      target.closest("[data-controls]") ||
      target.closest("a") ||
      target.closest("[data-creator-link]")
    ) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    tapSide.current = touch.clientX - rect.left > rect.width / 2 ? "right" : "left";
    tapCount.current += 1;
    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; revealControlsOnly(); }, 280);
    } else if (tapCount.current === 2) {
      if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
      tapCount.current = 0;
      const v = videoRef.current;
      if (v) {
        const delta = tapSide.current === "right" ? 5 : -5;
        v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
        setDoubleTapFeedback(tapSide.current);
        setTimeout(() => setDoubleTapFeedback(null), 700);
        revealControlsOnly();
      }
    }
    isTouchActive.current = true;
    setTimeout(() => { isTouchActive.current = false; }, 500);
  }, [revealControlsOnly]);

  const handlePlayerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchActive.current) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[data-controls]") ||
      target.closest("a") ||
      target.closest("[data-creator-link]")
    ) return;
    revealControlsOnly();
  }, [revealControlsOnly]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/login"; return; }
      setCurrentUserId(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { window.location.href = "/login"; return; }
      setCurrentUserId(session.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchVideo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: vid } = await supabase
      .from("videos")
      .select("id, slug, title, description, video_url, thumbnail_url, views, created_at, category, duration, user_id, tags")
      .eq(isUUID ? "id" : "slug", id).single();
    if (!vid) { setLoading(false); return; }
    setVideo(vid as VideoData);
    if (!jaViuNestaSessionAuth(id)) {
      supabase.from("videos").update({ views: (vid.views ?? 0) + 1 }).eq("id", id).then(() => {});
    }
    const [profRes, subCountRes, lCountRes, dCountRes, allVideosRes] = await Promise.all([
      supabase.from("profiles_public").select("id, username, full_name, avatar_url").eq("id", vid.user_id).single(),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("creator_id", vid.user_id),
      supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("video_id", id).eq("tipo", true),
      supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("video_id", id).eq("tipo", false),
      supabase.from("videos").select("id, slug, title, thumbnail_url, views, duration, created_at")
        .eq("status", "published").eq("visibility", "public").order("created_at", { ascending: false }),
    ]);
    setCreator((profRes.data as Profile) ?? null);
    setSubscriberCount(subCountRes.count ?? 0);
    setLikesCount(lCountRes.count ?? 0);
    setDislikesCount(dCountRes.count ?? 0);
    const platformVideos = (allVideosRes.data ?? []) as RecommendedVideo[];
    setAllPlatformVideos(platformVideos);
    setRecommended(shuffleArray(platformVideos.filter((item) => item.id !== id)).slice(0, 20));
    setLoading(false);
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const { data, count } = await supabase
      .from("comentarios")
      .select("id, conteudo, created_at, user_id, profiles(username, full_name, avatar_url)", { count: "exact" })
      .eq("video_id", id).order("created_at", { ascending: false }).limit(50);
    setComments((data ?? []) as unknown as Comment[]);
    setCommentsCount(count ?? 0);
  }, [id]);

  const fetchUserState = useCallback(async () => {
    if (!id || !currentUserId) return;
    const [likeRes, dislikeRes, subRes] = await Promise.all([
      supabase.from("interacoes").select("id").eq("video_id", id).eq("user_id", currentUserId).eq("tipo", true).maybeSingle(),
      supabase.from("interacoes").select("id").eq("video_id", id).eq("user_id", currentUserId).eq("tipo", false).maybeSingle(),
      supabase.from("subscriptions").select("id").eq("creator_id", video?.user_id ?? "").eq("subscriber_id", currentUserId).maybeSingle(),
    ]);
    setIsLiked(!!likeRes.data);
    setIsDisliked(!!dislikeRes.data);
    setIsSubscribed(!!subRes.data);
  }, [id, currentUserId, video?.user_id]);

  useEffect(() => { fetchVideo(); }, [fetchVideo]);
  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { if (currentUserId) fetchUserState(); }, [fetchUserState, currentUserId]);
  useEffect(() => {
    const h = () => setShowScrollButton(window.scrollY > 400);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (!id) return;
    const ch1 = supabase.channel(`video-auth-${id}-interacoes`)
      .on("postgres_changes", { event: "*", schema: "public", table: "interacoes" }, () => {
        supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("video_id", id).eq("tipo", true)
          .then(({ count }) => setLikesCount(count ?? 0));
        supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("video_id", id).eq("tipo", false)
          .then(({ count }) => setDislikesCount(count ?? 0));
      }).subscribe();
    const ch2 = supabase.channel(`video-auth-${id}-comentarios`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comentarios", filter: `video_id=eq.${id}` },
        () => fetchComments()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [id, fetchComments]);

  const handleLike = async () => {
    if (!currentUserId || !id) return;
    if (isLiked) {
      await supabase.from("interacoes").delete().eq("video_id", id).eq("user_id", currentUserId).eq("tipo", true);
      setIsLiked(false); setLikesCount((n) => Math.max(0, n - 1));
    } else {
      if (isDisliked) {
        await supabase.from("interacoes").delete().eq("video_id", id).eq("user_id", currentUserId).eq("tipo", false);
        setIsDisliked(false); setDislikesCount((n) => Math.max(0, n - 1));
      }
      await supabase.from("interacoes").insert({ video_id: id, user_id: currentUserId, tipo: true });
      setIsLiked(true); setLikesCount((n) => n + 1);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId || !id) return;
    if (isDisliked) {
      await supabase.from("interacoes").delete().eq("video_id", id).eq("user_id", currentUserId).eq("tipo", false);
      setIsDisliked(false); setDislikesCount((n) => Math.max(0, n - 1));
    } else {
      if (isLiked) {
        await supabase.from("interacoes").delete().eq("video_id", id).eq("user_id", currentUserId).eq("tipo", true);
        setIsLiked(false); setLikesCount((n) => Math.max(0, n - 1));
      }
      await supabase.from("interacoes").insert({ video_id: id, user_id: currentUserId, tipo: false });
      setIsDisliked(true); setDislikesCount((n) => n + 1);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUserId || !creator) return;
    if (isSubscribed) {
      await supabase.from("subscriptions").delete().eq("creator_id", creator.id).eq("subscriber_id", currentUserId);
      setIsSubscribed(false); setSubscriberCount((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("subscriptions").insert({ creator_id: creator.id, subscriber_id: currentUserId });
      setIsSubscribed(true); setSubscriberCount((n) => n + 1);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app/video/${id}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) { console.warn("Clipboard error:", err); }
    await supabase.from("partilhas").insert({ video_id: id, user_id: currentUserId, plataforma: "clipboard" });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim() || !id) return;
    setSubmittingComment(true);
    await supabase.from("comentarios").insert({ video_id: id, user_id: currentUserId, conteudo: newComment.trim() });
    setNewComment("");
    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <LayoutAuthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center animate-pulse">
              <Play size={32} className="text-white" />
            </div>
            <p className="text-white/50 text-sm">{t("video.loading")}</p>
          </div>
        </div>
      </LayoutAuthenticated>
    );
  }

  if (!video) {
    return (
      <LayoutAuthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Film size={48} className="text-white/20" />
          <p className="text-white/50">{t("video.notFound")}</p>
          <Link to="/app" className="text-pink-400 text-sm hover:text-pink-300">{t("video.backToHome")}</Link>
        </div>
      </LayoutAuthenticated>
    );
  }

  const creatorName = creator?.full_name || creator?.username || t("common.creator");
  const creatorChannelUrl = creator ? `/app/modelo/${creator.username}` : "#";
  const displayTime = fmtDuration(Math.floor(currentTime));
  const displayDuration = fmtDuration(Math.floor(duration));

  return (
    <LayoutAuthenticated>
      {showScrollButton && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-110 transition-all"
        >
          <ChevronUp size={24} className="text-white" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* ── Player ── */}
            <div
              ref={playerRef}
              className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden select-none ${isFullscreen ? "touch-none" : ""}`}
              onMouseMove={revealControlsOnly}
              onMouseLeave={() => { if (!isMobile && isPlaying) setShowControls(false); }}
              onClick={handlePlayerClick}
              onTouchEnd={handleVideoTouchEnd}
            >
              <BrandedOverlay
                username={creator?.username}
                videoRef={videoRef}
                onDismiss={() => { videoRef.current?.play().catch(() => {}); }}
              />
              {video.video_url ? (
                <>
                  <video
                    ref={videoRef}
                    src={video.video_url}
                    poster={video.thumbnail_url ?? undefined}
                    className="w-full h-full object-contain"
                    preload="metadata"
                    playsInline
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    onTimeUpdate={() => {
                      const v = videoRef.current;
                      if (!v || !v.duration) return;
                      setCurrentTime(v.currentTime);
                      setProgress((v.currentTime / v.duration) * 100);
                    }}
                    onLoadedMetadata={() => {
                      const v = videoRef.current;
                      if (!v) return;
                      setDuration(v.duration);
                      setIsMuted(v.muted);
                    }}
                    onPlay={() => { setIsPlaying(true); scheduleHideControls(); }}
                    onPause={() => { setIsPlaying(false); clearControlsTimer(); setShowControls(true); }}
                    onEnded={() => { setIsPlaying(false); clearControlsTimer(); setShowControls(true); }}
                    onWaiting={() => setBuffering(true)}
                    onCanPlay={() => setBuffering(false)}
                    onPlaying={() => { setBuffering(false); setIsPlaying(true); scheduleHideControls(); }}
                  />

                  {doubleTapFeedback && (
                    <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 ${doubleTapFeedback === "left" ? "left-8" : "right-8"}`}>
                      <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                        {doubleTapFeedback === "left" ? <SkipBack size={20} className="text-white" /> : <SkipForward size={20} className="text-white" />}
                        <span className="text-white text-sm font-semibold">{doubleTapFeedback === "left" ? "-5s" : "+5s"}</span>
                      </div>
                    </div>
                  )}

                  {buffering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 size={28} className="text-white/80 animate-spin" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  {video.thumbnail_url
                    ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-50" />
                    : <Film size={64} className="text-white/20" />
                  }
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/40 text-sm">{t("video.unavailable")}</p>
                  </div>
                </div>
              )}

              {video.video_url && (
                <div data-controls className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); togglePlay(); }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all backdrop-blur-sm active:scale-95"
                  >
                    {isPlaying ? <Pause size={28} fill="white" className="text-white" /> : <Play size={28} fill="white" className="text-white ml-1" />}
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-3 space-y-2">
                    <div
                      className="h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2.5 transition-all group/p"
                      onClick={seek}
                      onTouchStart={(e) => { e.stopPropagation(); seek(e); }}
                      onTouchMove={(e) => { e.stopPropagation(); seek(e); }}
                      onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    >
                      <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full relative pointer-events-none" style={{ width: `${progress}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/p:opacity-100 transition-opacity shadow-md" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <button onClick={goToPreviousVideo} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors active:scale-95">
                          <SkipBack size={16} className="text-white" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); togglePlay(); }} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors active:scale-95">
                          {isPlaying ? <Pause size={16} fill="white" className="text-white" /> : <Play size={16} fill="white" className="text-white ml-0.5" />}
                        </button>
                        <button onClick={goToNextVideo} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors active:scale-95">
                          <SkipForward size={16} className="text-white" />
                        </button>
                        <span className="text-white/70 text-[11px] sm:text-xs ml-1 tabular-nums whitespace-nowrap">{displayTime} / {displayDuration}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <button onClick={toggleMute} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors active:scale-95">
                          {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
                        </button>
                        <button onClick={toggleFullscreen} className="hidden sm:flex w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 items-center justify-center transition-colors active:scale-95">
                          {isFullscreen ? <Minimize size={16} className="text-white" /> : <Maximize size={16} className="text-white" />}
                        </button>
                        <button onClick={toggleFullscreen} className="sm:hidden min-w-[44px] h-10 px-3 rounded-full bg-white/15 active:bg-white/25 flex items-center justify-center transition-colors active:scale-95 backdrop-blur-sm border border-white/10">
                          {isFullscreen ? <Minimize size={18} className="text-white" /> : <Maximize size={18} className="text-white" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Info do vídeo ── */}
            <div className="space-y-4">
              <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">{video.title}</h1>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">

                  {/* ── AVATAR — clicável em mobile e desktop ── */}
                  <CreatorLink
                    to={creatorChannelUrl}
                    title={t("video.viewChannel", { name: creatorName })}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-neon-pink/50 transition-all"
                  >
                    {creator?.avatar_url ? (
                      <img src={creator.avatar_url} alt={creatorName} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <User size={20} className="text-white pointer-events-none" />
                    )}
                  </CreatorLink>

                  <div>
                    <div className="flex items-center gap-1.5">
                      {/* ── NOME — clicável em mobile e desktop ── */}
                      <CreatorLink
                        to={creatorChannelUrl}
                        title={t("video.viewChannel", { name: creatorName })}
                        className="font-semibold text-white text-sm hover:text-neon-pink transition-colors"
                      >
                        {creatorName}
                      </CreatorLink>
                      <Sparkles size={13} className="text-pink-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-white/45">{t("video.subscribers", { count: fmtViews(subscriberCount) as unknown as number })}</p>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    className={`ml-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      isSubscribed
                        ? "bg-white/10 text-white/70 hover:bg-white/15 border border-white/10"
                        : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                    }`}
                  >
                    {isSubscribed ? <><CheckCircle size={14} />{t("video.subscribed")}</> : <><Users size={14} />{t("video.subscribe")}</>}
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <button onClick={handleLike} className={`flex items-center gap-1.5 px-3.5 py-2 transition-colors ${isLiked ? "text-pink-400 bg-pink-500/10" : "text-white/50 hover:text-pink-400 hover:bg-white/5"}`}>
                      <ThumbsUp size={16} className={isLiked ? "fill-pink-400" : ""} />
                      <span className="text-sm font-medium">{fmtViews(likesCount)}</span>
                    </button>
                    <div className="w-px h-5 bg-white/10" />
                    <button onClick={handleDislike} className={`flex items-center gap-1.5 px-3.5 py-2 transition-colors ${isDisliked ? "text-orange-400 bg-orange-500/10" : "text-white/50 hover:text-orange-400 hover:bg-white/5"}`}>
                      <ThumbsDown size={16} className={isDisliked ? "fill-orange-400" : ""} />
                      <span className="text-sm font-medium">{fmtViews(dislikesCount)}</span>
                    </button>
                  </div>
                  <button onClick={handleShare} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${shareCopied ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-white/50 hover:text-blue-400 bg-white/5 border-white/10"}`}>
                    <Share2 size={16} />
                    <span>{shareCopied ? t("video.shared") : t("video.share")}</span>
                  </button>
                  <button onClick={() => setIsSaved(!isSaved)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${isSaved ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-white/50 hover:text-purple-400 bg-white/5 border-white/10"}`}>
                    <Bookmark size={16} className={isSaved ? "fill-purple-400" : ""} />
                    <span>{t("video.save")}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><Eye size={13} />{t("video.views", { count: fmtViews(video.views) as unknown as number })}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(video.created_at)}</span>
                  {video.category && <span className="flex items-center gap-1.5"><Award size={13} />{video.category}</span>}
                  {video.duration && <span className="flex items-center gap-1.5"><Clock size={13} />{fmtDuration(video.duration)}</span>}
                </div>
                {video.description && (
                  <p className="text-white/65 text-sm leading-relaxed whitespace-pre-line">{video.description}</p>
                )}
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {video.tags.map((t) => (
                      <a
                        key={t}
                        href={`/tag/${encodeURIComponent(t)}`}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white/[0.06] text-white/40 hover:text-neon-pink hover:bg-neon-pink/10 transition-colors border border-white/6"
                      >
                        #{t}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Comentários ── */}
            <div className="space-y-5 pt-2">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <MessageCircle size={17} className="text-pink-400" />
                {t("video.comments.title")} <span className="text-white/30 text-sm font-normal">({commentsCount})</span>
              </h3>

              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/50 to-purple-500/50 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
                <div className="flex-1 relative">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t("video.comments.placeholder")} disabled={submittingComment}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-pink-500/40 focus:border-pink-500/30 disabled:opacity-50" />
                  <button type="submit" disabled={submittingComment || !newComment.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-pink-400 disabled:opacity-30 transition-colors">
                    {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </form>

              {comments.length === 0 ? (
                <div className="text-center py-10 text-white/25 text-sm">
                  <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                  {t("video.comments.empty")}
                </div>
              ) : (
                <div className="space-y-5">
                  {comments.map((comment) => {
                    const cUser = comment.profiles;
                    const cName = cUser?.full_name || cUser?.username || t("video.comments.userDefault");
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/40 to-purple-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {cUser?.avatar_url ? <img src={cUser.avatar_url} alt={cName} className="w-full h-full object-cover" /> : <User size={13} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white/80 truncate">{cName}</span>
                            <span className="text-[10px] text-white/25 flex-shrink-0">{fmtRelative(comment.created_at, t)}</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed break-words">{comment.conteudo}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Recomendados ── */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp size={17} className="text-pink-400" />
              {t("video.recommended.title")}
            </h3>
            {recommended.length === 0 ? (
              <p className="text-white/25 text-sm py-4">{t("video.recommended.empty")}</p>
            ) : (
              <div className="space-y-1">
                {recommended.map((rec) => (
                  <div key={rec.id} className="group flex gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer" onClick={() => navigate(`/app/video/${rec.slug || rec.id}`)}>
                    <div className="relative w-36 h-[81px] flex-shrink-0 rounded-lg overflow-hidden bg-black/40">
                      {rec.thumbnail_url
                        ? <img src={rec.thumbnail_url} alt={rec.title ?? ""} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><Film size={20} className="text-white/20" /></div>
                      }
                      {rec.duration && <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded">{fmtDuration(rec.duration)}</span>}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                          <Play size={14} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-xs font-semibold text-white/80 line-clamp-2 group-hover:text-pink-300 transition-colors leading-snug">{rec.title || t("common.noTitle")}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-white/30">
                        <Eye size={9} />{fmtViews(rec.views)}
                        <span className="mx-0.5">·</span>
                        {fmtRelative(rec.created_at, t)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutAuthenticated>
  );
}