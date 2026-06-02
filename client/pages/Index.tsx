// src/pages/Index.tsx
// Página inicial pública
//
// DIVERSIDADE:
//   - Busca INITIAL_FETCH (200) vídeos de uma só vez, sem filtro de status
//     (o filtro de status era o bug que mostrava só uma modelo)
//   - Aplica interleaveDiversity à pool completa → intercala criadores
//   - Pagina localmente com slice; só vai à BD quando a pool esgota
//
// SECÇÕES:
//   - Em Destaque: top-4 por views de criadores distintos
//   - Linhas por categoria: top-3 categorias, scroll horizontal
//   - Grid principal com diversidade de modelos

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import AdBanner, { type Ad as BannerAd } from "@/components/AdBanner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/lib/supabaseClient";
import {
  Play, Heart, Bookmark, Flame, Sparkles, TrendingUp,
  Eye, Film, Loader2, X, Crown,
  Zap, User, ChevronDown, ShieldCheck, Cookie, Lock,
  AlertTriangle, CheckCircle2, Settings2, ChevronRight,
  VolumeX,
} from "lucide-react";
import { useTranslation } from "react-i18next";


type Video = {
  id: string; slug: string | null; title: string | null; thumbnail_url: string | null;
  video_url: string | null;
  views: number; duration: number | null; created_at: string;
  category: string | null; likes_count: number;
  user_id: string; creator_name: string | null; creator_avatar: string | null;
  creator_slug: string | null;
  creator_username: string | null;
};
type FilterTab    = "todos" | "alta" | "recentes" | "vistos";
type AgeStep      = "gate" | "blocked";
type CookieChoice = "all" | "essential" | null;
type Profile      = { id: string; slug: string | null; username: string | null; full_name: string | null; avatar_url: string | null };

const SESSION_AGE_KEY    = "age_verified_session";
const SESSION_COOKIE_KEY = "cookie_consent_session";
const INITIAL_FETCH      = 200; // pool inicial — garante diversidade cross-modelo
const PAGE_SIZE          = 24;  // quantos mostrar de cada vez

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function fmtRelative(iso: string, t: (key: string, opts?: Record<string, number>) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs  = Math.floor(diff / 3600000);
  if (hrs < 1)  return t("home.time.now");
  if (hrs < 24) return t("home.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7)  return t("home.time.daysAgo", { count: days });
  if (days < 30) return t("home.time.weeksAgo", { count: Math.floor(days / 7) });
  return t("home.time.monthsAgo", { count: Math.floor(days / 30) });
}

function distribuirPorModelo<T extends { user_id: string }>(videos: T[]): T[] {
  if (videos.length === 0) return [];

  const grupos = new Map<string, T[]>();
  for (const v of videos) {
    if (!grupos.has(v.user_id)) grupos.set(v.user_id, []);
    grupos.get(v.user_id)!.push(v);
  }

  const filas = [...grupos.values()].sort(() => Math.random() - 0.5);
  const resultado: T[] = [];
  let posicao = 0;

  while (resultado.length < videos.length) {
    const filasActivas = filas.filter(f => f.length > 0);
    if (filasActivas.length === 0) break;

    const filaIndex = posicao % filasActivas.length;
    const fila = filasActivas[filaIndex];
    resultado.push(fila.shift()!);
    posicao++;
  }

  return resultado;
}

// ─────────────────────────────────────────────
// Age Gate
// ─────────────────────────────────────────────
function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<AgeStep>("gate");
  if (step === "blocked") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg,#0a0010 0%,#100015 100%)" }}>
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white">{t("home.ageGate.blockedTitle")}</h2>
          <p className="text-white/45 text-sm leading-relaxed" style={{ whiteSpace: "pre-line" }}>
            {t("home.ageGate.blockedBody")}
          </p>
          <a href="https://www.google.com" className="inline-block px-8 py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 font-bold text-sm hover:bg-red-500/22 transition-all">
            {t("home.ageGate.leaveSite")}
          </a>
        </div>
      </div>
    );
  }
  return (
    <>
      <style>{`
        @keyframes ageGlowPulse{0%,100%{box-shadow:0 0 40px rgba(236,72,153,0.08),inset 0 1px 0 rgba(255,255,255,0.05)}50%{box-shadow:0 0 80px rgba(236,72,153,0.22),0 0 120px rgba(139,92,246,0.10),inset 0 1px 0 rgba(255,255,255,0.05)}}
        @keyframes ageBarShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes ageFadeIn{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
        style={{ background:"rgba(0,0,0,0.98)", backdropFilter:"blur(24px)", overflowY:"auto" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(circle,rgba(236,72,153,0.09) 0%,transparent 68%)" }} />
        <div className="relative max-w-sm w-full rounded-2xl overflow-hidden my-auto"
          style={{ background:"linear-gradient(145deg,#1c0935 0%,#210b22 50%,#0e0922 100%)", border:"1px solid rgba(236,72,153,0.22)", animation:"ageFadeIn 0.45s cubic-bezier(0.16,1,0.3,1) both, ageGlowPulse 3.5s ease-in-out infinite" }}>
          <div className="h-[3px] w-full" style={{ background:"linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6,#ec4899)", backgroundSize:"200% auto", animation:"ageBarShimmer 3s linear infinite" }} />
          <div className="relative p-5 sm:p-6 text-center space-y-4">
            <div className="relative mx-auto w-fit">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
                style={{ background:"linear-gradient(135deg,rgba(236,72,153,0.22) 0%,rgba(139,92,246,0.16) 100%)", border:"1px solid rgba(236,72,153,0.28)", boxShadow:"0 0 24px rgba(236,72,153,0.18)" }}>
                <ShieldCheck size={26} className="text-neon-pink" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-black">
                <span className="text-[7px] font-black text-white">18+</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
                style={{ background:"rgba(236,72,153,0.08)", border:"1px solid rgba(236,72,153,0.16)", color:"rgba(236,72,153,0.75)" }}>
                <Lock size={7} /> {t("home.ageGate.restrictedBadge")}
              </div>
              <h1 className="text-xl font-black text-white leading-tight">
                {t("home.ageGate.title")}{" "}
                <span style={{ background:"linear-gradient(90deg,#ec4899,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{t("home.ageGate.titleHighlight")}</span>
              </h1>
              <p className="text-white/40 text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t("home.ageGate.subtitle") }} />
            </div>
            <div className="text-left rounded-xl p-3 space-y-1.5" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
              {[
                t("home.ageGate.checks.age"),
                t("home.ageGate.checks.explicit"),
                t("home.ageGate.checks.terms"),
                t("home.ageGate.checks.legal"),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={11} className="text-neon-pink/60 mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] text-white/38">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button onClick={onConfirm}
                className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background:"linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)", boxShadow:"0 0 28px rgba(236,72,153,0.32)" }}>
                {t("home.ageGate.enterBtn")}
              </button>
              <button onClick={() => setStep("blocked")}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/30 transition-all hover:text-white/52"
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                {t("home.ageGate.exitBtn")}
              </button>
            </div>
            <p className="text-[9px] text-white/20">
              <Link to="/termos" className="hover:text-white/45 underline underline-offset-2">{t("home.ageGate.termsLink")}</Link>{" · "}
              <Link to="/privacidade" className="hover:text-white/45 underline underline-offset-2">{t("home.ageGate.privacyLink")}</Link>{" · "}
              <Link to="/rta" className="hover:text-white/45 underline underline-offset-2">{t("home.ageGate.rtaLink")}</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Cookie Consent
// ─────────────────────────────────────────────
function CookieConsent({ onAccept }: { onAccept: (c: CookieChoice) => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded]     = useState(false);
  const [interacted, setInteracted] = useState(false);
  return (
    <>
      <style>{`
        @keyframes cookieSlideUp{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes cookieWiggle{0%,100%{transform:translateY(0)}20%{transform:translateY(-6px)}40%{transform:translateY(-3px)}60%{transform:translateY(-8px)}80%{transform:translateY(-2px)}}
        @keyframes cookiePulse{0%,100%{box-shadow:0 -10px 35px rgba(236,72,153,0.05)}50%{box-shadow:0 -22px 60px rgba(236,72,153,0.22),0 0 50px rgba(139,92,246,0.12)}}
        @keyframes cookieBorderGlow{0%,100%{border-color:rgba(236,72,153,0.16)}50%{border-color:rgba(236,72,153,0.45)}}
        @keyframes accentShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .cookie-idle{animation:cookieSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) both,cookieWiggle 2s ease-in-out 2.5s infinite,cookiePulse 2s ease-in-out 2.5s infinite,cookieBorderGlow 2s ease-in-out 2.5s infinite}
        .cookie-still{animation:cookieSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) both;transition:box-shadow 0.5s,border-color 0.5s;box-shadow:0 -10px 35px rgba(236,72,153,0.05);border-color:rgba(236,72,153,0.18)!important}
      `}</style>
      <div className="fixed bottom-0 left-0 right-0 z-[150] p-3 sm:p-4"
        onMouseEnter={() => setInteracted(true)} onTouchStart={() => setInteracted(true)}>
        <div className={`max-w-4xl mx-auto rounded-2xl overflow-hidden ${interacted ? "cookie-still" : "cookie-idle"}`}
          style={{ background:"linear-gradient(135deg,#160825 0%,#1c0a1c 100%)", border:"1px solid rgba(236,72,153,0.18)" }}>
          <div className="h-[2px]" style={{ background:"linear-gradient(90deg,transparent,#ec4899,#8b5cf6,#ec4899,transparent)", backgroundSize:"200% auto", animation:"accentShimmer 3s linear infinite" }} />
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.18)" }}>
                <Cookie size={17} className="text-neon-pink" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-black text-white">{t("home.cookieConsent.title")}</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                    style={{ background:"rgba(236,72,153,0.08)", border:"1px solid rgba(236,72,153,0.14)", color:"rgba(236,72,153,0.7)" }}>{t("home.cookieConsent.badge")}</span>
                </div>
                <p className="text-[11px] text-white/38 leading-relaxed">
                  {t("home.cookieConsent.body")}{" "}
                  <Link to="/privacidade" className="text-neon-pink/55 hover:text-neon-pink/80 underline underline-offset-2">{t("home.cookieConsent.learnMore")}</Link>
                </p>
                {expanded && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { key:"essential",      required:true,  color:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.2)",  dot:"#22c55e" },
                      { key:"analytics",      required:false, color:"rgba(59,130,246,0.1)",  border:"rgba(59,130,246,0.18)",dot:"#3b82f6" },
                      { key:"personalization",required:false, color:"rgba(139,92,246,0.1)", border:"rgba(139,92,246,0.18)",dot:"#8b5cf6" },
                    ].map(c => (
                      <div key={c.key} className="rounded-xl p-3" style={{ background:c.color, border:`1px solid ${c.border}` }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background:c.dot }} />
                          <span className="text-[11px] font-bold text-white/75">{t(`home.cookieConsent.types.${c.key}.name`)}</span>
                          {c.required && <span className="ml-auto text-[8px] font-bold text-white/25 tracking-wider">{t("home.cookieConsent.types.essential.required")}</span>}
                        </div>
                        <p className="text-[10px] text-white/32">{t(`home.cookieConsent.types.${c.key}.desc`)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-end">
              <button onClick={() => { setInteracted(true); setExpanded(!expanded); }}
                className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/55 transition-colors mr-auto">
                <Settings2 size={11} />{expanded ? t("home.cookieConsent.hide") : t("home.cookieConsent.customize")}
                <ChevronRight size={10} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
              <button onClick={() => { setInteracted(true); onAccept("essential"); }}
                className="px-4 py-2 rounded-xl text-[11px] font-semibold text-white/45 hover:text-white/65 transition-all"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                {t("home.cookieConsent.essentialOnly")}
              </button>
              <button onClick={() => { setInteracted(true); onAccept("all"); }}
                className="px-5 py-2 rounded-xl text-[11px] font-black text-white transition-all hover:scale-[1.02]"
                style={{ background:"linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)", boxShadow:"0 0 20px rgba(236,72,153,0.25)" }}>
                {t("home.cookieConsent.acceptAll")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// VideoCard
// ─────────────────────────────────────────────
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

const VideoCard = memo(function VideoCard({ video, onLike, onSave, isLiked, isSaved, className = "" }: {
  video: Video;
  onLike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  isLiked: boolean; isSaved: boolean;
  className?: string;
}) {
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
  const handleLinkClick = (e: React.MouseEvent) => { if (wasHoldRef.current) { e.preventDefault(); wasHoldRef.current = false; } };

  return (
    <div
      className={`group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={isPreviewing ? { borderRadius: "0.75rem", boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
    >
      <Link to={`/video/${video.slug || video.id}`} className="block relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-2" onClick={handleLinkClick}>
        {/* Thumbnail */}
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title ?? ""} loading="lazy" width={320} height={180}
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
        {/* Dark overlay — hidden during preview */}
        {!isPreviewing && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/22 transition-colors duration-300" />}
        {/* Play button overlay — hidden during preview */}
        {!isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-11 h-11 rounded-full bg-neon-pink flex items-center justify-center shadow-lg shadow-neon-pink/40 scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {video.duration && <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono rounded">{fmtDuration(video.duration)}</div>}
        {video.category && <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 text-neon-pink text-[9px] font-bold rounded border border-neon-pink/18 capitalize">{video.category}</div>}
        {/* Like/save buttons — hidden during preview */}
        {!isPreviewing && (
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => onLike(video.id, e)}
              className={`w-6 h-6 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all ${isLiked ? "bg-neon-pink border-neon-pink/40 text-white" : "bg-black/55 border-white/10 text-white/65 hover:text-neon-pink"}`}>
              <Heart size={10} className={isLiked ? "fill-white" : ""} />
            </button>
            <button onClick={e => onSave(video.id, e)}
              className={`w-6 h-6 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all ${isSaved ? "bg-neon-purple border-neon-purple/40 text-white" : "bg-black/55 border-white/10 text-white/65 hover:text-neon-purple"}`}>
              <Bookmark size={10} className={isSaved ? "fill-white" : ""} />
            </button>
          </div>
        )}
        {/* Muted indicator during preview */}
        {isPreviewing && (
          <div className="absolute bottom-1.5 left-1.5 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={11} className="text-white" />
          </div>
        )}
      </Link>
      <div className="space-y-0.5 px-0.5">
        <Link
          to={`/modelo/${video.creator_username || video.creator_slug || video.user_id}`}
          className="flex items-center gap-1.5 mb-1 group/creator w-fit max-w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {video.creator_avatar
              ? <img src={video.creator_avatar} alt="" loading="lazy" width={16} height={16} className="w-full h-full object-cover" />
              : <User size={8} className="text-white/30 m-auto" />
            }
          </div>
          <span className="text-[10px] text-foreground/35 truncate group-hover/creator:text-foreground/65 transition-colors">
            {video.creator_name ?? t("common.creator")}
          </span>
        </Link>
        <Link to={`/video/${video.slug || video.id}`} onClick={handleLinkClick}>
          <h3 className="text-sm font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">{video.title || t("common.noTitle")}</h3>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-foreground/32 pt-0.5">
          <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/45" />{fmtNum(video.likes_count)}</span>
          <span className="ml-auto">{fmtRelative(video.created_at, t)}</span>
        </div>
      </div>
    </div>
  );
});

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
// Secção "Em Destaque"
// ─────────────────────────────────────────────
function FeaturedSection({ videos, onLike, onSave, likedIds, savedIds }: {
  videos: Video[];
  onLike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  likedIds: Set<string>; savedIds: Set<string>;
}) {
  const { t } = useTranslation();
  if (videos.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={15} className="text-amber-400" />
        <h2 className="text-sm font-black text-white/80 uppercase tracking-wider">{t("home.sections.featured")}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} onLike={onLike} onSave={onSave}
            isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)}
            className="w-52 sm:w-60 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Linha horizontal por categoria
// ─────────────────────────────────────────────
function CategoryRow({ category, videos, onLike, onSave, likedIds, savedIds }: {
  category: string; videos: Video[];
  onLike: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  likedIds: Set<string>; savedIds: Set<string>;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-white/70 uppercase tracking-wider capitalize">{category}</h2>
        <Link to={`/videos?category=${encodeURIComponent(category)}`}
          className="flex items-center gap-0.5 text-[11px] transition-colors"
          style={{ color: "rgba(236,72,153,0.60)" }}>
          {t("home.sections.viewAll")} <ChevronRight size={11} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} onLike={onLike} onSave={onSave}
            isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)}
            className="w-44 sm:w-52 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Banner de Shorts
// ─────────────────────────────────────────────
function ShortsBanner({ shortsPath }: { shortsPath: string }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("shorts_banner_seen")) return;
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem("shorts_banner_seen", "1");
    }, 10000);
    return () => clearTimeout(timer);
  }, [visible]);

  const close = () => {
    setVisible(false);
    localStorage.setItem("shorts_banner_seen", "1");
  };

  if (!visible) return null;

  return (
    <>
      <style>{`@keyframes shortsCountdown{from{width:100%}to{width:0%}}`}</style>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] bg-[#0e0e14] border border-neon-pink/40 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.2)] overflow-hidden">
        <button
          onClick={close}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors z-10"
        >
          <X size={16} />
        </button>
        <div className="p-4 pr-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-neon-pink flex-shrink-0" fill="currentColor" />
            <span className="font-bold text-white text-sm">Shorts chegaram! ⚡</span>
          </div>
          <p className="text-foreground/55 text-xs leading-relaxed mb-3">
            {t("shorts.banner.text", "Descobre vídeos curtos no estilo TikTok. Scroll infinito, conteúdo exclusivo das tuas modelos favoritas.")}
          </p>
          <Link
            to={shortsPath}
            onClick={close}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all"
          >
            {t("shorts.banner.cta", "Ver Shorts")} →
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
          <div
            className="h-full bg-neon-pink"
            style={{ animation: "shortsCountdown 10s linear forwards" }}
          />
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function Index() {
  const { t } = useTranslation();
  useDocumentTitle({
    title: "SuckOrSex - Vídeos Porno Grátis & Conteúdo XXX HD",
    url: "https://suckorsex.com/",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "website-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "SuckOrSex",
      "url": "https://suckorsex.com",
      "description": "Vídeos porno grátis em HD, conteúdo amador e XXX",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://suckorsex.com/videos?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("website-schema")?.remove();
    };
  }, []);

  // pool  = todos os vídeos após diversidade, guardados em ref (sem re-render)
  //         e em estado (para useMemo derivados)
  // page  = cursor de paginação local (quantos PAGE_SIZE chunks mostrar)
  const [pool,         setPool]         = useState<Video[]>([]);
  const [page,         setPage]         = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [totalCount,   setTotalCount]   = useState(0);
  const [hasMoreInDB,  setHasMoreInDB]  = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");

  const poolRef     = useRef<Video[]>([]);
  const fetchingRef = useRef(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedIds,   setLikedIds]         = useState<Set<string>>(new Set());
  const [savedIds,   setSavedIds]         = useState<Set<string>>(new Set());
  const [bannerAds,  setBannerAds]        = useState<BannerAd[]>([]);
  const [showAuth,   setShowAuth]         = useState(false);
  const [authAction, setAuthAction]       = useState<"like" | "save">("like");

  const [ageVerified,      setAgeVerified]      = useState(() => sessionStorage.getItem(SESSION_AGE_KEY) === "true");
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [shortsPreview, setShortsPreview] = useState<{ id: string; slug: string | null; thumbnail_url: string | null; title: string | null }[]>([]);

  // ── Derivados ────────────────────────────────────────────────────────────

  // O que está visível = primeiros (page+1)*PAGE_SIZE itens da pool
  const displayed = useMemo(
    () => pool.slice(0, (page + 1) * PAGE_SIZE),
    [pool, page]
  );

  // Pode mostrar mais? Sim se há mais na pool local ou mais na BD
  const canLoadMore = !loading && (
    (page + 1) * PAGE_SIZE < pool.length || hasMoreInDB
  );

  // Em destaque: top-4 por views de criadores distintos (só se ≥2 criadores)
  const featuredVideos = useMemo((): Video[] => {
    if (pool.length < 2) return [];
    const byViews = [...pool].sort((a, b) => b.views - a.views);
    const seen    = new Set<string>();
    const result: Video[] = [];
    for (const v of byViews) {
      if (!seen.has(v.user_id)) { seen.add(v.user_id); result.push(v); }
      if (result.length === 4) break;
    }
    return seen.size >= 2 ? result : [];
  }, [pool]);

  // Top-3 categorias com ≥3 vídeos → linhas horizontais
  const categoryRows = useMemo(() => {
    if (displayed.length === 0) return [];
    const catMap = new Map<string, Video[]>();
    for (const v of displayed) {
      if (!v.category) continue;
      if (!catMap.has(v.category)) catMap.set(v.category, []);
      catMap.get(v.category)!.push(v);
    }
    return [...catMap.entries()]
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3)
      .filter(([, vs]) => vs.length >= 3)
      .map(([cat, vs]) => ({ cat, videos: vs.slice(0, 8) }));
  }, [displayed]);

  // ── Setup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (ageVerified && !sessionStorage.getItem(SESSION_COOKIE_KEY)) setShowCookieBanner(true);
  }, [ageVerified]);

  const handleAgeConfirm   = () => { sessionStorage.setItem(SESSION_AGE_KEY, "true"); setAgeVerified(true); };
  const handleCookieAccept = (c: CookieChoice) => { if (c) sessionStorage.setItem(SESSION_COOKIE_KEY, c); setShowCookieBanner(false); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setCurrentUserId(s?.user?.id ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const now = new Date().toISOString();
    supabase.from("ads")
      .select("id,company_name,website_url,headline,description,cta_text,logo_url,bg_color,accent_color,plan_id,placement,impressions,clicks,media_type,media_url,thumbnail_url,video_url,format")
      .eq("status", "active")
      .contains("placement", ["all_pages"])
      .lte("starts_at", now).gte("ends_at", now)
      .order("created_at", { ascending: false })
      .then(({ data }) => setBannerAds((data ?? []) as BannerAd[]));
  }, []);

  // ── Query principal ───────────────────────────────────────────────────────
  // Queries videos + profiles_public + interacoes directamente — sem usar a
  // view videos_enriched, que pode estar definida com filtros que excluem
  // a maioria das modelos (era o root cause da falta de diversidade).
  const fetchAll = useCallback(async (reset = true) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (reset) setLoading(true); else setLoadingMore(true);

    const batchSize = reset ? INITIAL_FETCH : PAGE_SIZE * 4;
    const offset    = reset ? 0 : poolRef.current.length;

    // 1. Vídeos — SEM filtro de status
    let q = supabase.from("videos")
      .select("id,slug,title,thumbnail_url,video_url,views,duration,created_at,category,user_id", { count: "exact" })
      .range(offset, offset + batchSize - 1);

    if (activeFilter === "vistos" || activeFilter === "alta")
      q = q.order("views",      { ascending: false });
    else
      q = q.order("created_at", { ascending: false });

    const { data: videosData, count, error } = await q;

    if (error) {
      console.error("videos:", error.message);
      fetchingRef.current = false;
      setLoading(false); setLoadingMore(false);
      return;
    }

    setTotalCount(count ?? 0);
    const rawVideos = videosData ?? [];

    // 2. Info dos criadores (em paralelo com likes)
    const uniqueIds = [...new Set(rawVideos.map((v: any) => v.user_id).filter(Boolean))] as string[];
    const videoIds  = rawVideos.map((v: any) => v.id) as string[];

    const [profilesRes, likesRes] = await Promise.all([
      uniqueIds.length > 0
        ? supabase.from("profiles_public")
            .select("id,slug,username,full_name,avatar_url")
            .in("id", uniqueIds)
        : Promise.resolve({ data: [] as Profile[] }),
      videoIds.length > 0
        ? supabase.from("interacoes")
            .select("video_id")
            .eq("tipo", true)
            .in("video_id", videoIds)
        : Promise.resolve({ data: [] as { video_id: string }[] }),
    ]);

    const profileMap = new Map<string, Profile>(
      (profilesRes.data ?? []).map((p: Profile) => [p.id, p])
    );
    const likesMap = new Map<string, number>();
    for (const row of (likesRes.data ?? [])) {
      likesMap.set(row.video_id, (likesMap.get(row.video_id) ?? 0) + 1);
    }

    const mapped: Video[] = rawVideos.map((v: any) => {
      const p = profileMap.get(v.user_id);
      return {
        id:             v.id,
        slug:           v.slug ?? null,
        title:          v.title,
        thumbnail_url:  v.thumbnail_url,
        video_url:      v.video_url ?? null,
        views:          v.views    ?? 0,
        duration:       v.duration,
        created_at:     v.created_at,
        category:       v.category,
        likes_count:    likesMap.get(v.id) ?? 0,
        user_id:        v.user_id,
        creator_name:   p?.full_name ?? p?.username ?? null,
        creator_avatar: p?.avatar_url ?? null,
        creator_slug:     p?.slug ?? null,
        creator_username: p?.username ?? null,
      };
    });

    if (mapped.length === 0 && reset) {
      poolRef.current = [];
      setPool([]); setPage(0); setHasMoreInDB(false);
      fetchingRef.current = false;
      setLoading(false); setLoadingMore(false);
      return;
    }

    // Combina com a pool existente e re-intercala para garantir diversidade
    const combined = reset ? mapped : [...poolRef.current, ...mapped];
    const sorted   = activeFilter === "alta"
      ? [...combined].sort((a, b) => b.likes_count - a.likes_count)
      : combined;
    const newPool  = distribuirPorModelo(sorted);

    poolRef.current = newPool;
    setPool(newPool);
    if (reset) setPage(0);

    setHasMoreInDB((offset + mapped.length) < (count ?? 0));
    fetchingRef.current = false;
    setLoading(false); setLoadingMore(false);
  }, [activeFilter]);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  useEffect(() => {
    supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url")
      .eq("is_short", true)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("views", { ascending: false })
      .limit(6)
      .then(({ data }) => setShortsPreview((data ?? []) as any[]));
  }, []);

  useEffect(() => {
    const ch = supabase.channel("idx-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" }, () => fetchAll(true))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  // Avança página local; pré-busca da BD quando a pool está a esgotar
  const loadMore = () => {
    const nextPage    = page + 1;
    const neededItems = (nextPage + 2) * PAGE_SIZE; // margem de 1 página
    setPage(nextPage);
    if (neededItems > poolRef.current.length && hasMoreInDB) {
      fetchAll(false);
    }
  };

  const handleLike = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) { setAuthAction("like"); setShowAuth(true); return; }
    if (likedIds.has(videoId)) {
      await supabase.from("interacoes").delete().eq("video_id", videoId).eq("user_id", currentUserId).eq("tipo", true);
      setLikedIds(p => { const s = new Set(p); s.delete(videoId); return s; });
    } else {
      await supabase.from("interacoes").insert({ video_id: videoId, user_id: currentUserId, tipo: true });
      setLikedIds(p => new Set(p).add(videoId));
    }
  };
  const handleSave = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) { setAuthAction("save"); setShowAuth(true); return; }
    setSavedIds(p => { const s = new Set(p); s.has(videoId) ? s.delete(videoId) : s.add(videoId); return s; });
  };

  return (
    <>
      {!ageVerified && <AgeGate onConfirm={handleAgeConfirm} />}
      {ageVerified && showCookieBanner && <CookieConsent onAccept={handleCookieAccept} />}

      <Layout>
        <div className="max-container safe-area py-5 space-y-6">

          {/* Em Destaque */}
          {!loading && featuredVideos.length > 0 && (
            <FeaturedSection videos={featuredVideos} onLike={handleLike} onSave={handleSave}
              likedIds={likedIds} savedIds={savedIds} />
          )}

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {([
              ["todos",    t("home.filters.forYou"),      Sparkles],
              ["alta",     t("home.filters.trending"),    Flame],
              ["recentes", t("home.filters.recent"),      Zap],
              ["vistos",   t("home.filters.mostWatched"), TrendingUp],
            ] as [FilterTab, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setActiveFilter(val)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  activeFilter === val
                    ? "bg-white/12 border-white/22 text-white"
                    : "bg-white/[0.03] border-white/8 text-foreground/42 hover:border-white/15 hover:text-foreground/62"
                }`}>
                <Icon size={11} /> {label}
              </button>
            ))}
            {!loading && <span className="ml-auto text-[10px] text-foreground/25">{t("home.filters.videoCount", { count: fmtNum(totalCount) as unknown as number })}</span>}
          </div>

          {/* Linhas de categoria */}
          {!loading && categoryRows.map(({ cat, videos }) => (
            <CategoryRow key={cat} category={cat} videos={videos}
              onLike={handleLike} onSave={handleSave}
              likedIds={likedIds} savedIds={savedIds} />
          ))}

          {/* Shorts em Destaque */}
          {shortsPreview.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-neon-pink" fill="currentColor" />
                  <h2 className="text-sm font-black text-white/80 uppercase tracking-wider">
                    {t("home.sections.shorts", "Shorts")}
                  </h2>
                </div>
                <Link
                  to="/shorts"
                  className="flex items-center gap-1 text-xs text-foreground/45 hover:text-neon-pink transition-colors"
                >
                  {t("home.sections.viewAll", "Ver todos")} <ChevronRight size={11} />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {shortsPreview.map(s => (
                  <Link
                    key={s.id}
                    to={`/shorts`}
                    className="flex-shrink-0 relative w-[90px] h-48 rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-neon-pink/30 transition-colors group"
                  >
                    {s.thumbnail_url ? (
                      <img
                        src={s.thumbnail_url}
                        alt={s.title ?? ""}
                        loading="lazy"
                        width={90} height={192}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={20} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-0 right-0 px-1.5">
                      <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">{s.title}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full bg-neon-pink/80 flex items-center justify-center">
                        <Play size={8} fill="white" className="text-white ml-px" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Grelha principal */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
              {[...Array(20)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Film size={26} className="text-foreground/18" />
              </div>
              <p className="text-foreground/48 font-semibold">{t("home.empty")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                {displayed.slice(0, 15).map(v => (
                  <VideoCard key={v.id} video={v} onLike={handleLike} onSave={handleSave}
                    isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)} />
                ))}
              </div>

              {displayed.length > 15 && <AdBanner placement="all_pages" ads={bannerAds} />}

              {displayed.length > 15 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                  {displayed.slice(15, 35).map(v => (
                    <VideoCard key={v.id} video={v} onLike={handleLike} onSave={handleSave}
                      isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)} />
                  ))}
                </div>
              )}

              {displayed.length > 35 && <AdBanner placement="all_pages" ads={bannerAds} />}

              {displayed.length > 35 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                  {displayed.slice(35).map(v => (
                    <VideoCard key={v.id} video={v} onLike={handleLike} onSave={handleSave}
                      isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && displayed.length > 0 && <AdBanner placement="all_pages" ads={bannerAds} />}

          {/* Carregar mais */}
          {canLoadMore && displayed.length > 0 && (
            <div className="flex justify-center py-2">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground/58 text-sm font-semibold hover:bg-white/8 hover:border-white/16 hover:text-foreground transition-all disabled:opacity-50">
                {loadingMore
                  ? <><Loader2 size={14} className="animate-spin" />{t("home.loading")}</>
                  : <><ChevronDown size={14} />{t("home.loadMore")}</>}
              </button>
            </div>
          )}

          {/* CTA registo */}
          {!currentUserId && !loading && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-pink/10 via-neon-purple/7 to-neon-blue/5 border border-neon-pink/16 p-7 text-center">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-neon-pink/7 rounded-full blur-3xl pointer-events-none" />
              <div className="relative max-w-sm mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/6 border border-white/10 text-white/50 text-xs font-medium">
                  <Crown size={10} className="text-yellow-400" /> {t("home.cta.badge")}
                </div>
                <h2 className="text-xl font-black text-white">{t("home.cta.title")}</h2>
                <p className="text-foreground/42 text-sm">{t("home.cta.subtitle")}</p>
                <div className="flex items-center justify-center gap-3">
                  <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold text-sm hover:shadow-[0_0_22px_rgba(236,72,153,0.35)] transition-all">{t("home.cta.createAccount")}</Link>
                  <Link to="/login"  className="px-5 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all">{t("home.cta.login")}</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auth popup */}
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative max-w-sm w-full rounded-2xl border border-neon-pink/18 overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.12)]"
              style={{ background:"linear-gradient(135deg,#1a0830 0%,#200a18 60%,#0d0820 100%)" }}>
              <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/55 z-10"><X size={17} /></button>
              <div className="relative p-7 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
                  {authAction === "like" ? <Heart size={20} className="text-white" /> : <Bookmark size={20} className="text-white" />}
                </div>
                <h3 className="text-lg font-black text-white mb-2">{authAction === "like" ? t("home.authPopup.like") : t("home.authPopup.save")}</h3>
                <p className="text-white/40 text-sm mb-6">{t("home.authPopup.body")}</p>
                <div className="space-y-2.5">
                  <Link to="/signup" onClick={() => setShowAuth(false)} className="block w-full py-2.5 bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold rounded-xl transition-all">{t("common.createAccount")}</Link>
                  <Link to="/login"  onClick={() => setShowAuth(false)} className="block w-full py-2.5 bg-white/6 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">{t("common.alreadyHaveAccount")}</Link>
                  <button onClick={() => setShowAuth(false)} className="text-xs text-white/20 hover:text-white/45 transition-colors">{t("common.continueNavigation")}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
      <ShortsBanner shortsPath="/shorts" />
    </>
  );
}
