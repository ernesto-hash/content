// client/pages/Checkout.tsx
// Tela de pré-checkout — aparece ANTES do Stripe
// Recebe: /app/checkout?plano=exclusivo&periodo=mensal

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import {
  Crown, ImageIcon, Gem, Shield, Lock, Check,
  Zap, Star, ArrowRight, Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────
// Planos (espelha GaleriaAuthenticated)
// ─────────────────────────────────────────────

interface PlanoDef {
  id:         string;
  label:      string;
  Icon:       LucideIcon;
  cor:        string;
  corText:    string;
  corBorder:  string;
  corBg:      string;
  corHex:     string;
  mensal:     string;
  anual:      string;
  stripeIds:  { mensal: string; anual: string };
  beneficios: string[];
}

const CHECKOUT_PLANOS: PlanoDef[] = [
  {
    id: "normal", label: "Acesso Normal", Icon: ImageIcon,
    cor: "from-blue-500 to-blue-700", corText: "text-blue-400",
    corBorder: "border-blue-500/50", corBg: "bg-blue-500/10", corHex: "#60a5fa",
    mensal: "4,49€", anual: "40€",
    stripeIds: { mensal: "price_1TH1C3DszTPKV7EvnXKm5As8", anual: "price_1TH1ClDszTPKV7Evt6NJEOlz" },
    beneficios: ["Acesso a packs normais", "Novos packs mensais", "Visualização em HD", "Cancela quando quiseres"],
  },
  {
    id: "exclusivo", label: "Conteúdo Exclusivo", Icon: Crown,
    cor: "from-pink-500 to-purple-600", corText: "text-pink-400",
    corBorder: "border-pink-500/50", corBg: "bg-pink-500/10", corHex: "#ec4899",
    mensal: "6,65€", anual: "60€",
    stripeIds: { mensal: "price_1TH1EPDszTPKV7EvW1A8d7lO", anual: "price_1TH1EPDszTPKV7EvunbX6zsA" },
    beneficios: ["Tudo do Pack Normal", "Conteúdo exclusivo premium", "Packs adicionados semanalmente", "Download em alta resolução"],
  },
  {
    id: "raro", label: "Conteúdo Raro", Icon: Gem,
    cor: "from-amber-400 to-orange-500", corText: "text-amber-400",
    corBorder: "border-amber-400/50", corBg: "bg-amber-400/10", corHex: "#fbbf24",
    mensal: "9€", anual: "75€",
    stripeIds: { mensal: "price_1TH1FGDszTPKV7EvwBtzv0YS", anual: "price_1TH1FGDszTPKV7EvIiTagCyU" },
    beneficios: ["Tudo dos planos anteriores", "Conteúdo raro e exclusivo", "Acesso antecipado a novos packs", "Suporte prioritário"],
  },
];

// Thumbnails desfocadas (mesmas do GaleriaAuthenticated)
const PREVIEW_THUMBS = [
  "/assets/galeria/preview-1.jpg",
  "/assets/galeria/preview-2.jpg",
  "/assets/galeria/preview-3.jpg",
  "/assets/galeria/side-left-1.jpg",
  "/assets/galeria/side-right-1.jpg",
  "/assets/galeria/side-left-2.jpg",
];

// Avatares placeholder para social proof
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#ec4899,#9333ea)",
  "linear-gradient(135deg,#9333ea,#3b82f6)",
  "linear-gradient(135deg,#fbbf24,#ec4899)",
  "linear-gradient(135deg,#34d399,#3b82f6)",
  "linear-gradient(135deg,#f472b6,#a855f7)",
];

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const planoParam  = searchParams.get("plano")   ?? "exclusivo";
  const periodoParam = (searchParams.get("periodo") ?? "mensal") as "mensal" | "anual";

  const [periodo, setPeriodo] = useState<"mensal" | "anual">(periodoParam);
  const [animIn,  setAnimIn]  = useState(false);

  const plano = CHECKOUT_PLANOS.find(p => p.id === planoParam) ?? CHECKOUT_PLANOS[1];

  useEffect(() => {
    if (!CHECKOUT_PLANOS.find(p => p.id === planoParam)) {
      navigate("/app/galeria", { replace: true });
    }
    const t = setTimeout(() => setAnimIn(true), 80);
    return () => clearTimeout(t);
  }, [planoParam, navigate]);

  const handlePay = () => {
    navigate(`/app/checkout/pagamento?plano=${plano.id}&periodo=${periodo}`);
  };

  const { Icon: PlanIcon } = plano;

  return (
    <LayoutAuthenticated>
      <div className="min-h-screen py-8 px-4" style={{ background: "#080010" }}>

        {/* ── Bokeh background ──────────────────────────────────── */}
        <div className="fixed pointer-events-none" style={{ top: "15%", left: "3%", width: "450px", height: "450px", background: "radial-gradient(circle,rgba(236,72,153,0.07) 0%,transparent 70%)", filter: "blur(70px)", zIndex: 0 }} />
        <div className="fixed pointer-events-none" style={{ bottom: "15%", right: "3%", width: "550px", height: "550px", background: "radial-gradient(circle,rgba(147,51,234,0.06) 0%,transparent 70%)", filter: "blur(90px)", zIndex: 0 }} />

        <div className="relative max-w-5xl mx-auto" style={{ zIndex: 1 }}>

          {/* ── Header ────────────────────────────────────────────── */}
          <div
            className="text-center mb-8"
            style={{
              opacity:    animIn ? 1 : 0,
              transform:  animIn ? "translateY(0)" : "translateY(-14px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            <button
              onClick={() => navigate("/app/galeria")}
              className="text-sm mb-3 inline-block transition-colors"
              style={{ color: "rgba(255,255,255,0.30)" }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = "#ec4899")}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.30)")}
            >
              ← Voltar aos planos
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Estás a um passo do{" "}
              <span style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                acesso total
              </span>
            </h1>
          </div>

          {/* ── Grid 2 colunas ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* ════════════════════════════════════════════════════
                COLUNA ESQUERDA — O que vais desbloquear
            ════════════════════════════════════════════════════ */}
            <div
              className="space-y-5"
              style={{
                opacity:    animIn ? 1 : 0,
                transform:  animIn ? "translateX(0)" : "translateX(-20px)",
                transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
              }}
            >
              {/* Título coluna */}
              <h2 className="text-lg font-black text-white">O que vais desbloquear</h2>

              {/* Grid de thumbnails desfocadas */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="grid grid-cols-3 gap-0.5">
                  {PREVIEW_THUMBS.map((src, i) => (
                    <div key={i} className="relative overflow-hidden group" style={{ aspectRatio: "3/4" }}>
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover transition-all duration-600 group-hover:blur-0"
                        style={{ filter: "blur(9px) brightness(0.45)", transform: "scale(1.1)" }}
                        onError={e => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          el.parentElement!.style.background = "linear-gradient(135deg,#1a0830,#0a0f1e)";
                        }}
                      />
                      {/* Overlay de cadeado */}
                      <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{
                            background:    "rgba(236,72,153,0.22)",
                            border:        "1px solid rgba(236,72,153,0.50)",
                            backdropFilter:"blur(4px)",
                          }}
                        >
                          <Lock size={13} style={{ color: "#ec4899" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="p-4 text-center"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="text-2xl font-black"
                    style={{
                      background:           "linear-gradient(90deg,#ec4899,#fbbf24)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor:  "transparent",
                    }}
                  >
                    +1.000 fotos exclusivas
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Aguardam o teu acesso agora
                  </p>
                </div>
              </div>

              {/* Benefícios do plano com cascade */}
              <div className="space-y-2">
                {plano.beneficios.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border:     "1px solid rgba(255,255,255,0.07)",
                      opacity:    animIn ? 1 : 0,
                      transform:  animIn ? "translateX(0)" : "translateX(-14px)",
                      transition: `opacity 0.5s ease ${0.2 + i * 0.09}s, transform 0.5s ease ${0.2 + i * 0.09}s`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${plano.corHex}22`,
                        border:     `1px solid ${plano.corHex}55`,
                      }}
                    >
                      <Check size={10} style={{ color: plano.corHex }} />
                    </div>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{b}</span>
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex -space-x-2 flex-shrink-0">
                  {AVATAR_GRADIENTS.map((grad, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: grad, borderColor: "#080010" }}
                    >
                      {String.fromCharCode(65 + i * 3)}
                    </div>
                  ))}
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>
                  <strong className="text-white">2.847 membros activos</strong> já têm acesso
                </p>
              </div>

              {/* Urgência */}
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
              >
                <Clock size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "rgba(251,191,36,0.80)" }}>
                  Acesso pode ser limitado a qualquer momento
                </p>
              </div>

              {/* Segurança */}
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.14)" }}
              >
                <Shield size={13} style={{ color: "#34d399", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "rgba(52,211,153,0.75)" }}>
                  Pagamento 100% seguro via Stripe · Cancela quando quiseres
                </p>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════
                COLUNA DIREITA — Resumo do pedido
            ════════════════════════════════════════════════════ */}
            <div
              style={{
                opacity:    animIn ? 1 : 0,
                transform:  animIn ? "translateX(0)" : "translateX(20px)",
                transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
              }}
            >
              <h2 className="text-lg font-black text-white mb-4">Resumo do pedido</h2>

              {/* Card com borda animada */}
              <div
                className="rounded-2xl p-[1px]"
                style={{
                  background:     "linear-gradient(135deg,#ec4899 0%,#9333ea 50%,#fbbf24 80%,#ec4899 100%)",
                  backgroundSize: "300% 300%",
                  animation:      "gradientBorder 4s ease infinite",
                }}
              >
                <div
                  className="rounded-[14px] p-6 space-y-5"
                  style={{ background: "linear-gradient(135deg,#0f0218 0%,#1a0830 100%)" }}
                >
                  {/* Plano seleccionado */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plano.cor} flex items-center justify-center flex-shrink-0`}
                    >
                      <PlanIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <p className={`font-black text-base ${plano.corText}`}>{plano.label}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                        Subscrição {periodo}
                      </p>
                    </div>
                  </div>

                  {/* Toggle mensal/anual */}
                  <div
                    className="flex items-center gap-1 p-1 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    {(["mensal", "anual"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPeriodo(p)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                        style={
                          periodo === p
                            ? { background: "rgba(236,72,153,0.20)", border: "1px solid rgba(236,72,153,0.30)", color: "#ec4899" }
                            : { color: "rgba(255,255,255,0.40)" }
                        }
                      >
                        {p === "mensal" ? "Mensal" : "Anual"}
                        {p === "anual" && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(52,211,153,0.20)", color: "#34d399" }}
                          >
                            -26%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Breakdown de preço */}
                  <div
                    className="space-y-3 py-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
                        Plano {plano.label}
                      </span>
                      <span className="font-bold text-white">
                        {periodo === "mensal" ? plano.mensal : plano.anual}
                      </span>
                    </div>
                    {periodo === "mensal" && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Período de teste
                        </span>
                        <span className="text-xs font-black" style={{ color: "#34d399" }}>
                          3 dias grátis
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} style={{ color: "#9333ea" }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Acesso imediato
                        </span>
                      </div>
                      <Star size={11} style={{ color: "#fbbf24" }} />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.50)" }}>
                      Total hoje
                    </span>
                    <div className="text-right">
                      {periodo === "mensal" ? (
                        <>
                          <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                            Depois de 3 dias grátis
                          </div>
                          <div className="text-3xl font-black text-white">{plano.mensal}</div>
                        </>
                      ) : (
                        <div className="text-3xl font-black text-white">{plano.anual}</div>
                      )}
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>
                        /{periodo === "mensal" ? "mês" : "ano"}
                      </div>
                    </div>
                  </div>

                  {periodo === "mensal" && (
                    <p
                      className="text-center text-xs"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      3 dias grátis, depois {plano.mensal}/mês · Cancela quando quiseres
                    </p>
                  )}

                  {/* Botão CTA */}
                  <button
                    onClick={handlePay}
                    className="relative w-full py-4 rounded-xl font-black text-white text-base transition-all overflow-hidden"
                    style={{
                      background: "linear-gradient(90deg,#e91e8c 0%,#9333ea 100%)",
                      boxShadow:  "0 0 30px rgba(233,30,140,0.35), 0 6px 24px rgba(0,0,0,0.4)",
                      animation:  "ctaGlow 2s ease-in-out infinite",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      CONFIRMAR E PAGAR
                      <ArrowRight size={18} />
                    </span>
                  </button>

                  {/* Logos de segurança */}
                  <div
                    className="flex items-center justify-center gap-3 text-[11px]"
                    style={{ color: "rgba(255,255,255,0.22)" }}
                  >
                    <Lock size={10} />
                    <span>Stripe Secure</span>
                    <span>·</span>
                    <span className="font-bold tracking-widest">VISA</span>
                    <span>·</span>
                    <span className="font-bold tracking-widest">MASTERCARD</span>
                  </div>

                  {/* Link cancelar */}
                  <div className="text-center">
                    <button
                      onClick={() => navigate("/app/galeria")}
                      className="text-xs transition-colors"
                      style={{ color: "rgba(255,255,255,0.22)" }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.22)")}
                    >
                      Cancelar — voltar aos planos
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Keyframes ──────────────────────────────────────────── */}
        <style>{`
          @keyframes gradientBorder {
            0%   { background-position: 0%   50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0%   50%; }
          }
          @keyframes ctaGlow {
            0%, 100% { box-shadow: 0 0 30px rgba(233,30,140,0.35), 0 6px 24px rgba(0,0,0,0.4); }
            50%       { box-shadow: 0 0 55px rgba(233,30,140,0.62), 0 6px 24px rgba(0,0,0,0.4); }
          }
        `}</style>
      </div>
    </LayoutAuthenticated>
  );
}
