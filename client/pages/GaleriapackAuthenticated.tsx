// client/pages/GaleriapackAuthenticated.tsx
// Detalhe de um pack da galeria premium
//
// FLUXO:
//   1. Auth check (getSession)
//   2. Subscription check → se não premium, redireciona para /app/galeria
//   3. Fetch pack + fotos + signed URLs (bucket privado galeria-fotos, TTL 3600s)
//   4. Likes / comentários / view tracking

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Lock, Crown, ImageIcon, Clock,
  ChevronLeft, ChevronRight, BadgeCheck, Unlock,
  Eye, X, ZoomIn, Heart, MessageCircle, Send, User,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Pack = {
  id: string;
  titulo: string;
  descricao: string | null;
  thumbnail_url: string | null;
  categoria: string;
  fotos_count: number;
  etiqueta: string | null;
  is_premium: boolean;
  views: number;
  created_at: string;
};

type RawFoto = {
  id: string;
  storage_path: string;
  ordem: number;
  is_preview: boolean;
  legenda: string | null;
};

type Foto = {
  id: string;
  foto_url: string;
  storage_path: string;
  ordem: number;
  is_preview: boolean;
  legenda: string | null;
  likes_count: number;
  comentarios_count: number;
  user_liked: boolean;
};

type Comment = {
  id: string;
  user_id: string;
  texto: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
};

type CountEntry = { likes: number; comentarios: number };

const SIGNED_URL_TTL = 3600;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Hoje";
  if (d === 1) return "Ontem";
  if (d < 7)   return `há ${d} dias`;
  return `há ${Math.floor(d / 7)} semanas`;
}

const ETIQUETA_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  Exclusivo: { text: "#a855f7", bg: "rgba(168,85,247,0.20)", border: "rgba(168,85,247,0.40)" },
  Raro:      { text: "#fbbf24", bg: "rgba(251,191,36,0.20)",  border: "rgba(251,191,36,0.40)"  },
  Normal:    { text: "#60a5fa", bg: "rgba(96,165,250,0.20)",  border: "rgba(96,165,250,0.40)"  },
  Hot:       { text: "#f87171", bg: "rgba(248,113,113,0.20)", border: "rgba(248,113,113,0.40)" },
};

// ─────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <LayoutAuthenticated>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: "linear-gradient(135deg,#ec4899,#9333ea)" }}>
          <ImageIcon size={24} className="text-white" />
        </div>
      </div>
    </LayoutAuthenticated>
  );
}

// ─────────────────────────────────────────────
// CommentsPanel
// ─────────────────────────────────────────────
function CommentsPanel({
  fotoId,
  currentUserId,
  onClose,
}: {
  fotoId: string;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [text,       setText]       = useState("");
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("galeria_fotos_comentarios")
      .select("id, user_id, texto, created_at, profiles_public(username, avatar_url)")
      .eq("foto_id", fotoId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []).map((c: any) => ({
          id:         c.id,
          user_id:    c.user_id,
          texto:      c.texto,
          created_at: c.created_at,
          username:   c.profiles_public?.username  ?? null,
          avatar_url: c.profiles_public?.avatar_url ?? null,
        })));
        setLoading(false);
      });
  }, [fotoId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("galeria_fotos_comentarios")
      .insert({ foto_id: fotoId, user_id: currentUserId, texto: trimmed })
      .select("id, user_id, texto, created_at")
      .single();
    if (!error && data) {
      setComments(prev => [...prev, { ...data, username: null, avatar_url: null }]);
      setText("");
    }
    setSubmitting(false);
  };

  return (
    // Backdrop (click to close)
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Panel: bottom sheet on mobile, right sidebar on desktop */}
      <div
        className="absolute bottom-0 left-0 right-0 sm:bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:w-80 flex flex-col"
        style={{
          height:     "65vh",
          background: "rgba(8,0,18,0.98)",
          border:     "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px 16px 0 0",
          boxShadow:  "0 -8px 40px rgba(0,0,0,0.60)",
          // Desktop overrides
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Desktop: full height override via inline style will be overridden by Tailwind sm classes — use a wrapper instead */}
        <style>{`
          @media(min-width:640px){
            .comments-panel{
              height:100% !important;
              border-radius:0 !important;
              box-shadow:-8px 0 40px rgba(0,0,0,0.60) !important;
            }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "rgba(255,255,255,0.65)" }}>
            <MessageCircle size={14} style={{ color: "#ec4899" }} />
            Comentários
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <X size={14} className="text-white/50" />
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "rgba(236,72,153,0.20)", borderTopColor: "#ec4899" }} />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <MessageCircle size={28} className="text-white/12" />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Sem comentários ainda.</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>Sê o primeiro!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(139,92,246,0.15))" }}
                >
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <User size={12} className="text-white/40" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {c.username ?? "utilizador"}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                      {fmtRelative(c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {c.texto}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {currentUserId ? (
          <div
            className="px-5 py-4 flex gap-3 items-end flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Escreve um comentário…"
              rows={2}
              className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background:  "rgba(255,255,255,0.05)",
                border:      "1px solid rgba(255,255,255,0.10)",
                color:       "rgba(255,255,255,0.80)",
              }}
            />
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: text.trim() ? "linear-gradient(135deg,#ec4899,#8b5cf6)" : "rgba(255,255,255,0.08)",
                opacity:    submitting ? 0.5 : 1,
              }}
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.30)" }}>
              Faz <Link to="/login" style={{ color: "#ec4899" }}>login</Link> para comentar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Lightbox (teclado + thumbnail strip + swipe + likes + comentários)
// ─────────────────────────────────────────────
function Lightbox({
  fotos, index, onClose, onPrev, onNext, onGoTo, onLike, onOpenComments,
}: {
  fotos:          Foto[];
  index:          number;
  onClose:        () => void;
  onPrev:         () => void;
  onNext:         () => void;
  onGoTo:         (i: number) => void;
  onLike:         (fotoId: string) => void;
  onOpenComments: (fotoId: string) => void;
}) {
  const foto    = fotos[index];
  const hasPrev = index > 0;
  const hasNext = index < fotos.length - 1;
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")                 onClose();
      if (e.key === "ArrowLeft"  && hasPrev)  onPrev();
      if (e.key === "ArrowRight" && hasNext)  onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > 50 && hasPrev)  onPrev();
    if (delta < -50 && hasNext) onNext();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/97 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4 z-10"
        style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.80) 0%,transparent 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: counter + legenda */}
        <div className="flex flex-col gap-0.5">
          <span className="text-white/50 text-sm font-bold tabular-nums">
            {index + 1} <span className="text-white/20">/</span> {fotos.length}
          </span>
          {foto.legenda && (
            <span className="text-[11px] text-white/40 max-w-[40vw] truncate">{foto.legenda}</span>
          )}
        </div>

        {/* Right: like + comment + close */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {/* Like */}
          <button
            onClick={() => onLike(foto.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <Heart
              size={14}
              fill={foto.user_liked ? "#ec4899" : "none"}
              stroke={foto.user_liked ? "#ec4899" : "rgba(255,255,255,0.45)"}
            />
            <span
              className="text-[11px] tabular-nums font-semibold"
              style={{ color: foto.user_liked ? "#ec4899" : "rgba(255,255,255,0.45)" }}
            >
              {foto.likes_count}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => onOpenComments(foto.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <MessageCircle size={14} className="text-white/45" />
            <span className="text-[11px] tabular-nums font-semibold text-white/45">
              {foto.comentarios_count}
            </span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <X size={16} className="text-white/50 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Seta esquerda */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.60)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ChevronLeft size={22} className="text-white/60 hover:text-white" />
        </button>
      )}

      {/* Imagem */}
      <div
        className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          key={foto.id}
          src={foto.foto_url}
          alt={`Foto ${index + 1}`}
          className="max-w-full max-h-[88vh] object-contain rounded-xl select-none"
          style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
          draggable={false}
        />
      </div>

      {/* Seta direita */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.60)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ChevronRight size={22} className="text-white/60 hover:text-white" />
        </button>
      )}

      {/* Thumbnail strip */}
      {fotos.length > 1 && (
        <div
          className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 px-4 py-4 overflow-x-auto scrollbar-none"
          style={{ background: "linear-gradient(to top,rgba(0,0,0,0.80) 0%,transparent 100%)" }}
          onClick={e => e.stopPropagation()}
        >
          {fotos.map((f, i) => (
            <button
              key={f.id}
              onClick={() => onGoTo(i)}
              className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden transition-all"
              style={{
                border:    i === index ? "2px solid #ec4899" : "2px solid rgba(255,255,255,0.10)",
                opacity:   i === index ? 1 : 0.5,
                transform: i === index ? "scale(1.10)" : "scale(1)",
                boxShadow: i === index ? "0 0 12px rgba(236,72,153,0.5)" : "none",
              }}
            >
              <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="absolute bottom-20 right-5 text-[10px] text-white/15 hidden sm:flex items-center gap-3">
        <span>← → navegar</span>
        <span>ESC fechar</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Grelha de fotos (masonry rhythm)
// ─────────────────────────────────────────────
function FotoGrid({ fotos, onOpen }: { fotos: Foto[]; onOpen: (idx: number) => void }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5"
      style={{ gridAutoRows: "minmax(120px, auto)" }}
    >
      {fotos.map((foto, i) => {
        const isFeatured = i % 7 === 0;
        return (
          <div
            key={foto.id}
            onClick={() => onOpen(i)}
            className="group relative rounded-xl overflow-hidden cursor-pointer transition-all"
            style={{
              border:      "1px solid rgba(255,255,255,0.08)",
              background:  "rgba(0,0,0,0.30)",
              gridColumn:  isFeatured ? "span 2" : undefined,
              gridRow:     isFeatured ? "span 2" : undefined,
              aspectRatio: isFeatured ? undefined : "1/1",
              minHeight:   isFeatured ? "260px" : undefined,
            }}
          >
            <img
              src={foto.foto_url}
              alt={foto.legenda ?? `Foto ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {foto.legenda && (
              <div
                className="absolute bottom-0 inset-x-0 px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,0.80) 0%,transparent 100%)" }}
              >
                <p className="text-[10px] text-white/75 line-clamp-1">{foto.legenda}</p>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm"
                style={{ background: "rgba(236,72,153,0.70)", boxShadow: "0 0 16px rgba(236,72,153,0.40)" }}
              >
                <ZoomIn size={15} className="text-white" />
              </div>
            </div>
            {/* Like badge */}
            {foto.likes_count > 0 && (
              <div
                className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ background: "rgba(0,0,0,0.60)", color: "rgba(236,72,153,0.90)" }}
              >
                <Heart size={8} fill="currentColor" stroke="none" />
                {foto.likes_count}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function GaleriaPackAuthenticated() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loadingAuth,   setLoadingAuth]   = useState(true);
  const [authChecked,   setAuthChecked]   = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [pack,       setPack]       = useState<Pack | null>(null);
  const [fotos,      setFotos]      = useState<Foto[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [isPremium,  setIsPremium]  = useState(false);
  const [subChecked, setSubChecked] = useState(false);

  const [lbIndex,    setLbIndex]    = useState<number | null>(null);
  const [rawFotos,   setRawFotos]   = useState<RawFoto[]>([]);
  const [likedSet,   setLikedSet]   = useState<Set<string>>(new Set());
  const [countMap,   setCountMap]   = useState<Map<string, CountEntry>>(new Map());
  const [commentsFotoId, setCommentsFotoId] = useState<string | null>(null);
  const [previewFotos,  setPreviewFotos]  = useState<string[]>([]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1. Auth ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) {
        setCurrentUserId(uid);
        setAuthChecked(true);
      }
      setLoadingAuth(false);
    });
  }, []);

  // ── 2. Subscription check ────────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked || !currentUserId) return;

    supabase
      .from("galeria_subscricoes")
      .select("status, periodo_fim, trial_fim")
      .eq("user_id", currentUserId)
      .in("status", ["active", "trial"])
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const now     = new Date();
          const fimOk   = data.periodo_fim ? new Date(data.periodo_fim) > now : true;
          const trialOk = data.trial_fim   ? new Date(data.trial_fim)   > now : true;
          if (
            (data.status === "active" && fimOk) ||
            (data.status === "trial"  && trialOk)
          ) {
            setIsPremium(true);
          }
        }
        setSubChecked(true);
      });
  }, [authChecked, currentUserId]);

  // ── 3. Redirect não-premium ──────────────────────────────────────────────
  useEffect(() => {
    if (!subChecked || !pack) return;
    if (pack.is_premium && !isPremium) {
      navigate("/app/galeria", { replace: true });
    }
  }, [subChecked, pack, isPremium, navigate]);

  // ── 4. Gerar signed URLs ─────────────────────────────────────────────────
  const buildSignedFotos = useCallback(async (
    raws:     RawFoto[],
    liked:    Set<string>              = new Set(),
    counts:   Map<string, CountEntry>  = new Map(),
  ): Promise<Foto[]> => {
    console.log("[signed urls] input length:", raws.length);
    const paths     = raws.map(f => f.storage_path).filter(Boolean);
    const signedMap = new Map<string, string>();

    if (paths.length > 0) {
      const { data: signedData } = await supabase.storage
        .from("galeria-fotos")
        .createSignedUrls(paths, SIGNED_URL_TTL);
      if (signedData) {
        for (const item of signedData) {
          if (item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }
    }

    return raws.map(f => {
      const c = counts.get(f.id) ?? { likes: 0, comentarios: 0 };
      return {
        id:                f.id,
        foto_url:          signedMap.get(f.storage_path) ?? "",
        storage_path:      f.storage_path,
        ordem:             f.ordem,
        is_preview:        f.is_preview,
        legenda:           f.legenda ?? null,
        likes_count:       c.likes,
        comentarios_count: c.comentarios,
        user_liked:        liked.has(f.id),
      };
    });
  }, []);

  // ── 5. Fetch pack + fotos + counts + likes + signed URLs ─────────────────
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [packRes, fotosRes] = await Promise.all([
      supabase.from("galeria_packs").select("*").eq("id", id).single(),
      supabase
        .from("galeria_fotos")
        .select(`
          id, storage_path, ordem, is_preview,
          likes_agg:galeria_fotos_likes(count),
          coments_agg:galeria_fotos_comentarios(count)
        `)
        .eq("pack_id", id)
        .order("ordem", { ascending: true }),
    ]);

    console.log("[galeria_fotos] data length:", fotosRes.data?.length, "error:", fotosRes.error, "packId:", id);

    const packData = (packRes.data as Pack) ?? null;
    setPack(packData);

    const rawsRaw = (fotosRes.data ?? []) as any[];

    const raws: RawFoto[] = rawsRaw.map(r => ({
      id:           r.id,
      storage_path: r.storage_path,
      ordem:        r.ordem,
      is_preview:   r.is_preview,
      legenda:      r.legenda ?? null,
    }));

    const newCountMap = new Map<string, CountEntry>();
    for (const r of rawsRaw) {
      newCountMap.set(r.id, {
        likes:       r.likes_agg?.[0]?.count  ?? 0,
        comentarios: r.coments_agg?.[0]?.count ?? 0,
      });
    }

    let newLikedSet = new Set<string>();
    if (currentUserId && raws.length > 0) {
      const { data: likedData } = await supabase
        .from("galeria_fotos_likes")
        .select("foto_id")
        .eq("user_id", currentUserId)
        .in("foto_id", raws.map(r => r.id));
      newLikedSet = new Set((likedData ?? []).map((r: any) => r.foto_id));
    }

    setRawFotos(raws);
    setLikedSet(newLikedSet);
    setCountMap(newCountMap);
    setFotos(await buildSignedFotos(raws, newLikedSet, newCountMap));

    if (packData) {
      supabase
        .from("galeria_packs")
        .update({ views: (packData.views ?? 0) + 1 })
        .eq("id", id)
        .then(() => {});
    }

    setLoading(false);
  }, [id, buildSignedFotos, currentUserId]);

  useEffect(() => {
    if (authChecked) fetchData();
  }, [fetchData, authChecked]);

  // ── 6. Refresh automático de signed URLs ─────────────────────────────────
  useEffect(() => {
    if (rawFotos.length === 0) return;
    const REFRESH_MS = SIGNED_URL_TTL * 0.90 * 1000;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      setFotos(await buildSignedFotos(rawFotos, likedSet, countMap));
    }, REFRESH_MS);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [rawFotos, buildSignedFotos, likedSet, countMap]);

  // ── 7. Fetch preview images (public bucket, no auth) ─────────────────────
  useEffect(() => {
    if (!id) return;
    supabase
      .from("galeria_fotos")
      .select("storage_path")
      .eq("pack_id", id)
      .eq("is_preview", true)
      .limit(6)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const urls = (data as { storage_path: string }[])
          .map(f => supabase.storage.from("galeria-fotos").getPublicUrl(f.storage_path).data.publicUrl)
          .filter(Boolean);
        setPreviewFotos(urls);
      });
  }, [id]);

  // ── Like toggle ───────────────────────────────────────────────────────────
  const toggleLike = useCallback(async (fotoId: string) => {
    if (!currentUserId) return;
    const wasLiked = likedSet.has(fotoId);

    // Optimistic update
    const newLikedSet = new Set(likedSet);
    if (wasLiked) newLikedSet.delete(fotoId);
    else          newLikedSet.add(fotoId);
    setLikedSet(newLikedSet);

    setFotos(prev => prev.map(f =>
      f.id === fotoId
        ? { ...f, user_liked: !wasLiked, likes_count: wasLiked ? f.likes_count - 1 : f.likes_count + 1 }
        : f
    ));

    setCountMap(prev => {
      const next = new Map(prev);
      const c    = next.get(fotoId) ?? { likes: 0, comentarios: 0 };
      next.set(fotoId, { ...c, likes: wasLiked ? c.likes - 1 : c.likes + 1 });
      return next;
    });

    if (wasLiked) {
      await supabase
        .from("galeria_fotos_likes")
        .delete()
        .eq("foto_id", fotoId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("galeria_fotos_likes")
        .insert({ foto_id: fotoId, user_id: currentUserId });
    }
  }, [currentUserId, likedSet]);

  // ── Lightbox helpers ──────────────────────────────────────────────────────
  const openLb = (idx: number) => {
    setLbIndex(idx);
    const foto = fotos[idx];
    if (currentUserId && foto) {
      supabase
        .from("galeria_fotos_views")
        .insert({ foto_id: foto.id, user_id: currentUserId })
        .then(() => {});
    }
  };
  const closeLb = () => setLbIndex(null);
  const goToLb  = (i: number) => {
    setLbIndex(i);
    const foto = fotos[i];
    if (currentUserId && foto) {
      supabase
        .from("galeria_fotos_views")
        .insert({ foto_id: foto.id, user_id: currentUserId })
        .then(() => {});
    }
  };
  const prevLb = () => setLbIndex(i => (i !== null && i > 0               ? i - 1 : i));
  const nextLb = () => setLbIndex(i => (i !== null && i < fotos.length - 1 ? i + 1 : i));

  // ── Estados de carregamento ───────────────────────────────────────────────
  if (loadingAuth) return <LoadingSpinner />;
  if (loading)     return <LoadingSpinner />;

  if (!pack) {
    return (
      <LayoutAuthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ImageIcon size={48} className="text-white/15" />
          <p className="text-white/40 text-sm">Pack não encontrado.</p>
          <Link to="/app/galeria" className="text-sm transition-colors" style={{ color: "#ec4899" }}>
            ← Voltar à galeria
          </Link>
        </div>
      </LayoutAuthenticated>
    );
  }

  const etq = pack.etiqueta ? (ETIQUETA_STYLES[pack.etiqueta] ?? null) : null;

  return (
    <LayoutAuthenticated>

      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position:   "relative",
          height:     "60vh",
          minHeight:  "320px",
          overflow:   "hidden",
          background: pack.thumbnail_url
            ? `url(${pack.thumbnail_url}) center/cover no-repeat`
            : "linear-gradient(135deg,#0f0218 0%,#1a0830 50%,#0a0f1e 100%)",
        }}
      >
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to bottom,rgba(8,0,16,0.30) 0%,rgba(8,0,16,0.55) 40%,rgba(8,0,16,0.92) 100%)",
          }}
        />

        <button
          onClick={() => navigate("/app/galeria")}
          className="absolute top-5 left-5 flex items-center gap-2 text-sm font-semibold transition-all z-10 px-3 py-2 rounded-xl"
          style={{
            color:          "rgba(255,255,255,0.80)",
            background:     "rgba(0,0,0,0.45)",
            border:         "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={16} /> Galeria
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-7 pt-16 z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {etq && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                style={{ color: etq.text, background: etq.bg, border: `1px solid ${etq.border}` }}
              >
                {pack.etiqueta}
              </span>
            )}
            {isPremium && (
              <span
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black"
                style={{ color: "#34d399", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.25)" }}
              >
                <BadgeCheck size={9} /> Premium Activo
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            {pack.titulo}
          </h1>

          {pack.descricao && (
            <p className="text-sm mb-3 max-w-xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              {pack.descricao}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
            <span className="flex items-center gap-1.5">
              <ImageIcon size={11} /> {pack.fotos_count} fotos
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={11} /> {pack.views} vistas
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} /> {fmtRelative(pack.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONTEÚDO
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {isPremium && fotos.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>
              <span className="flex items-center gap-1.5">
                <Unlock size={10} style={{ color: "#34d399" }} />
                Galeria totalmente desbloqueada
              </span>
              <span style={{ color: "#34d399" }} className="font-bold">{fotos.length} fotos disponíveis</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full w-full rounded-full" style={{ background: "linear-gradient(90deg,#34d399,#10b981)" }} />
            </div>
          </div>
        )}

        {fotos.length > 0 && isPremium && (
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
              style={{ color: "rgba(255,255,255,0.30)" }}>
              <Unlock size={10} style={{ color: "#34d399" }} />
              Galeria completa — {fotos.length} fotos
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.20)" }}>
              Clica para ampliar · ← → para navegar
            </p>
          </div>
        )}

        {fotos.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <ImageIcon size={36} style={{ color: "rgba(255,255,255,0.12)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Ainda sem fotos neste pack.</p>
          </div>
        ) : isPremium ? (
          <FotoGrid fotos={fotos} onOpen={openLb} />
        ) : (
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ minHeight: "360px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.30)" }}
          >
            {/* Blurred preview images */}
            {previewFotos.length > 0 && (
              <div
                className="absolute inset-0 grid grid-cols-3"
                style={{ pointerEvents: "none", zIndex: 0 }}
              >
                {previewFotos.map((url, i) => (
                  <div key={i} className="overflow-hidden">
                    <img
                      src={url}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                      style={{ filter: "blur(12px) brightness(0.4)", transform: "scale(1.05)" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Lock UI */}
            <div
              className="relative flex flex-col items-center justify-center gap-5"
              style={{ minHeight: "360px", zIndex: 1 }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:     "rgba(236,72,153,0.18)",
                  border:         "1px solid rgba(236,72,153,0.45)",
                  backdropFilter: "blur(8px)",
                  boxShadow:      "0 0 32px rgba(236,72,153,0.25)",
                }}
              >
                <Lock size={28} style={{ color: "#ec4899" }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Conteúdo bloqueado
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Subscreve para desbloquear este pack
                </p>
              </div>
              <button
                onClick={() => navigate("/app/galeria")}
                className="px-6 py-2.5 rounded-xl text-sm font-black transition-all"
                style={{
                  background: "linear-gradient(90deg,#ec4899,#9333ea)",
                  color:      "white",
                  boxShadow:  "0 0 20px rgba(236,72,153,0.35)",
                }}
              >
                Ver planos →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lbIndex !== null && (
        <Lightbox
          fotos={fotos}
          index={lbIndex}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
          onGoTo={goToLb}
          onLike={toggleLike}
          onOpenComments={fotoId => setCommentsFotoId(fotoId)}
        />
      )}

      {/* Comments panel */}
      {commentsFotoId !== null && (
        <CommentsPanel
          fotoId={commentsFotoId}
          currentUserId={currentUserId}
          onClose={() => setCommentsFotoId(null)}
        />
      )}

    </LayoutAuthenticated>
  );
}
