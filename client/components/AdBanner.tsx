// client/components/AdBanner.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Building2, ExternalLink, Megaphone, Play, Volume2, VolumeX, X } from "lucide-react";

export type Ad = {
  id: string;
  company_name: string;
  website_url: string;
  headline: string;
  description: string;
  cta_text: string;
  logo_url: string | null;
  bg_color: string;
  accent_color: string;
  plan_id: string;
  placement: string[];
  impressions: number;
  clicks: number;
  media_type: "banner" | "image" | "video";
  media_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  format: "horizontal" | "vertical" | "square" | "fullscreen";
};

export type AdPlacement = "all_pages" | "homepage_hero" | "between_videos" | "during_video";
export type AdFormat    = "horizontal" | "card" | "fullscreen" | "overlay";

interface AdBannerProps {
  placement: string;
  format?: AdFormat;
  className?: string;
  videoElapsedSeconds?: number;
  ads?: Ad[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function recordImpression(ad: Ad) {
  supabase.from("ads").update({ impressions: ad.impressions + 1 }).eq("id", ad.id).then(() => {});
}

function recordClick(ad: Ad) {
  supabase.from("ads").update({ clicks: ad.clicks + 1 }).eq("id", ad.id).then(() => {});
  window.open(ad.website_url, "_blank", "noopener,noreferrer");
}

function LogoOrIcon({ ad, size = 30, radius = 7 }: { ad: Ad; size?: number; radius?: number }) {
  if (ad.logo_url) {
    return (
      <img
        src={ad.logo_url}
        alt=""
        style={{ width: size, height: size, objectFit: "contain", borderRadius: radius }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius + 1,
      background: `${ad.accent_color}22`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Building2 size={size * 0.43} style={{ color: ad.accent_color }} />
    </div>
  );
}

function CtaButton({ ad, style }: { ad: Ad; style?: React.CSSProperties }) {
  return (
    <span style={{
      padding: "6px 16px", borderRadius: 100, fontSize: "0.76rem", fontWeight: 800,
      color: "#fff", background: ad.accent_color,
      display: "inline-flex", alignItems: "center", gap: 4,
      whiteSpace: "nowrap", flexShrink: 0,
      ...style,
    }}>
      {ad.cta_text} <ExternalLink size={10} />
    </span>
  );
}

// ── FORMATO 1 — AdBannerHorizontal ───────────────────────────────────────────

function AdBannerHorizontal({ ad, visible }: { ad: Ad; visible: boolean }) {
  const isImage = ad.media_type === "image" && ad.media_url;

  return (
    <div
      className="w-full cursor-pointer relative overflow-hidden"
      style={{
        minHeight: 90, display: "flex", alignItems: "stretch",
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-4px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
      onClick={() => recordClick(ad)}
    >
      {isImage ? (
        <>
          <img src={ad.media_url!} className="w-full h-full object-cover absolute inset-0" alt="" />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.28)" }} />
          <div className="relative flex items-center justify-between w-full px-6" style={{ zIndex: 1 }}>
            <span style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.12em" }}>PUBLICIDADE</span>
            <CtaButton ad={ad} />
          </div>
          <span style={{
            position: "absolute", top: 6, right: 12,
            fontSize: "0.48rem", color: "rgba(255,255,255,0.30)",
            fontWeight: 700, letterSpacing: "0.1em",
          }}>PUBLICIDADE</span>
        </>
      ) : (
        <>
          {/* shimmer bg */}
          <div className="absolute inset-0" style={{
            background: `${ad.bg_color}`,
            borderTop: `1px solid ${ad.accent_color}20`,
          }} />
          <div className="absolute inset-0 ad-shimmer" style={{
            background: `linear-gradient(105deg, transparent 40%, ${ad.accent_color}08 50%, transparent 60%)`,
            backgroundSize: "200% 100%",
          }} />
          <div className="relative flex items-center w-full" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", gap: 0, zIndex: 1 }}>
            <span style={{
              position: "absolute", top: 3, left: 16,
              fontSize: "0.52rem", color: "rgba(255,255,255,0.18)",
              fontWeight: 700, letterSpacing: "0.12em",
            }}>PUBLICIDADE</span>

            <div style={{
              minWidth: 110, height: 90, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              background: `${ad.accent_color}10`, borderRight: `1px solid ${ad.accent_color}15`,
              padding: "0 16px", flexShrink: 0,
            }}>
              <LogoOrIcon ad={ad} size={30} radius={6} />
              <span style={{ fontSize: "0.66rem", fontWeight: 800, color: ad.accent_color }}>{ad.company_name}</span>
            </div>

            <div style={{ flex: 1, padding: "0 18px" }}>
              <p style={{ fontWeight: 800, fontSize: "0.86rem", color: "#fff" }}>{ad.headline}</p>
              <p style={{ fontSize: "0.70rem", color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{ad.description}</p>
            </div>

            <div style={{ padding: "0 16px", flexShrink: 0 }}>
              <CtaButton ad={ad} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── FORMATO 2 — AdBannerCard ──────────────────────────────────────────────────

function AdBannerCard({ ad, className = "" }: { ad: Ad; className?: string }) {
  const isImage = ad.media_type === "image" && ad.media_url;
  const isVideo = ad.media_type === "video" && (ad.video_url || ad.media_url);
  const videoSrc = ad.video_url || ad.media_url;

  return (
    <div
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all ${className}`}
      style={{
        aspectRatio: "16/9",
        background: ad.bg_color,
        border: `1px solid ${ad.accent_color}30`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        position: "relative",
      }}
      onClick={() => recordClick(ad)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${ad.accent_color}40`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
      }}
    >
      {/* Badge */}
      <div style={{
        position: "absolute", top: 8, left: 8, zIndex: 3,
        background: isVideo ? "rgba(0,0,0,0.65)" : `${ad.accent_color}22`,
        border: `1px solid ${ad.accent_color}40`,
        borderRadius: 100, padding: "2px 8px",
        fontSize: "0.50rem", fontWeight: 800, letterSpacing: "0.1em",
        color: isVideo ? "rgba(255,255,255,0.7)" : ad.accent_color,
      }}>
        {isVideo ? "VÍDEO PATROCINADO" : "PUBLICIDADE"}
      </div>

      {isVideo && videoSrc ? (
        <>
          <video
            src={videoSrc}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)", zIndex: 1 }} />
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Play size={16} style={{ color: "#fff", marginLeft: 2 }} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3" style={{ zIndex: 2, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
            <CtaButton ad={ad} style={{ fontSize: "0.65rem", padding: "4px 12px" }} />
          </div>
        </>
      ) : isImage ? (
        <>
          <img src={ad.media_url!} className="w-full h-full object-cover absolute inset-0" alt="" />
          <div className="absolute bottom-0 left-0 right-0" style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
            padding: "20px 12px 12px", zIndex: 1,
          }}>
            <p style={{ fontWeight: 800, fontSize: "0.82rem", color: "#fff", marginBottom: 6 }}>{ad.headline}</p>
            <CtaButton ad={ad} style={{ fontSize: "0.65rem", padding: "4px 12px" }} />
          </div>
        </>
      ) : (
        <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoOrIcon ad={ad} size={30} radius={8} />
            <span style={{ fontSize: "0.76rem", fontWeight: 800, color: ad.accent_color }}>{ad.company_name}</span>
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.88rem", color: "#fff", marginBottom: 4 }}>{ad.headline}</p>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.48)", marginBottom: 12, lineHeight: 1.4 }}>{ad.description}</p>
            <CtaButton ad={ad} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── FORMATO 3 — AdBannerFullscreen ───────────────────────────────────────────

function AdBannerFullscreen({ ad, className = "" }: { ad: Ad; className?: string }) {
  const isImage = ad.media_type === "image" && ad.media_url;
  const isVideo = ad.media_type === "video" && (ad.video_url || ad.media_url);
  const videoSrc = ad.video_url || ad.media_url;
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      className={`w-full cursor-pointer overflow-hidden relative ${className}`}
      style={{
        borderRadius: 16, minHeight: 200, display: "flex", alignItems: "center",
        margin: "16px 0", background: ad.bg_color,
        border: `1px solid ${ad.accent_color}20`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}
      onClick={() => recordClick(ad)}
    >
      {/* Conteúdo Patrocinado badge */}
      <div style={{
        position: "absolute", top: 10, right: 14, zIndex: 5,
        fontSize: "0.48rem", color: "rgba(255,255,255,0.30)",
        fontWeight: 700, letterSpacing: "0.1em",
      }}>CONTEÚDO PATROCINADO</div>

      {isVideo && videoSrc ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
          <div className="relative z-10 flex flex-col items-center justify-center w-full gap-4 py-10 px-6" style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 900, fontSize: "clamp(1rem,3vw,1.5rem)", color: "#fff" }}>{ad.headline}</p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>{ad.description}</p>
            <CtaButton ad={ad} style={{ fontSize: "0.88rem", padding: "10px 28px", boxShadow: `0 0 20px ${ad.accent_color}50` }} />
          </div>
          <button onClick={toggleMute} style={{
            position: "absolute", bottom: 12, right: 12, zIndex: 10,
            background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            {muted
              ? <VolumeX size={13} style={{ color: "rgba(255,255,255,0.7)" }} />
              : <Volume2 size={13} style={{ color: "rgba(255,255,255,0.7)" }} />
            }
          </button>
        </>
      ) : isImage ? (
        <>
          <img src={ad.media_url!} className="absolute inset-0 w-full h-full object-cover" alt="" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)" }} />
          <div className="relative z-10 flex items-center w-full" style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px", gap: 20 }}>
            <div style={{ minWidth: 60 }}>
              <LogoOrIcon ad={ad} size={52} radius={12} />
              <span style={{ fontSize: "0.62rem", fontWeight: 800, color: ad.accent_color, display: "block", marginTop: 6, textAlign: "center" }}>
                {ad.company_name}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 900, fontSize: "clamp(1rem,2.5vw,1.35rem)", color: "#fff", marginBottom: 6 }}>{ad.headline}</p>
              <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.52)" }}>{ad.description}</p>
            </div>
            <CtaButton ad={ad} style={{ fontSize: "0.88rem", padding: "10px 28px", boxShadow: `0 0 20px ${ad.accent_color}50` }} />
          </div>
        </>
      ) : (
        <>
          {/* Partículas animadas */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ad-particle" style={{
                position: "absolute",
                width: 4 + i * 2, height: 4 + i * 2,
                borderRadius: "50%",
                background: ad.accent_color,
                opacity: 0.12 + i * 0.04,
                left: `${10 + i * 16}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.4}s`,
              }} />
            ))}
          </div>
          <div className="relative z-10 flex items-center w-full" style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px", gap: 20 }}>
            <div style={{ minWidth: 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <LogoOrIcon ad={ad} size={52} radius={14} />
              <span style={{ fontSize: "0.76rem", fontWeight: 800, color: ad.accent_color }}>{ad.company_name}</span>
              <span style={{
                fontSize: "0.52rem", fontWeight: 800, letterSpacing: "0.12em",
                padding: "2px 8px", borderRadius: 100,
                background: `${ad.accent_color}20`, color: ad.accent_color,
              }}>PATROCINADOR</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 900, fontSize: "clamp(1rem,2.5vw,1.35rem)", color: "#fff", marginBottom: 6 }}>{ad.headline}</p>
              <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.52)" }}>{ad.description}</p>
            </div>
            <CtaButton ad={ad} style={{ fontSize: "0.88rem", padding: "10px 28px", boxShadow: `0 0 20px ${ad.accent_color}50` }} />
          </div>
        </>
      )}
    </div>
  );
}

// ── FORMATO 4 — AdBannerOverlay ───────────────────────────────────────────────

function AdBannerOverlay({
  ad, closed, closeable, countdown, onClose,
}: {
  ad: Ad;
  closed: boolean;
  closeable: boolean;
  countdown: number;
  onClose: () => void;
}) {
  if (closed) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10"
      style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.88), transparent)",
        height: 80,
        display: "flex", alignItems: "center",
        animation: closed ? "adSlideDown 0.3s ease forwards" : "adFadeIn 0.3s ease",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "0 14px",
      }}>
        {/* Esquerda */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <LogoOrIcon ad={ad} size={22} radius={5} />
          <span style={{ fontSize: "0.50rem", color: "rgba(255,255,255,0.38)", fontWeight: 700, letterSpacing: "0.1em" }}>ANÚNCIO</span>
        </div>

        {/* Centro */}
        <p style={{ flex: 1, fontSize: "0.75rem", fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ad.headline}
        </p>

        {/* Direita */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          <span
            onClick={() => recordClick(ad)}
            style={{
              padding: "3px 10px", borderRadius: 100, fontSize: "0.62rem", fontWeight: 800,
              color: "#fff", background: ad.accent_color, cursor: "pointer",
            }}
          >{ad.cta_text}</span>
          {closeable ? (
            <button
              onClick={e => { e.stopPropagation(); onClose(); }}
              style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.55rem", display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={9} /> Fechar
            </button>
          ) : (
            <span style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.28)" }}>Fechar em {countdown}s</span>
          )}
        </div>
      </div>

      {/* Countdown bar */}
      {!closeable && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.1)" }}>
          <div style={{
            height: "100%", background: ad.accent_color,
            animation: "countdownBar 8s linear forwards",
          }} />
        </div>
      )}
    </div>
  );
}

// ── Componente principal AdBanner ─────────────────────────────────────────────

export default function AdBanner({
  placement,
  format = "horizontal",
  className = "",
  videoElapsedSeconds = 0,
  ads: propAds,
}: AdBannerProps) {
  const [internalAds, setInternalAds] = useState<Ad[]>([]);
  const [loading, setLoading]         = useState(propAds === undefined);
  const [index, setIndex]         = useState(0);
  const [visible, setVisible]     = useState(true); // for fade transitions
  const [dvVisible, setDvVisible] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [closeable, setCloseable] = useState(false);
  const [closed, setClosed]       = useState(false);
  const impressionFired           = useRef(false);
  const rotateRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAds = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select("id,company_name,website_url,headline,description,cta_text,logo_url,bg_color,accent_color,plan_id,placement,impressions,clicks,media_type,media_url,thumbnail_url,video_url,format")
        .eq("status", "active")
        .contains("placement", [placement])
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInternalAds((data ?? []) as Ad[]);
    } catch (err) {
      console.warn("[AdBanner] Erro ao carregar anúncios:", err);
    } finally {
      setLoading(false);
    }
  }, [placement]);

  useEffect(() => {
    if (propAds !== undefined) return;
    loadAds();
    const interval = setInterval(loadAds, 30_000);
    return () => clearInterval(interval);
  }, [loadAds]);

  const ads = propAds ?? internalAds;

  // Rotação com fade
  useEffect(() => {
    if (ads.length <= 1) return;
    rotateRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % ads.length);
        impressionFired.current = false;
        setVisible(true);
      }, 300);
    }, 8000);
    return () => { if (rotateRef.current) clearInterval(rotateRef.current); };
  }, [ads.length]);

  // Impressão
  useEffect(() => {
    if (ads.length === 0 || impressionFired.current) return;
    if (placement === "during_video" && !dvVisible) return;
    impressionFired.current = true;
    recordImpression(ads[index]);
  }, [ads, index, placement, dvVisible]);

  // during_video: aparece após 5s
  useEffect(() => {
    if (placement !== "during_video") return;
    if (videoElapsedSeconds >= 5 && !closed) setDvVisible(true);
  }, [placement, videoElapsedSeconds, closed]);

  // during_video: countdown
  useEffect(() => {
    if (placement !== "during_video" || !dvVisible) return;
    setCountdown(8);
    setCloseable(false);
    const closeTimer = setTimeout(() => setCloseable(true), 8000);
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { clearTimeout(closeTimer); clearInterval(tick); };
  }, [dvVisible, placement]);

  if (loading) return null;

  if (ads.length === 0) {
    if (placement !== "all_pages") return null;
    return (
      <Link
        to="/anunciar"
        className={`w-full flex items-center justify-between border border-dashed border-white/8 bg-white/[0.015] px-6 py-4 group hover:border-neon-pink/25 hover:bg-white/[0.03] transition-all ${className}`}
        style={{ minHeight: "80px" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-center">
            <Megaphone size={13} className="text-white/18 group-hover:text-neon-pink/40 transition-colors" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/18 group-hover:text-white/35 transition-colors">Espaço publicitário disponível</p>
            <p className="text-[10px] text-white/10 group-hover:text-white/22 transition-colors mt-0.5">O teu anúncio aqui para milhares de visitantes</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-neon-pink/25 group-hover:text-neon-pink/55 transition-colors flex items-center gap-1.5 flex-shrink-0">
          Anunciar aqui <ExternalLink size={11} />
        </span>
      </Link>
    );
  }

  const ad = ads[index];

  if (format === "overlay") {
    if (!dvVisible) return null;
    return (
      <AdBannerOverlay
        ad={ad}
        closed={closed}
        closeable={closeable}
        countdown={countdown}
        onClose={() => setClosed(true)}
      />
    );
  }

  if (format === "card") {
    return <AdBannerCard ad={ad} className={className} />;
  }

  if (format === "fullscreen") {
    return <AdBannerFullscreen ad={ad} className={className} />;
  }

  // default: horizontal
  return (
    <>
      <style>{`
        @keyframes adFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes adShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes adSlideDown {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(100%); opacity: 0; }
        }
        @keyframes countdownBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes adParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.12; }
          50%       { transform: translateY(-8px) scale(1.3); opacity: 0.22; }
        }
        .ad-shimmer { animation: adShimmer 4s linear infinite; }
        .ad-particle { animation: adParticle 3s ease-in-out infinite; }
      `}</style>
      <AdBannerHorizontal ad={ad} visible={visible} />
    </>
  );
}
