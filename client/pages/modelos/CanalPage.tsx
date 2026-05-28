// src/pages/modelos/CanalPage.tsx
// Página completa do canal de um modelo — visível sem conta
// Rota: /modelo/:id
//
// Secções:
//   • Banner + capa gerada a partir dos thumbnails
//   • Perfil: avatar, nome, badge, stats, botões (Subscrever / Mensagem / Partilhar)
//   • Tabs: Vídeos | Populares | Sobre
//   • Vídeo em destaque (pinned — o mais visto)
//   • Grelha de vídeos com grid/list toggle
//   • Auth gate em todas as interações directas
//   • Realtime: novo vídeo aparece sem refresh

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AuthPopup from "./AuthPopup";
import {
  VideoItem, fmtNum, fmtDuration, fmtRelative, fmtDate,
  GRADIENTS,
} from "./types";
import {
  Play, Eye, Heart, Film, Loader2, ArrowLeft,
  Bell, BellOff, MessageCircle, Share2, CheckCircle,
  Users, User, Calendar, Grid3x3, List, Clock,
  TrendingUp, Star, Pin, ChevronRight, Info,
  Copy, Check, VolumeX,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos locais
// ─────────────────────────────────────────────
type FullCreator = {
  id: string;
  slug: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  video_count: number;
  total_views: number;
  total_likes: number;
  subscriber_count: number;
  cover_thumbs: string[];
};

type TabId = "videos" | "populares" | "sobre";

// ─────────────────────────────────────────────
// Helpers de preview
// ─────────────────────────────────────────────
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

// ─────────────────────────────────────────────
// Mini card de vídeo reutilizável
// ─────────────────────────────────────────────
const VideoGridCard = memo(function VideoGridCard({ video, featured = false, authenticated = false }: { video: VideoItem; featured?: boolean; authenticated?: boolean }) {
  const { t } = useTranslation();
  const videoSlugOrId = video.slug || video.id;
  const videoPath = authenticated ? `/app/video/${videoSlugOrId}` : `/video/${videoSlugOrId}`;
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
    <Link
      to={videoPath}
      className={`group block ${featured ? "col-span-2 row-span-2 sm:col-span-1" : ""}`}
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)", borderRadius: "0.75rem" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className={`relative rounded-xl overflow-hidden bg-white/5 mb-2 aspect-video`}>
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title ?? ""}
            loading="lazy"
            width={320} height={180}
            className="w-full h-full object-cover"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}>
            <Film size={featured ? 32 : 22} className="text-white/15" />
          </div>
        )}

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />

        {/* Hover play */}
        {!isPreviewing && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-neon-pink scale-0 group-hover:scale-100 transition-transform duration-300 flex items-center justify-center shadow-lg shadow-neon-pink/30">
              <Play size={17} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Duration */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono rounded">
            {fmtDuration(video.duration)}
          </div>
        )}

        {/* Category */}
        {video.category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-neon-pink text-[9px] font-semibold rounded-full border border-neon-pink/20 capitalize">
            {video.category}
          </div>
        )}

        {/* Featured pin badge */}
        {featured && !isPreviewing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
            <Pin size={9} fill="currentColor" /> {t("models.channel.featured")}
          </div>
        )}

        {isPreviewing && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={12} className="text-white" />
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
        {video.title || t("common.noTitle")}
      </p>
      <div className="flex items-center gap-2.5 mt-1 text-[10px] text-foreground/33">
        <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(video.views)}</span>
        <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/50" />{fmtNum(video.likes_count)}</span>
        <span>{fmtRelative(video.created_at, t)}</span>
      </div>
    </Link>
  );
});

const VideoListCard = memo(function VideoListCard({ video, authenticated = false }: { video: VideoItem; authenticated?: boolean }) {
  const { t } = useTranslation();
  const videoSlugOrId = video.slug || video.id;
  const videoPath = authenticated ? `/app/video/${videoSlugOrId}` : `/video/${videoSlugOrId}`;
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
    <Link
      to={videoPath}
      className="group flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] hover:border-white/14 transition-all"
      style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="relative w-40 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt=""
            loading="lazy" width={160} height={90}
            className="w-full h-full object-cover"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}>
            <Film size={16} className="text-white/15" />
          </div>
        )}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-neon-pink/85 flex items-center justify-center">
              <Play size={14} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {isPreviewing && (
          <div className="absolute top-1 right-1 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={10} className="text-white" />
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[8px] font-mono rounded">
            {fmtDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug mb-1.5">
          {video.title || t("common.noTitle")}
        </p>
        {video.category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neon-pink/70 capitalize border border-neon-pink/15">
            {video.category}
          </span>
        )}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-foreground/33">
          <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><Heart size={10} className="text-neon-pink/50" />{fmtNum(video.likes_count)}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{fmtRelative(video.created_at, t)}</span>
        </div>
      </div>
    </Link>
  );
});

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function CanalPage({ authenticated = false }: { authenticated?: boolean }) {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(slug ?? "");
  const LayoutWrapper = authenticated ? LayoutAuthenticated : Layout;
  const backPath = authenticated ? "/app/modelos" : "/modelos";

  const [creator, setCreator]             = useState<FullCreator | null>(null);
  const [allVideos, setAllVideos]         = useState<VideoItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [activeTab, setActiveTab]         = useState<TabId>("videos");
  const [viewMode, setViewMode]           = useState<"grid" | "list">("grid");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [creatorId, setCreatorId]         = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed]   = useState(false);
  const [subCount, setSubCount]           = useState(0);
  const [showAuth, setShowAuth]           = useState(false);
  const [authAction, setAuthAction]       = useState("subscribe");
  const [linkCopied, setLinkCopied]       = useState(false);

  // ── Auth ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setCurrentUserId(s?.user?.id ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  // ── Fetch criador ─────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const profileQ = isUUID
      ? supabase.from("profiles_public").select("id, username, full_name, avatar_url, created_at").eq("id", slug).single()
      : supabase.from("profiles_public").select("id, username, full_name, avatar_url, created_at").eq("slug", slug).single();

    profileQ.then(async (profRes) => {
      if (!profRes.data) { setLoading(false); return; }
      const cid = (profRes.data as any).id as string;
      setCreatorId(cid);

      const [vcRes, vrRes, scRes, lkRes, thRes] = await Promise.all([
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", cid).eq("status", "published").eq("visibility", "public"),
        supabase.from("videos").select("views").eq("user_id", cid).eq("status", "published").eq("visibility", "public"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("creator_id", cid),
        supabase.from("interacoes").select("*", { count: "exact", head: true }).eq("tipo", true),
        supabase.from("videos").select("thumbnail_url").eq("user_id", cid).eq("status", "published").eq("visibility", "public").order("views", { ascending: false }).limit(4),
      ]);

      const totalViews = ((vrRes.data ?? []) as any[]).reduce((a: number, v: any) => a + (v.views ?? 0), 0);
      const thumbs = ((thRes.data ?? []) as any[]).map((v: any) => v.thumbnail_url).filter(Boolean) as string[];
      setCreator({
        ...(profRes.data as any),
        video_count:      vcRes.count ?? 0,
        total_views:      totalViews,
        total_likes:      lkRes.count ?? 0,
        subscriber_count: scRes.count ?? 0,
        cover_thumbs:     thumbs,
      });
      setSubCount(scRes.count ?? 0);
      setLoading(false);
    });
  }, [slug, isUUID]);

  // ── Subscrição do utilizador ──────────────────
  useEffect(() => {
    if (!currentUserId || !creatorId) return;
    supabase.from("subscriptions").select("id").eq("creator_id", creatorId).eq("subscriber_id", currentUserId).maybeSingle()
      .then(({ data }) => setIsSubscribed(!!data));
  }, [currentUserId, creatorId]);

  // ── Fetch vídeos ──────────────────────────────
  const fetchVideos = useCallback(async () => {
    if (!creatorId) return;
    setLoadingVideos(true);
    const { data } = await supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url, video_url, views, duration, created_at, category")
      .eq("user_id", creatorId).eq("status", "published").eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(80);

    const vids = (data ?? []) as Omit<VideoItem, "likes_count">[];
    const withLikes = await Promise.all(
      vids.map(async (v) => {
        const { count } = await supabase.from("interacoes").select("*", { count: "exact", head: true })
          .eq("video_id", v.id).eq("tipo", true);
        return { ...v, likes_count: count ?? 0 };
      })
    );
    setAllVideos(withLikes);
    setLoadingVideos(false);
  }, [creatorId]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  // ── Realtime ──────────────────────────────────
  useEffect(() => {
    if (!creatorId) return;
    const ch = supabase.channel(`canal-page-${creatorId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" },
        (payload) => { if ((payload.new as any)?.user_id === creatorId) fetchVideos(); }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [creatorId, fetchVideos]);

  // ── Ações ─────────────────────────────────────
  const requireAuth = (action: string) => {
    setAuthAction(action);
    setShowAuth(true);
  };

  const handleSubscribe = async () => {
    if (!currentUserId) { requireAuth("subscribe"); return; }
    if (!creatorId) return;
    if (isSubscribed) {
      await supabase.from("subscriptions").delete().eq("creator_id", creatorId).eq("subscriber_id", currentUserId);
      setIsSubscribed(false);
      setSubCount((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("subscriptions").insert({ creator_id: creatorId, subscriber_id: currentUserId });
      setIsSubscribed(true);
      setSubCount((n) => n + 1);
    }
  };

  const handleShare = async () => {
    const canonicalSlug = creator?.slug || creatorId;
    const url = `${window.location.origin}/modelo/${canonicalSlug}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2200);
    if (creatorId) {
      await supabase.from("partilhas").insert({ video_id: creatorId, user_id: currentUserId ?? null, plataforma: "canal_clipboard" });
    }
  };

  // Derivados dos vídeos
  const pinnedVideo   = allVideos.length > 0 ? [...allVideos].sort((a, b) => b.views - a.views)[0] : null;
  const popularVideos = [...allVideos].sort((a, b) => b.likes_count - a.likes_count);
  const recentVideos  = allVideos;

  // ── SEO ───────────────────────────────────────
  const creatorNameForSEO = creator ? (creator.full_name || creator.username) : "";
  useDocumentTitle(
    creator
      ? {
          title: `${creatorNameForSEO} - Vídeos Grátis | SuckOrSex`,
          description: `Assiste a todos os vídeos de ${creatorNameForSEO} grátis. ${creator.video_count} vídeos publicados no SuckOrSex.`,
          image: creator.avatar_url,
        }
      : { title: "SuckOrSex - Vídeos Porno Grátis & Conteúdo XXX HD" }
  );

  useEffect(() => {
    if (!creator) return;
    const canonicalSlug = creator.slug || creator.id;
    const name = creator.full_name || creator.username;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "profile-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "name": name,
      "url": `https://suckorsex.com/modelo/${canonicalSlug}`,
      "mainEntity": {
        "@type": "Person",
        "name": name,
        "image": creator.avatar_url,
        "description": `Vídeos de ${name} no SuckOrSex`,
      },
    });
    document.head.appendChild(script);
    return () => { document.getElementById("profile-schema")?.remove(); };
  }, [creator]);

  // ─────────────────────────────────────────────
  // Loading / Not found
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-3">
            <Loader2 size={28} className="animate-spin text-neon-purple/50 mx-auto" />
            <p className="text-foreground/30 text-sm">{t("models.channel.loading")}</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!creator) {
    return (
      <LayoutWrapper>
        <div className="max-container safe-area py-24 text-center space-y-4">
          <Users size={40} className="mx-auto text-white/12" />
          <p className="text-foreground/45">{t("models.channel.notFound")}</p>
          <button onClick={() => navigate(backPath)} className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors">
            {t("models.channel.backToModels")}
          </button>
        </div>
      </LayoutWrapper>
    );
  }

  const creatorName = creator.full_name || creator.username;
  const gradient = GRADIENTS[creator.id.charCodeAt(0) % GRADIENTS.length];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <LayoutWrapper>
      <div className="pb-16">

        {/* ══════════════════════════════════════════
            BANNER DE CAPA — mosaico de thumbnails
        ══════════════════════════════════════════ */}
        <div className="relative w-full h-52 sm:h-64 overflow-hidden">
          {creator.cover_thumbs.length >= 2 ? (
            <div className="flex h-full gap-0.5">
              {/* Imagem grande à esquerda */}
              <div className="relative flex-[3] overflow-hidden">
                <img src={creator.cover_thumbs[0]} alt="" className="w-full h-full object-cover" />
              </div>
              {/* Coluna com imagens menores à direita */}
              <div className="flex flex-col gap-0.5 flex-[1]">
                {creator.cover_thumbs.slice(1, 4).map((url, i) => (
                  <div key={i} className="flex-1 overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : creator.cover_thumbs.length === 1 ? (
            <img src={creator.cover_thumbs[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          )}

          {/* Gradiente de baixo — transição para o fundo da página */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

          {/* Gradiente lateral esquerdo suave */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />

          {/* Botão voltar */}
          <button
            onClick={() => navigate(backPath)}
            className="absolute top-4 left-4 sm:left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white/65 text-xs hover:bg-black/70 hover:text-white transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={13} /> {t("models.channel.backBtn")}
          </button>
        </div>

        {/* ══════════════════════════════════════════
            PERFIL — sobreposto ao banner
        ══════════════════════════════════════════ */}
        <div className="max-container safe-area -mt-16 relative z-10">

          {/* Linha: avatar + info + botões */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-6">

            {/* Avatar + nome */}
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-background overflow-hidden shadow-2xl flex-shrink-0 bg-white/5">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creatorName} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <User size={34} className="text-white/30" />
                  </div>
                )}
              </div>
              <div className="pb-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{creatorName}</h1>
                  <div className="w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center shadow-sm">
                    <CheckCircle size={11} fill="white" className="text-white" />
                  </div>
                </div>
                <p className="text-foreground/38 text-sm">@{creator.username}</p>
                <p className="text-foreground/25 text-xs flex items-center gap-1">
                  <Calendar size={10} /> {t("models.channel.memberSince", { date: fmtDate(creator.created_at) })}
                </p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Partilhar */}
              <button
                onClick={handleShare}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  linkCopied
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-white/5 border-white/10 text-foreground/55 hover:bg-white/9 hover:text-white"
                }`}
              >
                {linkCopied ? <><Check size={14} />{t("models.channel.copied")}</> : <><Share2 size={14} />{t("models.channel.share")}</>}
              </button>

              {/* Mensagem */}
              <button
                onClick={() => !currentUserId ? requireAuth("message") : undefined}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 text-foreground/55 hover:bg-white/9 hover:text-white transition-all"
              >
                <MessageCircle size={14} />
                {t("models.channel.message")}
              </button>

              {/* Subscrever */}
              <button
                onClick={handleSubscribe}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isSubscribed
                    ? "bg-white/7 border border-white/10 text-white/45 hover:bg-white/11"
                    : "bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:shadow-lg hover:shadow-neon-pink/22 hover:scale-[1.02]"
                }`}
              >
                {isSubscribed
                  ? <><BellOff size={15} />{t("common.subscribed")}</>
                  : <><Bell size={15} />{t("common.subscribe")}</>
                }
              </button>
            </div>
          </div>

          {/* ── Stats do canal ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: t("models.stats.videos"),        value: fmtNum(creator.video_count),  icon: Film,  color: "text-neon-pink",   bg: "from-neon-pink/8 to-transparent"   },
              { label: t("models.channel.stats.views"), value: fmtNum(creator.total_views),  icon: Eye,   color: "text-neon-blue",   bg: "from-neon-blue/8 to-transparent"   },
              { label: t("models.channel.subscribers"), value: fmtNum(subCount),             icon: Users, color: "text-neon-purple", bg: "from-neon-purple/8 to-transparent" },
              { label: t("models.channel.stats.likes"), value: fmtNum(creator.total_likes),  icon: Heart, color: "text-rose-400",    bg: "from-rose-400/8 to-transparent"    },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`relative overflow-hidden bg-gradient-to-br ${bg} border border-white/7 rounded-2xl p-4 text-center`}>
                <Icon size={18} className={`mx-auto mb-1.5 ${color}`} />
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[11px] text-foreground/30 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              TABS — Vídeos | Populares | Sobre
          ══════════════════════════════════════════ */}
          <div className="flex items-center justify-between mb-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-xl p-1">
              {([
                ["videos",     t("models.channel.tabs.videos"),  Film],
                ["populares",  t("models.channel.tabs.popular"), TrendingUp],
                ["sobre",      t("models.channel.tabs.about"),   Info],
              ] as [TabId, string, React.ElementType][]).map(([tab, label, Icon]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-neon-pink text-white shadow-sm"
                      : "text-foreground/45 hover:text-foreground/70"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  {tab === "videos" && !loadingVideos && creator.video_count > 0 && (
                    <span className={`text-[10px] font-normal ${activeTab === tab ? "text-white/70" : "text-foreground/30"}`}>
                      ({creator.video_count})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View mode (só nas tabs de vídeos) */}
            {activeTab !== "sobre" && (
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/38 hover:text-foreground/65"}`}
                >
                  <Grid3x3 size={13} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/38 hover:text-foreground/65"}`}
                >
                  <List size={13} />
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
              CONTEÚDO DAS TABS
          ══════════════════════════════════════════ */}

          {/* ── Tab: Vídeos ── */}
          {activeTab === "videos" && (
            <>
              {loadingVideos ? (
                <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="aspect-video rounded-xl bg-white/5" />
                      <div className="h-3.5 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : allVideos.length === 0 ? (
                <EmptyChannel onSubscribe={handleSubscribe} isSubscribed={isSubscribed} />
              ) : (
                <div className="space-y-8">
                  {/* Vídeo em destaque */}
                  {pinnedVideo && (
                    <div>
                      <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Pin size={12} className="text-amber-400" fill="currentColor" /> {t("models.channel.featured")}
                      </h3>
                      <Link to={authenticated ? `/app/video/${pinnedVideo.slug || pinnedVideo.id}` : `/video/${pinnedVideo.slug || pinnedVideo.id}`} className="group relative block rounded-2xl overflow-hidden bg-white/5 border border-white/8 hover:border-white/15 transition-all">
                        <div className="relative aspect-video sm:aspect-[21/8]">
                          {pinnedVideo.thumbnail_url ? (
                            <img src={pinnedVideo.thumbnail_url} alt="" className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.02] transition-all duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Film size={40} className="text-white/15" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          {/* Play central */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-neon-pink group-hover:border-neon-pink transition-all duration-300 shadow-xl">
                              <Play size={26} fill="white" className="text-white ml-1" />
                            </div>
                          </div>
                          {/* Info no fundo */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-white font-bold text-base sm:text-lg line-clamp-1 group-hover:text-neon-pink transition-colors">
                              {pinnedVideo.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                              <span className="flex items-center gap-1"><Eye size={11} />{fmtNum(pinnedVideo.views)}</span>
                              <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink/70" />{fmtNum(pinnedVideo.likes_count)}</span>
                              {pinnedVideo.duration && <span className="flex items-center gap-1"><Clock size={11} />{fmtDuration(pinnedVideo.duration)}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Todos os vídeos */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Film size={12} /> {t("models.channel.allVideos")}
                    </h3>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {allVideos.map((v) => <VideoGridCard key={v.id} video={v} authenticated={authenticated} />)}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allVideos.map((v) => <VideoListCard key={v.id} video={v} authenticated={authenticated} />)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Tab: Populares ── */}
          {activeTab === "populares" && (
            <>
              {loadingVideos ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="aspect-video rounded-xl bg-white/5" />
                      <div className="h-3.5 bg-white/5 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : popularVideos.length === 0 ? (
                <EmptyChannel onSubscribe={handleSubscribe} isSubscribed={isSubscribed} />
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {popularVideos.map((v, i) => (
                    <div key={v.id} className="relative">
                      {i < 3 && (
                        <div className={`absolute -top-1 -left-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                          i === 0 ? "bg-amber-500 border-amber-400 text-white" :
                          i === 1 ? "bg-zinc-400 border-zinc-300 text-white" :
                                    "bg-amber-700 border-amber-600 text-white"
                        }`}>
                          {i + 1}
                        </div>
                      )}
                      <VideoGridCard video={v} authenticated={authenticated} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {popularVideos.map((v) => <VideoListCard key={v.id} video={v} authenticated={authenticated} />)}
                </div>
              )}
            </>
          )}

          {/* ── Tab: Sobre ── */}
          {activeTab === "sobre" && (
            <div className="max-w-xl space-y-5">
              {/* Card principal */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt="" loading="lazy" width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <User size={22} className="text-white/30" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{creatorName}</p>
                    <p className="text-foreground/38 text-sm">@{creator.username}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-foreground/55">
                    <Calendar size={14} className="text-neon-purple/70 flex-shrink-0" />
                    <span>{t("models.channel.memberSinceLabel")} <strong className="text-foreground/75">{fmtDate(creator.created_at)}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/55">
                    <Film size={14} className="text-neon-pink/70 flex-shrink-0" />
                    <span><strong className="text-foreground/75">{creator.video_count}</strong> {t("models.channel.videosSuffix", { count: creator.video_count })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/55">
                    <Eye size={14} className="text-neon-blue/70 flex-shrink-0" />
                    <span><strong className="text-foreground/75">{fmtNum(creator.total_views)}</strong> {t("models.channel.totalViewsLabel")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/55">
                    <Users size={14} className="text-neon-purple/70 flex-shrink-0" />
                    <span><strong className="text-foreground/75">{fmtNum(subCount)}</strong> {t("models.channel.subscribersSuffix", { count: subCount })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/55">
                    <Heart size={14} className="text-rose-400/70 flex-shrink-0" />
                    <span><strong className="text-foreground/75">{fmtNum(creator.total_likes)}</strong> {t("models.channel.likesReceived")}</span>
                  </div>
                </div>
              </div>

              {/* CTA — subscrever se não estiver */}
              {!isSubscribed && (
                <div className="relative overflow-hidden bg-gradient-to-br from-neon-pink/8 to-neon-purple/6 border border-neon-pink/18 rounded-2xl p-5 text-center">
                  <p className="text-white/70 text-sm mb-3">
                    {t("models.channel.subscribeCtaText", { name: creatorName })}
                  </p>
                  <button
                    onClick={handleSubscribe}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:shadow-lg hover:shadow-neon-pink/22 transition-all"
                  >
                    <Bell size={14} /> {t("models.channel.subscribeCta")}
                  </button>
                </div>
              )}

              {/* Partilhar canal */}
              <button
                onClick={handleShare}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all text-sm font-semibold ${
                  linkCopied
                    ? "bg-emerald-500/8 border-emerald-500/22 text-emerald-400"
                    : "bg-white/[0.03] border-white/8 text-foreground/45 hover:bg-white/7 hover:text-foreground/70"
                }`}
              >
                {linkCopied ? <><Check size={15} />{t("models.channel.linkCopied")}</> : <><Copy size={15} />{t("models.channel.copyLink")}</>}
              </button>
            </div>
          )}

        </div>
      </div>

      {showAuth && <AuthPopup action={authAction} onClose={() => setShowAuth(false)} />}
    </LayoutWrapper>
  );
}

// ─────────────────────────────────────────────
// Estado vazio — canal sem vídeos
// ─────────────────────────────────────────────
function EmptyChannel({ onSubscribe, isSubscribed }: { onSubscribe: () => void; isSubscribed: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
        <Film size={28} className="text-foreground/18" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-foreground/55 font-semibold">{t("models.channel.noVideos.title")}</p>
        <p className="text-foreground/30 text-sm max-w-xs">{t("models.channel.noVideos.subtitleFull")}</p>
      </div>
      {!isSubscribed && (
        <button
          onClick={onSubscribe}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:shadow-lg hover:shadow-neon-pink/22 transition-all"
        >
          <Bell size={14} /> {t("models.channel.noVideos.subscribeBtn")}
        </button>
      )}
    </div>
  );
}