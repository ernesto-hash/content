// client/pages/GaleriaAuthenticated.tsx
// Galeria Premium — versão autenticada
// • subStatus "none"    → página de vendas cinematográfica
// • subStatus "active"  → galeria real elevada com todos os packs
// • URL ?success=true   → redireciona para /app/checkout/sucesso

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Crown, ImageIcon, Shield, X, Check, Gem,
  BadgeCheck, Lock, Search, SlidersHorizontal,
  Eye, Clock, Flame, TrendingUp, Grid3x3, Sparkles,
  ChevronRight, AlertTriangle, ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type SubStatus = "loading" | "active" | "trial" | "none";

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
  destaque: boolean;
  created_at: string;
};

type SortKey   = "recentes" | "populares" | "destaque";
type FilterKey = "todos" | "Normal" | "Exclusivo" | "Raro";

// ─────────────────────────────────────────────
// URLs das imagens
// ─────────────────────────────────────────────
const SIDE_LEFT_IMGS  = ["/assets/galeria/side-left-1.jpg",  "/assets/galeria/side-left-2.jpg"];
const SIDE_RIGHT_IMGS = ["/assets/galeria/side-right-1.jpg", "/assets/galeria/side-right-2.jpg"];
const PREVIEW_THUMBS  = ["/assets/galeria/preview-1.jpg", "/assets/galeria/preview-2.jpg", "/assets/galeria/preview-3.jpg"];

const PREVIEW_THUMBS_6 = [
  "/assets/galeria/preview-1.jpg",
  "/assets/galeria/preview-2.jpg",
  "/assets/galeria/preview-3.jpg",
  "/assets/galeria/side-left-1.jpg",
  "/assets/galeria/side-right-1.jpg",
  "/assets/galeria/side-left-2.jpg",
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#ec4899,#9333ea)",
  "linear-gradient(135deg,#9333ea,#3b82f6)",
  "linear-gradient(135deg,#fbbf24,#ec4899)",
  "linear-gradient(135deg,#34d399,#3b82f6)",
  "linear-gradient(135deg,#f472b6,#a855f7)",
];

// ─────────────────────────────────────────────
// Planos
// ─────────────────────────────────────────────
const PLANOS = [
  {
    id: "normal", label: "Acesso Normal", icon: <ImageIcon size={20} />,
    cor: "from-blue-500 to-blue-700", corBorder: "border-blue-500/50",
    corText: "text-blue-400", corBg: "bg-blue-500/10",
    mensal: "4,49€", anual: "40€",
    stripeIds: { mensal: "price_1TH1C3DszTPKV7EvnXKm5As8", anual: "price_1TH1ClDszTPKV7Evt6NJEOlz" },
    desc: "Acesso ao conteúdo base da galeria.",
    beneficios: ["Acesso a packs normais","Novos packs mensais","Visualização em HD","Cancela quando quiseres"],
  },
  {
    id: "exclusivo", label: "Conteúdo Exclusivo", icon: <Crown size={20} />,
    cor: "from-pink-500 to-purple-600", corBorder: "border-pink-500/50",
    corText: "text-pink-400", corBg: "bg-pink-500/10",
    mensal: "6,65€", anual: "60€", destaque: true,
    stripeIds: { mensal: "price_1TH1EPDszTPKV7EvW1A8d7lO", anual: "price_1TH1EPDszTPKV7EvunbX6zsA" },
    desc: "Conteúdo exclusivo que não encontras em mais lado.",
    beneficios: ["Tudo do Pack Normal","Conteúdo exclusivo premium","Packs adicionados semanalmente","Download em alta resolução"],
  },
  {
    id: "raro", label: "Conteúdo Raro", icon: <Gem size={20} />,
    cor: "from-amber-400 to-orange-500", corBorder: "border-amber-400/50",
    corText: "text-amber-400", corBg: "bg-amber-400/10",
    mensal: "9€", anual: "75€",
    stripeIds: { mensal: "price_1TH1FGDszTPKV7EvwBtzv0YS", anual: "price_1TH1FGDszTPKV7EvIiTagCyU" },
    desc: "O topo da galeria. Conteúdo raro e irrepetível.",
    beneficios: ["Tudo dos planos anteriores","Conteúdo raro e exclusivo","Acesso antecipado a novos packs","Suporte prioritário"],
  },
] as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtViews(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}
function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Hoje";
  if (d === 1) return "Ontem";
  if (d < 7)   return `há ${d} dias`;
  return `há ${Math.floor(d / 7)} sem`;
}
function isNovo(iso: string) {
  return (Date.now() - new Date(iso).getTime()) < 7 * 86400000;
}

const ETIQUETA_STYLES: Record<string, string> = {
  Exclusivo: "bg-purple-500/20 border-purple-500/40 text-purple-400",
  Raro:      "bg-amber-500/20 border-amber-500/40 text-amber-400",
  Normal:    "bg-blue-500/20 border-blue-500/40 text-blue-400",
  Hot:       "bg-red-500/20 border-red-500/40 text-red-400",
};

// ─────────────────────────────────────────────
// Coluna lateral com fotos (não usada na nova landing)
// ─────────────────────────────────────────────
function SideColumn({ imgs, side }: { imgs: string[]; side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div className="absolute top-0 h-full pointer-events-none select-none"
      style={{ [isLeft ? "left" : "right"]: 0, width: "clamp(72px,18vw,260px)", zIndex: 0 }}>
      <div className="absolute top-0 left-0 w-full" style={{ height: "55%" }}>
        <img src={imgs[0]} alt="" aria-hidden="true" className="w-full h-full object-cover"
          style={{ objectPosition: isLeft ? "right center" : "left center", opacity: 0.6 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#2a0838 0%,#180624 100%)", zIndex: -1 }} />
      </div>
      <div className="absolute bottom-0 left-0 w-full" style={{ height: "50%" }}>
        <img src={imgs[1]} alt="" aria-hidden="true" className="w-full h-full object-cover"
          style={{ objectPosition: isLeft ? "right center" : "left center", opacity: 0.5 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#180624 0%,#0c0416 100%)", zIndex: -1 }} />
      </div>
      <div className="absolute inset-0" style={{
        background: isLeft
          ? "linear-gradient(to right, rgba(8,0,14,0.1) 0%, rgba(8,0,14,0.55) 70%, rgba(8,0,14,1) 100%)"
          : "linear-gradient(to left, rgba(8,0,14,0.1) 0%, rgba(8,0,14,0.55) 70%, rgba(8,0,14,1) 100%)",
      }} />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(8,0,14,0.75) 0%, transparent 15%, transparent 82%, rgba(8,0,14,0.75) 100%)",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Popup de subscrição — navega para Checkout
// ─────────────────────────────────────────────
function SubscribePopup({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<"mensal" | "anual">("mensal");

  const handleSelect = (planoId: string) => {
    navigate(`/app/checkout?plano=${planoId}&periodo=${periodo}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-pink-500/25 max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(135deg,#120820 0%,#1a0a2e 50%,#0d1220 100%)" }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(236,72,153,0.10)" }} />
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
          <X size={15} />
        </button>
        <div className="relative p-7 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#ec4899,#9333ea)", boxShadow: "0 0 25px rgba(236,72,153,0.3)" }}>
              <Crown size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Escolhe o teu Plano</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Acesso imediato após subscrição</p>
          </div>
          {/* Toggle mensal/anual */}
          <div className="flex items-center justify-center gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
            {(["mensal","anual"] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={periodo === p
                  ? { background: "rgba(236,72,153,0.20)", border: "1px solid rgba(236,72,153,0.30)", color: "#ec4899" }
                  : { color: "rgba(255,255,255,0.4)" }}>
                {p === "mensal" ? "Mensal" : "Anual"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {PLANOS.map(plano => (
              <button key={plano.id}
                onClick={() => handleSelect(plano.id)}
                className={`relative w-full rounded-xl border p-4 text-left transition-all hover:scale-[1.01] ${plano.corBorder} ${plano.corBg} ${"destaque" in plano && plano.destaque ? "ring-1 ring-pink-500/25" : ""}`}>
                {"destaque" in plano && plano.destaque && (
                  <div className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-white text-[9px] font-black"
                    style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                    MAIS POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${plano.cor} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white">{plano.icon}</span>
                    </div>
                    <div>
                      <p className={`font-black text-sm ${plano.corText}`}>{plano.label}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{plano.desc}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-white font-black text-xl">{periodo === "mensal" ? plano.mensal : plano.anual}</p>
                    <p className={`text-[10px] ${plano.corText}`}>{periodo === "mensal" ? "/mês" : "/ano"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Shield size={11} /> Pagamento seguro via Stripe · Cancela quando quiseres
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PackCard elevado — 2/3 aspect, VER PACK hover
// ─────────────────────────────────────────────
function PackCard({ pack }: { pack: Pack }) {
  const etqClass = pack.etiqueta
    ? (ETIQUETA_STYLES[pack.etiqueta] ?? "bg-white/10 border-white/20 text-white/60")
    : "";
  const novo = isNovo(pack.created_at);
  const hoverShadow = pack.etiqueta === "Exclusivo"
    ? "0 16px 50px rgba(147,51,234,0.40)"
    : pack.etiqueta === "Raro"
    ? "0 16px 50px rgba(251,191,36,0.35)"
    : "0 16px 50px rgba(59,130,246,0.28)";

  return (
    <a
      href={`/app/galeria/${pack.id}`}
      className="group relative rounded-2xl overflow-hidden border border-white/8 bg-black/30 transition-all duration-300 hover:border-white/18"
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = hoverShadow;
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/10 to-pink-900/5"
        style={{ aspectRatio: "2/3" }}>
        {pack.thumbnail_url ? (
          <img src={pack.thumbnail_url} alt={pack.titulo} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {pack.etiqueta && (
            <div className={`self-start px-2.5 py-0.5 rounded-full border text-[10px] font-black backdrop-blur-sm ${etqClass}`}>
              {pack.etiqueta}
            </div>
          )}
          {novo && (
            <div className="self-start px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse"
              style={{ background: "rgba(52,211,153,0.25)", border: "1px solid rgba(52,211,153,0.45)", color: "#34d399" }}>
              NOVO
            </div>
          )}
        </div>
        {pack.destaque && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 text-[9px] font-black"
            style={{ background: "rgba(251,191,36,0.20)", border: "1px solid rgba(251,191,36,0.40)", color: "#fbbf24" }}>
            <Flame size={8} /> DESTAQUE
          </div>
        )}
        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1"
          style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>
          <Lock size={7} /> SÓ MEMBROS
        </div>
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-sm text-white text-[11px] font-black flex items-center gap-1"
          style={{ background: "rgba(0,0,0,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <ImageIcon size={10} /> {pack.fotos_count}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-5 py-2.5 rounded-xl font-black text-white text-sm flex items-center gap-2"
            style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)", boxShadow: "0 0 24px rgba(236,72,153,0.50)" }}>
            VER PACK <ChevronRight size={16} />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-black text-white leading-tight group-hover:text-pink-400 transition-colors line-clamp-1">
          {pack.titulo}
        </h3>
        {pack.descricao && (
          <p className="text-[11px] line-clamp-1" style={{ color: "rgba(255,255,255,0.35)" }}>{pack.descricao}</p>
        )}
        <div className="flex items-center justify-between text-[10px] pt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          <span className="flex items-center gap-1"><Eye size={9} /> {fmtViews(pack.views)} vistas</span>
          <span className="flex items-center gap-1"><Clock size={9} /> {fmtRelative(pack.created_at)}</span>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────
// Card de destaque elevado (280px, 2/3)
// ─────────────────────────────────────────────
function FeaturedPackCard({ pack }: { pack: Pack }) {
  const etqClass = pack.etiqueta
    ? (ETIQUETA_STYLES[pack.etiqueta] ?? "bg-white/10 border-white/20 text-white/60")
    : "";
  const novo = isNovo(pack.created_at);
  return (
    <a href={`/app/galeria/${pack.id}`}
      className="group relative rounded-2xl overflow-hidden flex-shrink-0 transition-all hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.65)]"
      style={{ width: "280px", border: "1px solid rgba(255,255,255,0.10)" }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3", background: "linear-gradient(160deg,#1a0830,#0a0f1e)" }}>
        {pack.thumbnail_url ? (
          <img src={pack.thumbnail_url} alt={pack.titulo} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={36} style={{ color: "rgba(255,255,255,0.10)" }} />
          </div>
        )}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0) 100%)"
        }} />
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{ background: "rgba(251,191,36,0.25)", border: "1px solid rgba(251,191,36,0.50)", color: "#fbbf24" }}>
            <Flame size={8} /> DESTAQUE
          </div>
          {pack.etiqueta && (
            <div className={`self-start px-2 py-0.5 rounded-full border text-[9px] font-black backdrop-blur-sm ${etqClass}`}>
              {pack.etiqueta}
            </div>
          )}
          {novo && (
            <div className="self-start px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse"
              style={{ background: "rgba(52,211,153,0.25)", border: "1px solid rgba(52,211,153,0.45)", color: "#34d399" }}>
              NOVO
            </div>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-1">
          <h3 className="text-sm font-black text-white leading-tight line-clamp-2 group-hover:text-pink-300 transition-colors">
            {pack.titulo}
          </h3>
          <div className="flex items-center justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.40)" }}>
            <span className="flex items-center gap-1"><ImageIcon size={8} /> {pack.fotos_count}</span>
            <span className="flex items-center gap-1"><Eye size={8} /> {fmtViews(pack.views)}</span>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center"
            style={{ background: "rgba(236,72,153,0.80)", boxShadow: "0 0 20px rgba(236,72,153,0.5)" }}>
            <ChevronRight size={20} className="text-white ml-0.5" />
          </div>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function GaleriaAuthenticated() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const successParam    = searchParams.get("success");
  const upgradeParam    = searchParams.get("upgrade");
  const fromSucesso     = searchParams.get("from") === "sucesso";

  const [currentUserId,   setCurrentUserId]   = useState<string | null>(null);
  const [subStatus,       setSubStatus]       = useState<SubStatus>("loading");
  const [planoUtilizador, setPlanoUtilizador] = useState<string | null>(null);
  const [packs, setPacks]                     = useState<Pack[]>([]);
  const [packsLoading, setPacksLoading]   = useState(false);
  const [showPopup, setShowPopup]         = useState(false);
  const [totalUsers]                      = useState(2847);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todos");
  const [sort, setSort]     = useState<SortKey>("recentes");

  const featuredScrollRef = useRef<HTMLDivElement>(null);

  // ── Estado para a landing de planos ──────────────────
  const [periodo, setPeriodo]               = useState<"mensal" | "anual">("mensal");
  const [heroVisible,       setHeroVisible]       = useState(false);
  const [statsVisible,      setStatsVisible]      = useState(false);
  const [previewVisible,    setPreviewVisible]    = useState(false);
  const [plansVisible,      setPlansVisible]      = useState(false);
  const [guaranteesVisible, setGuaranteesVisible] = useState(false);
  const [ctaVisible,        setCtaVisible]        = useState(false);
  const [counterVal,        setCounterVal]        = useState(0);

  const heroRef         = useRef<HTMLElement>(null);
  const statsRef        = useRef<HTMLElement>(null);
  const previewRef      = useRef<HTMLElement>(null);
  const plansRef        = useRef<HTMLElement>(null);
  const guaranteesRef   = useRef<HTMLElement>(null);
  const ctaFinalRef     = useRef<HTMLElement>(null);

  // Activa hero imediatamente
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Contador animado (0 → 2847 em 2s, ease-out cubic)
  useEffect(() => {
    if (!heroVisible) return;
    const dur = 2000;
    const target = 2847;
    const s = Date.now();
    let raf: number;
    const tick = () => {
      const prog = Math.min((Date.now() - s) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setCounterVal(Math.floor(eased * target));
      if (prog < 1) { raf = requestAnimationFrame(tick); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heroVisible]);

  // IntersectionObserver para as restantes secções
  useEffect(() => {
    const sections: [React.RefObject<HTMLElement>, React.Dispatch<React.SetStateAction<boolean>>][] = [
      [statsRef,      setStatsVisible],
      [previewRef,    setPreviewVisible],
      [plansRef,      setPlansVisible],
      [guaranteesRef, setGuaranteesVisible],
      [ctaFinalRef,   setCtaVisible],
    ];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            sections.find(([r]) => r.current === e.target)?.[1](true);
          }
        });
      },
      { threshold: 0.12 }
    );
    sections.forEach(([r]) => { if (r.current) obs.observe(r.current); });
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (successParam === "true") {
      navigate("/app/checkout/sucesso", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) setCurrentUserId(uid);
    });
  }, []);

  const checkSubscription = useCallback(async (userId: string, attempt = 0) => {
    const { data } = await supabase
      .from("galeria_subscricoes")
      .select("status,plano,periodo_fim,trial_fim")
      .eq("user_id", userId)
      .in("status", ["active","trial"])
      .maybeSingle();

    if (data) {
      const now     = new Date();
      const fimOk   = data.periodo_fim ? new Date(data.periodo_fim) > now : true;
      const trialOk = data.trial_fim   ? new Date(data.trial_fim)   > now : true;
      if (data.status === "trial"  && trialOk) {
        setPlanoUtilizador(data.plano ?? null);
        setSubStatus("trial");
        return;
      }
      if (data.status === "active" && fimOk) {
        setPlanoUtilizador(data.plano ?? null);
        setSubStatus("active");
        return;
      }
    }

    if (fromSucesso && attempt < 12) {
      setTimeout(() => checkSubscription(userId, attempt + 1), 2500);
    } else {
      setSubStatus("none");
    }
  }, [fromSucesso]);

  useEffect(() => {
    if (!currentUserId) return;
    checkSubscription(currentUserId);
  }, [currentUserId, checkSubscription]);

  useEffect(() => {
    if (subStatus === "loading" || !planoUtilizador) return;
    const isPrem = subStatus === "active" || subStatus === "trial";
    if (!isPrem) return;
    if (upgradeParam === "true" || successParam === "true" || fromSucesso) return;
    if (planoUtilizador === "raro")      { navigate("/app/galeria/raro",      { replace: true }); return; }
    if (planoUtilizador === "exclusivo") { navigate("/app/galeria/exclusivo", { replace: true }); return; }
    navigate("/app/galeria/normal", { replace: true });
  }, [subStatus, planoUtilizador, upgradeParam, successParam, fromSucesso, navigate]);

  const fetchPacks = useCallback(async () => {
    setPacksLoading(true);
    const { data } = await supabase
      .from("galeria_packs")
      .select("*")
      .order(sort === "populares" ? "views" : "created_at", { ascending: false });
    setPacks((data ?? []) as Pack[]);
    setPacksLoading(false);
  }, [sort]);

  useEffect(() => {
    if (subStatus === "active" || subStatus === "trial") fetchPacks();
  }, [subStatus, fetchPacks]);

  useEffect(() => {
    const el = featuredScrollRef.current;
    if (!el) return;
    let rafId: number;
    let paused = false;
    const step = () => {
      if (!paused && el) {
        el.scrollLeft += 0.55;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    const pause  = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart",  pause,  { passive: true });
    el.addEventListener("touchend",    resume, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart",  pause);
      el.removeEventListener("touchend",    resume);
    };
  }, [packs]);

  const isPremium = subStatus === "active" || subStatus === "trial";

  const filteredPacks = packs
    .filter(p => filter === "todos" || p.etiqueta === filter)
    .filter(p => !search || p.titulo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "destaque" ? (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) : 0);

  const totalFotos = packs.reduce((acc, p) => acc + p.fotos_count, 0);
  const novosCount = packs.filter(p => isNovo(p.created_at)).length;

  // ── Loading ──
  if (subStatus === "loading") {
    return (
      <LayoutAuthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#ec4899", borderTopColor: "transparent" }}
          />
          {fromSucesso && (
            <p className="text-sm font-semibold" style={{ color: "rgba(236,72,153,0.80)" }}>
              A activar o teu acesso premium, aguarda um momento...
            </p>
          )}
        </div>
      </LayoutAuthenticated>
    );
  }

  // ════════════════════════════════════════════════════
  // NÃO PREMIUM — landing cinematográfica de vendas
  // ════════════════════════════════════════════════════
  if (!isPremium) {
    return (
      <LayoutAuthenticated>
        {/* ── Keyframes ── */}
        <style>{`
          @keyframes auroraMove {
            0%,100% { transform: translate(0px,0px) scale(1); }
            33%      { transform: translate(40px,-30px) scale(1.05); }
            66%      { transform: translate(-30px,20px) scale(0.95); }
          }
          @keyframes ctaGlow {
            0%,100% { box-shadow: 0 0 60px rgba(233,30,140,0.50),0 0 120px rgba(233,30,140,0.20),0 8px 32px rgba(0,0,0,0.6); }
            50%     { box-shadow: 0 0 80px rgba(233,30,140,0.75),0 0 160px rgba(233,30,140,0.35),0 8px 32px rgba(0,0,0,0.6); }
          }
          @keyframes bounceDown {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(8px); }
          }
          @keyframes fadeSlideUp {
            from { opacity:0; transform:translateY(24px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @keyframes badgePulse {
            0%,100% { opacity:1; }
            50%     { opacity:0.7; }
          }
          @media (max-width:767px) {
            .plan-card-destaque { transform: scale(1) !important; }
          }
        `}</style>

        <div style={{ background: "#080010" }}>

          {/* ══════════════════════════════════════════
              SECÇÃO 1 — HERO FULLSCREEN
          ══════════════════════════════════════════ */}
          <section
            ref={heroRef}
            className="relative flex flex-col items-center justify-center overflow-hidden"
            style={{ minHeight: "100vh" }}
          >
            {/* Aurora blobs */}
            <div style={{
              position: "absolute", top: "8%", left: "-80px",
              width: "520px", height: "520px", borderRadius: "50%",
              background: "#ec4899", opacity: 0.12, filter: "blur(120px)",
              animation: "auroraMove 25s ease-in-out infinite",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: "5%", right: "-60px",
              width: "600px", height: "600px", borderRadius: "50%",
              background: "#9333ea", opacity: 0.10, filter: "blur(120px)",
              animation: "auroraMove 30s ease-in-out infinite reverse",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", top: "45%", right: "12%",
              width: "400px", height: "400px", borderRadius: "50%",
              background: "#fbbf24", opacity: 0.06, filter: "blur(120px)",
              animation: "auroraMove 20s ease-in-out infinite 5s",
              pointerEvents: "none",
            }} />

            {/* Conteúdo centrado */}
            <div
              className="relative text-center px-4 sm:px-8"
              style={{ zIndex: 1, maxWidth: "700px", width: "100%" }}
            >
              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "6px 18px", borderRadius: "999px", marginBottom: "24px",
                background: "rgba(236,72,153,0.10)",
                border: "1px solid rgba(236,72,153,0.25)",
                color: "#ec4899", fontSize: "11px", fontWeight: 800,
                letterSpacing: "0.10em",
                animation: heroVisible ? "badgePulse 3s ease-in-out infinite, fadeSlideUp 0.5s ease both" : "none",
                opacity: heroVisible ? undefined : 0,
              }}>
                <Lock size={12} /> ACESSO RESTRITO — 18+
              </div>

              {/* Contador */}
              <p style={{
                fontSize: "14px", color: "rgba(255,255,255,0.50)",
                marginBottom: "20px",
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeSlideUp 0.5s ease 0.1s both" : "none",
              }}>
                Junta-te a{" "}
                <strong style={{ color: "rgba(255,255,255,0.85)" }}>
                  {counterVal.toLocaleString("pt-PT")}
                </strong>{" "}
                membros activos
              </p>

              {/* Título 3 linhas */}
              <h1 style={{ fontWeight: 900, lineHeight: 1.05, marginBottom: "20px" }}>
                <span style={{
                  display: "block", color: "white",
                  fontSize: "clamp(2.5rem,8vw,5.5rem)",
                  opacity: heroVisible ? 1 : 0,
                  animation: heroVisible ? "fadeSlideUp 0.5s ease 0.2s both" : "none",
                }}>
                  +1.000 fotos
                </span>
                <span style={{
                  display: "block",
                  fontSize: "clamp(2.5rem,8vw,5.5rem)",
                  background: "linear-gradient(90deg,#ec4899,#9333ea)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  opacity: heroVisible ? 1 : 0,
                  animation: heroVisible ? "fadeSlideUp 0.5s ease 0.4s both" : "none",
                }}>
                  que NUNCA viste
                </span>
                <span style={{
                  display: "block", color: "white",
                  fontSize: "clamp(2.5rem,8vw,5.5rem)",
                  opacity: heroVisible ? 1 : 0,
                  animation: heroVisible ? "fadeSlideUp 0.5s ease 0.6s both" : "none",
                }}>
                  na internet
                </span>
              </h1>

              {/* Subtítulo */}
              <p style={{
                fontSize: "14px", color: "rgba(255,255,255,0.55)",
                marginBottom: "36px", letterSpacing: "0.06em",
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeSlideUp 0.5s ease 0.6s both" : "none",
              }}>
                Conteúdo raro · Vazado · Actualizado diariamente
              </p>

              {/* CTA principal */}
              <div style={{
                marginBottom: "16px",
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeSlideUp 0.5s ease 0.7s both" : "none",
              }}>
                <button
                  onClick={() => setShowPopup(true)}
                  style={{
                    display: "block", width: "100%", maxWidth: "480px",
                    margin: "0 auto",
                    padding: "20px 40px", borderRadius: "60px",
                    background: "linear-gradient(90deg,#e91e8c,#9333ea)",
                    boxShadow: "0 0 60px rgba(233,30,140,0.50),0 0 120px rgba(233,30,140,0.20),0 8px 32px rgba(0,0,0,0.6)",
                    fontSize: "clamp(1rem,3vw,1.2rem)", fontWeight: 900,
                    color: "white", border: "none", cursor: "pointer",
                    animation: "ctaGlow 2s ease-in-out infinite",
                    transition: "transform 200ms",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  ➔ VER O QUE ESTÁ ESCONDIDO
                </button>
              </div>

              {/* Urgência */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "6px", fontSize: "12px", color: "rgba(251,191,36,0.80)",
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeSlideUp 0.5s ease 0.8s both" : "none",
              }}>
                <AlertTriangle size={13} />
                Acesso pode ser fechado a qualquer momento
              </div>
            </div>

            {/* Indicador de scroll */}
            <div style={{
              position: "absolute", bottom: "32px", left: "50%",
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "4px", color: "rgba(255,255,255,0.22)", fontSize: "11px",
              opacity: heroVisible ? 1 : 0,
              transition: "opacity 1s ease 1.2s",
            }}>
              <span>Ver planos</span>
              <div style={{ animation: "bounceDown 1.5s ease-in-out infinite" }}>
                <ChevronDown size={16} />
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECÇÃO 2 — PROVA SOCIAL
          ══════════════════════════════════════════ */}
          <section
            ref={statsRef}
            style={{
              padding: "56px 0",
              background: "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 clamp(16px,5vw,48px)" }}>

              {/* 4 stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                {[
                  { icon: <Eye size={22} />,       value: "200K+",  label: "Visualizações /mês",    color: "#ec4899" },
                  { icon: <ImageIcon size={22} />,  value: "+1.000", label: "Fotos Exclusivas",       color: "#9333ea" },
                  { icon: <span style={{ fontSize: "22px" }}>★</span>, value: "4.9/5", label: "Avaliação dos membros", color: "#fbbf24" },
                  { icon: <Shield size={22} />,     value: "100%",   label: "Privado e Seguro",       color: "#34d399" },
                ].map((stat, i) => (
                  <div key={i} style={{
                    textAlign: "center", padding: "24px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    opacity: statsVisible ? 1 : 0,
                    transform: statsVisible ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
                  }}>
                    <div style={{ color: stat.color, marginBottom: "10px", display: "flex", justifyContent: "center" }}>
                      {stat.icon}
                    </div>
                    <p style={{ fontSize: "1.9rem", fontWeight: 900, color: stat.color, marginBottom: "4px", lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", lineHeight: 1.3 }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Avatar row + member count + stars */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "14px", flexWrap: "wrap",
                opacity: statsVisible ? 1 : 0,
                transition: "opacity 0.6s ease 0.4s",
              }}>
                <div style={{ display: "flex" }}>
                  {AVATAR_GRADIENTS.map((grad, i) => (
                    <div key={i} style={{
                      width: "38px", height: "38px", borderRadius: "50%",
                      background: grad,
                      border: "2px solid #080010",
                      marginLeft: i > 0 ? "-10px" : "0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 900, color: "white",
                      zIndex: 5 - i,
                      position: "relative",
                    }}>
                      {String.fromCharCode(65 + i * 3)}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.60)" }}>
                  <strong style={{ color: "white" }}>2.847 membros activos</strong> este mês
                </p>
                <span style={{ color: "#fbbf24", fontSize: "18px", letterSpacing: "2px" }}>★★★★★</span>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECÇÃO 3 — PREVIEW DESFOCADO
          ══════════════════════════════════════════ */}
          <section ref={previewRef} style={{ padding: "80px 0" }}>
            <div style={{ maxWidth: "980px", margin: "0 auto", padding: "0 clamp(16px,5vw,48px)" }}>

              <div style={{
                textAlign: "center", marginBottom: "48px",
                opacity: previewVisible ? 1 : 0,
                transform: previewVisible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}>
                <h2 style={{
                  fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 900,
                  background: "linear-gradient(90deg,#ec4899,#9333ea)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  marginBottom: "12px",
                }}>
                  O que está escondido aqui dentro
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>
                  Apenas membros têm acesso. Eis um pequeno vislumbre...
                </p>
              </div>

              {/* Grid 6 thumbnails */}
              <div style={{ position: "relative" }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PREVIEW_THUMBS_6.map((src, i) => (
                    <div
                      key={i}
                      className="group"
                      style={{
                        position: "relative", aspectRatio: "3/4",
                        borderRadius: "16px", overflow: "hidden",
                        opacity: previewVisible ? 1 : 0,
                        transform: previewVisible ? "translateY(0)" : "translateY(20px)",
                        transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover transition-[filter] duration-400 group-hover:[filter:blur(12px)_brightness(0.45)_saturate(0.8)]"
                        style={{
                          filter: "blur(18px) brightness(0.40) saturate(0.8)",
                          transform: "scale(1.08)",
                        }}
                        onError={e => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          if (el.parentElement) el.parentElement.style.background = "linear-gradient(135deg,#1a0830,#0a0f1e)";
                        }}
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.55))",
                      }} />
                      {/* Cadeado central */}
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "6px",
                      }}>
                        <div style={{
                          width: "46px", height: "46px", borderRadius: "50%",
                          background: "rgba(236,72,153,0.22)",
                          border: "1px solid rgba(236,72,153,0.50)",
                          backdropFilter: "blur(4px)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 0 24px rgba(236,72,153,0.35)",
                        }}>
                          <Lock size={18} style={{ color: "#ec4899" }} />
                        </div>
                        <span style={{
                          fontSize: "9px", fontWeight: 900,
                          color: "rgba(255,255,255,0.60)",
                          letterSpacing: "0.18em",
                        }}>
                          BLOQUEADO
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fade inferior */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
                  background: "linear-gradient(to bottom,transparent,#080010)",
                  pointerEvents: "none",
                }} />

                {/* CTA sobre o fade */}
                <div style={{
                  position: "absolute", bottom: "28px", left: 0, right: 0,
                  textAlign: "center", zIndex: 2,
                }}>
                  <button
                    onClick={() => setShowPopup(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "clamp(14px,3vw,17px)", fontWeight: 700,
                      color: "#ec4899",
                      textShadow: "0 0 20px rgba(236,72,153,0.6)",
                    }}
                  >
                    Desbloqueia agora para ver tudo →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECÇÃO 4 — OS 3 PLANOS
          ══════════════════════════════════════════ */}
          <section ref={plansRef} style={{ padding: "80px 0" }}>
            <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 clamp(16px,5vw,48px)" }}>

              <div style={{
                textAlign: "center", marginBottom: "48px",
                opacity: plansVisible ? 1 : 0,
                transform: plansVisible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}>
                <h2 style={{
                  fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900,
                  color: "white", marginBottom: "12px",
                }}>
                  Escolhe o teu nível de acesso
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.40)" }}>
                  Cancela quando quiseres. Sem compromissos.
                </p>
              </div>

              {/* Toggle mensal/anual */}
              <div style={{
                display: "flex", justifyContent: "center", marginBottom: "44px",
                opacity: plansVisible ? 1 : 0,
                transition: "opacity 0.5s ease 0.1s",
              }}>
                <div style={{
                  display: "inline-flex", gap: "4px", padding: "4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "16px",
                }}>
                  {(["mensal","anual"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriodo(p)}
                      style={{
                        padding: "10px 28px", borderRadius: "12px",
                        fontSize: "14px", fontWeight: 700,
                        cursor: "pointer", transition: "all 200ms",
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        ...(periodo === p
                          ? {
                              background: "rgba(236,72,153,0.20)",
                              border: "1px solid rgba(236,72,153,0.30)",
                              color: "#ec4899",
                            }
                          : {
                              background: "transparent",
                              border: "1px solid transparent",
                              color: "rgba(255,255,255,0.40)",
                            }),
                      }}
                    >
                      {p === "mensal" ? "Mensal" : "Anual"}
                      {p === "anual" && (
                        <span style={{
                          fontSize: "10px", fontWeight: 900,
                          padding: "2px 7px", borderRadius: "999px",
                          background: "rgba(52,211,153,0.20)",
                          color: "#34d399",
                        }}>
                          -26%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards de planos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {PLANOS.map((plano, i) => {
                  const isDestaque = "destaque" in plano && plano.destaque;

                  const cardBg =
                    plano.id === "normal"    ? "linear-gradient(135deg,#0a1628,#0f1f3d)" :
                    plano.id === "exclusivo" ? "linear-gradient(135deg,#1a0830,#2d0a4e)" :
                                               "linear-gradient(135deg,#1a0f00,#2d1f00)";
                  const cardBorder =
                    plano.id === "normal"    ? "1px solid rgba(96,165,250,0.30)" :
                    plano.id === "exclusivo" ? "2px solid rgba(236,72,153,0.45)" :
                                               "1px solid rgba(251,191,36,0.30)";
                  const cardShadow =
                    plano.id === "exclusivo"
                      ? "0 0 50px rgba(236,72,153,0.18), 0 8px 32px rgba(0,0,0,0.5)"
                      : "0 4px 20px rgba(0,0,0,0.4)";
                  const accentColor =
                    plano.id === "normal"    ? "#60a5fa" :
                    plano.id === "exclusivo" ? "#ec4899" :
                                               "#fbbf24";
                  const badgeLabel =
                    plano.id === "normal"    ? "ACESSO BASE" :
                    plano.id === "exclusivo" ? "MAIS POPULAR" :
                                               "TOPO ABSOLUTO";
                  const btnBg =
                    plano.id === "normal"    ? "linear-gradient(90deg,#3b82f6,#1d4ed8)" :
                    plano.id === "exclusivo" ? "linear-gradient(90deg,#e91e8c,#9333ea)" :
                                               "linear-gradient(90deg,#fbbf24,#f97316)";
                  const btnLabel =
                    plano.id === "normal"    ? "Começar agora →" :
                    plano.id === "exclusivo" ? "QUERO ACESSO →" :
                                               "Aceder ao raro →";

                  return (
                    <div
                      key={plano.id}
                      className={isDestaque ? "plan-card-destaque" : ""}
                      style={{
                        position: "relative",
                        padding: "28px 24px",
                        borderRadius: "20px",
                        background: cardBg,
                        border: cardBorder,
                        boxShadow: cardShadow,
                        transform: isDestaque ? "scale(1.05)" : "scale(1)",
                        opacity: plansVisible ? 1 : 0,
                        transition: `opacity 0.5s ease ${i * 0.1}s`,
                      }}
                    >
                      {/* Badge "MAIS POPULAR" */}
                      {isDestaque && (
                        <div style={{
                          position: "absolute", top: "-15px", left: "50%",
                          transform: "translateX(-50%)",
                          padding: "4px 18px", borderRadius: "999px",
                          fontSize: "11px", fontWeight: 900,
                          background: "linear-gradient(90deg,#ec4899,#9333ea)",
                          color: "white", whiteSpace: "nowrap",
                          boxShadow: "0 0 14px rgba(236,72,153,0.40)",
                        }}>
                          MAIS POPULAR
                        </div>
                      )}

                      {/* Ícone + badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                        <div style={{
                          width: "50px", height: "50px", borderRadius: "14px",
                          background: btnBg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", flexShrink: 0,
                          boxShadow: `0 0 16px ${accentColor}40`,
                        }}>
                          {plano.icon}
                        </div>
                        <span style={{
                          fontSize: "10px", fontWeight: 900, letterSpacing: "0.10em",
                          padding: "3px 10px", borderRadius: "999px",
                          background: `${accentColor}18`,
                          border: `1px solid ${accentColor}35`,
                          color: accentColor,
                        }}>
                          {badgeLabel}
                        </span>
                      </div>

                      {/* Título */}
                      <h3 style={{
                        fontSize: "17px", fontWeight: 900,
                        color: accentColor === "#ec4899" ? "#f9a8d4" :
                               accentColor === "#60a5fa" ? "#93c5fd" : "#fde68a",
                        marginBottom: "10px",
                      }}>
                        {plano.label}
                      </h3>

                      {/* Preço */}
                      <div style={{ marginBottom: "22px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span style={{ fontSize: "2.6rem", fontWeight: 900, color: "white", lineHeight: 1 }}>
                            {periodo === "mensal" ? plano.mensal : plano.anual}
                          </span>
                          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
                            /{periodo === "mensal" ? "mês" : "ano"}
                          </span>
                        </div>
                        {periodo === "anual" && (
                          <div style={{
                            display: "inline-block", marginTop: "6px",
                            padding: "3px 10px", borderRadius: "999px",
                            background: "rgba(52,211,153,0.15)",
                            border: "1px solid rgba(52,211,153,0.25)",
                            fontSize: "11px", fontWeight: 700, color: "#34d399",
                          }}>
                            Poupas 2 meses
                          </div>
                        )}
                      </div>

                      {/* Benefícios */}
                      <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {plano.beneficios.map((b: string, bi: number) => (
                          <div key={bi} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "18px", height: "18px", borderRadius: "50%",
                              background: `${accentColor}18`,
                              border: `1px solid ${accentColor}35`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <Check size={10} style={{ color: accentColor }} />
                            </div>
                            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.72)" }}>
                              {b}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Botão CTA */}
                      <button
                        onClick={() => navigate(`/app/checkout?plano=${plano.id}&periodo=${periodo}`)}
                        style={{
                          width: "100%", padding: "14px", borderRadius: "12px",
                          fontSize: "14px", fontWeight: 900, color: "white",
                          border: "none", cursor: "pointer",
                          background: btnBg,
                          boxShadow: plano.id === "exclusivo"
                            ? "0 0 24px rgba(236,72,153,0.35), 0 4px 16px rgba(0,0,0,0.4)"
                            : "0 4px 16px rgba(0,0,0,0.3)",
                          animation: plano.id === "exclusivo" ? "ctaGlow 2s ease-in-out infinite" : "none",
                          transition: "transform 200ms",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                      >
                        {btnLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECÇÃO 5 — GARANTIAS E SEGURANÇA
          ══════════════════════════════════════════ */}
          <section ref={guaranteesRef} style={{ padding: "72px 0" }}>
            <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 clamp(16px,5vw,48px)" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    icon: <Lock size={26} />, color: "#34d399",
                    title: "Pagamento Seguro",
                    body: "Processado pela Stripe com encriptação SSL. Os teus dados financeiros nunca são armazenados.",
                  },
                  {
                    icon: <X size={26} />, color: "#ec4899",
                    title: "Cancela Quando Quiseres",
                    body: "Sem contratos. Sem penalizações. Cancela com um clique a qualquer momento.",
                  },
                  {
                    icon: <Eye size={26} />, color: "#9333ea",
                    title: "100% Privado",
                    body: "Acesso discreto. Sem referências visíveis em extractos bancários.",
                  },
                ].map((card, i) => (
                  <div key={i} style={{
                    padding: "28px 24px", borderRadius: "16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    opacity: guaranteesVisible ? 1 : 0,
                    transform: guaranteesVisible ? "translateY(0)" : "translateY(18px)",
                    transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
                  }}>
                    <div style={{ color: card.color, marginBottom: "16px" }}>{card.icon}</div>
                    <h3 style={{ fontSize: "15px", fontWeight: 900, color: "white", marginBottom: "8px" }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECÇÃO 6 — CTA FINAL
          ══════════════════════════════════════════ */}
          <section
            ref={ctaFinalRef}
            style={{
              padding: "100px 0 120px",
              background: "radial-gradient(ellipse at center, rgba(236,72,153,0.09) 0%, transparent 68%)",
            }}
          >
            <div style={{
              maxWidth: "680px", margin: "0 auto",
              padding: "0 clamp(16px,5vw,48px)",
              textAlign: "center",
            }}>
              <h2 style={{
                fontSize: "clamp(1.9rem,5vw,3.2rem)", fontWeight: 900,
                color: "white", marginBottom: "16px",
                opacity: ctaVisible ? 1 : 0,
                transform: ctaVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}>
                Ainda tens dúvidas?
              </h2>
              <p style={{
                fontSize: "16px", color: "rgba(255,255,255,0.55)",
                marginBottom: "44px", lineHeight: 1.65,
                opacity: ctaVisible ? 1 : 0,
                transform: ctaVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
              }}>
                Mais de 2.847 membros já estão lá dentro.<br />
                O que estás à espera?
              </p>

              <button
                onClick={() => setShowPopup(true)}
                style={{
                  display: "block", width: "100%", maxWidth: "520px",
                  margin: "0 auto 20px",
                  padding: "20px 40px", borderRadius: "60px",
                  background: "linear-gradient(90deg,#e91e8c,#9333ea)",
                  boxShadow: "0 0 60px rgba(233,30,140,0.50),0 0 120px rgba(233,30,140,0.20),0 8px 32px rgba(0,0,0,0.6)",
                  fontSize: "clamp(0.95rem,2.5vw,1.1rem)", fontWeight: 900,
                  color: "white", border: "none", cursor: "pointer",
                  animation: "ctaGlow 2s ease-in-out infinite",
                  opacity: ctaVisible ? 1 : 0,
                  transition: "opacity 0.5s ease 0.2s, transform 200ms",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                ➔ ENTRAR AGORA — A PARTIR DE 4,49€/MÊS
              </button>

              <p style={{
                fontSize: "11px", color: "rgba(255,255,255,0.25)",
                opacity: ctaVisible ? 1 : 0,
                transition: "opacity 0.5s ease 0.3s",
              }}>
                Acesso imediato · Cancela quando quiseres · Pagamento seguro via Stripe
              </p>
            </div>
          </section>

        </div>

        {showPopup && <SubscribePopup onClose={() => setShowPopup(false)} />}
      </LayoutAuthenticated>
    );
  }

  // ════════════════════════════════════════════════════
  // ✅ PREMIUM ACTIVO — Galeria elevada
  // ════════════════════════════════════════════════════
  return (
    <LayoutAuthenticated>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header premium elevado ────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg,#0f0218 0%,#200a40 50%,#0a0f1e 100%)",
            border: "1px solid rgba(236,72,153,0.15)",
          }}
        >
          <div className="absolute pointer-events-none" style={{ top: "-40px", right: "-20px", width: "300px", height: "300px", background: "radial-gradient(circle,rgba(236,72,153,0.14) 0%,transparent 70%)", filter: "blur(45px)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: "-20px", left: "30%", width: "250px", height: "250px", background: "radial-gradient(circle,rgba(147,51,234,0.09) 0%,transparent 70%)", filter: "blur(35px)" }} />

          <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div
                className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.30)", animation: "badgePulse 3s ease-in-out infinite" }}
              >
                <Crown size={11} style={{ color: "#ec4899" }} />
                <span className="text-[11px] font-black" style={{ color: "#ec4899", letterSpacing: "0.08em" }}>
                  MEMBRO PREMIUM
                </span>
                {subStatus === "trial" && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(251,191,36,0.22)", color: "#fbbf24" }}>
                    TRIAL
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white">
                Galeria{" "}
                <span style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Exclusiva
                </span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>
                Conteúdo premium actualizado regularmente
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {[
                { val: String(packs.length),        label: "Packs", col: "#ec4899" },
                { val: totalFotos.toLocaleString(),  label: "Fotos", col: "#9333ea" },
                { val: String(novosCount),           label: "Novos", col: "#34d399" },
              ].map(({ val, label, col }) => (
                <div key={label} className="text-center px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xl font-black" style={{ color: col }}>{val}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Secção Destaques com auto-scroll ─────────────── */}
        {packs.filter(p => p.destaque).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame size={13} style={{ color: "#fbbf24" }} />
              <p className="text-[11px] font-black uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                Em Destaque
              </p>
            </div>
            <div
              ref={featuredScrollRef}
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
              style={{ cursor: "grab" }}
            >
              {packs.filter(p => p.destaque).map(pack => (
                <FeaturedPackCard key={pack.id} pack={pack} />
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.25)" }} />
            <input type="text" placeholder="Pesquisar packs..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm transition-all focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                fontSize: "0.875rem",
              }} />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl overflow-x-auto flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["todos","Normal","Exclusivo","Raro"] as FilterKey[]).map(f => {
              const cnt = f === "todos" ? packs.length : packs.filter(p => p.etiqueta === f).length;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
                  style={filter === f
                    ? f === "todos"     ? { background: "rgba(255,255,255,0.10)", color: "#fff" }
                    : f === "Normal"    ? { background: "rgba(59,130,246,0.20)", border: "1px solid rgba(59,130,246,0.30)", color: "#60a5fa" }
                    : f === "Exclusivo" ? { background: "rgba(236,72,153,0.20)", border: "1px solid rgba(236,72,153,0.30)", color: "#ec4899" }
                    : { background: "rgba(251,191,36,0.20)", border: "1px solid rgba(251,191,36,0.30)", color: "#fbbf24" }
                    : { color: "rgba(255,255,255,0.35)" }}>
                  {f === "todos" ? "Todos" : f}
                  <span className="text-[9px] opacity-60">({cnt})</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {([
              { key: "recentes",  icon: <Clock size={12} />,      label: "Recentes" },
              { key: "populares", icon: <TrendingUp size={12} />, label: "Populares" },
              { key: "destaque",  icon: <Sparkles size={12} />,   label: "Destaque" },
            ] as { key: SortKey; icon: React.ReactNode; label: string }[]).map(s => (
              <button key={s.key} onClick={() => setSort(s.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={sort === s.key
                  ? { background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.25)", color: "#ec4899" }
                  : { color: "rgba(255,255,255,0.35)" }}>
                {s.icon} <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid packs */}
        {packsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <div className="bg-white/5" style={{ aspectRatio: "2/3" }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="h-2.5 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.05)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPacks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
            <Grid3x3 size={40} style={{ color: "rgba(255,255,255,0.12)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
              {search ? `Sem packs para "${search}"` : "Sem packs disponíveis nesta categoria."}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs transition-colors" style={{ color: "#ec4899" }}>
                Limpar pesquisa
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-center pt-2">
          <button onClick={() => setShowPopup(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>
            <SlidersHorizontal size={13} /> Gerir subscrição
          </button>
        </div>
      </div>

      {showPopup && <SubscribePopup onClose={() => setShowPopup(false)} />}

      <style>{`
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0   0   rgba(236,72,153,0);    }
          50%       { box-shadow: 0 0 12px 2px rgba(236,72,153,0.20); }
        }
      `}</style>
    </LayoutAuthenticated>
  );
}
