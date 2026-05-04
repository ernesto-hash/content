// client/pages/CheckoutPagamento.tsx
// Página de inserção de cartão com Stripe Elements
// Rota: /app/checkout/pagamento?plano=X&periodo=Y

import { useEffect, useState, FormEvent, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Crown, ImageIcon, Gem, Check, Lock, Shield,
  Loader2, AlertCircle, ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary:         "#ec4899",
    colorBackground:      "#0f0218",
    colorText:            "#ffffff",
    colorDanger:          "#f87171",
    fontFamily:           "system-ui, sans-serif",
    spacingUnit:          "4px",
    borderRadius:         "10px",
    colorTextSecondary:   "rgba(255,255,255,0.50)",
    colorTextPlaceholder: "rgba(255,255,255,0.25)",
  },
  rules: {
    ".Input": {
      backgroundColor: "rgba(255,255,255,0.05)",
      border:          "1px solid rgba(255,255,255,0.12)",
      color:           "#ffffff",
    },
    ".Input:focus": {
      border:    "1px solid rgba(236,72,153,0.50)",
      boxShadow: "0 0 0 3px rgba(236,72,153,0.15)",
    },
    ".Label": { color: "rgba(255,255,255,0.55)", fontSize: "12px" },
    ".Tab":            { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" },
    ".Tab--selected":  { backgroundColor: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.35)" },
  },
};

// ─────────────────────────────────────────────
// Planos (espelha Checkout.tsx e GaleriaAuthenticated.tsx)
// ─────────────────────────────────────────────

interface PlanoDef {
  id:         string;
  label:      string;
  Icon:       LucideIcon;
  cor:        string;
  corText:    string;
  corHex:     string;
  mensal:     string;
  anual:      string;
  stripeIds:  { mensal: string; anual: string };
  beneficios: string[];
}

const PLANOS: PlanoDef[] = [
  {
    id: "normal", label: "Acesso Normal", Icon: ImageIcon,
    cor: "from-blue-500 to-blue-700", corText: "text-blue-400", corHex: "#60a5fa",
    mensal: "4,49€", anual: "40€",
    stripeIds: { mensal: "price_1TH1C3DszTPKV7EvnXKm5As8", anual: "price_1TH1ClDszTPKV7Evt6NJEOlz" },
    beneficios: ["Acesso a packs normais", "Novos packs mensais", "Visualização em HD", "Cancela quando quiseres"],
  },
  {
    id: "exclusivo", label: "Conteúdo Exclusivo", Icon: Crown,
    cor: "from-pink-500 to-purple-600", corText: "text-pink-400", corHex: "#ec4899",
    mensal: "6,65€", anual: "60€",
    stripeIds: { mensal: "price_1TH1EPDszTPKV7EvW1A8d7lO", anual: "price_1TH1EPDszTPKV7EvunbX6zsA" },
    beneficios: ["Tudo do Pack Normal", "Conteúdo exclusivo premium", "Packs adicionados semanalmente", "Download em alta resolução"],
  },
  {
    id: "raro", label: "Conteúdo Raro", Icon: Gem,
    cor: "from-amber-400 to-orange-500", corText: "text-amber-400", corHex: "#fbbf24",
    mensal: "9€", anual: "75€",
    stripeIds: { mensal: "price_1TH1FGDszTPKV7EvwBtzv0YS", anual: "price_1TH1FGDszTPKV7EvIiTagCyU" },
    beneficios: ["Tudo dos planos anteriores", "Conteúdo raro e exclusivo", "Acesso antecipado a novos packs", "Suporte prioritário"],
  },
];

// ─────────────────────────────────────────────
// Formulário de pagamento (renderizado dentro de <Elements>)
// ─────────────────────────────────────────────
function PaymentForm({
  plano,
  periodo,
  intentType,
}: {
  plano:      PlanoDef;
  periodo:    "mensal" | "anual";
  intentType: "payment" | "setup";
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [cardName, setCardName] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);

    const returnUrl = `${window.location.origin}/app/checkout/sucesso`;

    try {
      let result;
      if (intentType === "setup") {
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url:           returnUrl,
            payment_method_data:  { billing_details: { name: cardName } },
          },
          redirect: "if_required",
        });
      } else {
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url:           returnUrl,
            payment_method_data:  { billing_details: { name: cardName } },
          },
          redirect: "if_required",
        });
      }

      if (result.error) {
        setError(result.error.message ?? "Erro no pagamento.");
      } else {
        navigate("/app/checkout/sucesso", { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const { Icon } = plano;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resumo compacto do plano */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plano.cor} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${plano.corText}`}>{plano.label}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {periodo === "mensal"
              ? `3 dias grátis, depois ${plano.mensal}/mês`
              : `${plano.anual}/ano`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-black text-white text-sm">
            {periodo === "mensal" ? "0,00€" : plano.anual}
          </p>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>hoje</p>
        </div>
      </div>

      {/* Nome no cartão */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
          Nome no cartão
        </label>
        <input
          ref={inputRef}
          type="text"
          placeholder="Como aparece no cartão"
          value={cardName}
          onChange={e => setCardName(e.target.value)}
          className="w-full px-3.5 py-3 rounded-[10px] text-sm text-white outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border:     "1px solid rgba(255,255,255,0.12)",
            caretColor: "#ec4899",
          }}
          onFocus={e => {
            e.target.style.border    = "1px solid rgba(236,72,153,0.50)";
            e.target.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.15)";
          }}
          onBlur={e => {
            e.target.style.border    = "1px solid rgba(255,255,255,0.12)";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Stripe PaymentElement */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
          Dados do cartão
        </label>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {/* Erro inline */}
      {error && (
        <div
          className="flex items-start gap-2.5 px-3 py-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
          <p className="text-xs" style={{ color: "#fca5a5" }}>{error}</p>
        </div>
      )}

      {/* CTA */}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-4 rounded-xl font-black text-white text-base transition-all disabled:opacity-60"
        style={{
          background: "linear-gradient(90deg,#e91e8c 0%,#9333ea 100%)",
          boxShadow:  "0 0 30px rgba(233,30,140,0.35), 0 6px 24px rgba(0,0,0,0.4)",
          animation:  loading ? "none" : "ctaGlow 2s ease-in-out infinite",
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" /> A processar...
          </span>
        ) : (
          <span>
            {periodo === "mensal" ? "ACTIVAR 3 DIAS GRÁTIS →" : "PAGAR E ACTIVAR →"}
          </span>
        )}
      </button>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
        <Lock size={10} />
        <span>Stripe Secure · SSL</span>
        <span>·</span>
        <span className="font-bold tracking-widest">VISA</span>
        <span>·</span>
        <span className="font-bold tracking-widest">MASTERCARD</span>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function CheckoutPagamento() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const planoParam  = searchParams.get("plano")    ?? "exclusivo";
  const periodoParam = (searchParams.get("periodo") ?? "mensal") as "mensal" | "anual";

  const plano = PLANOS.find(p => p.id === planoParam) ?? PLANOS[1];

  const [clientSecret,   setClientSecret]   = useState<string | null>(null);
  const [intentType,     setIntentType]     = useState<"payment" | "setup">("payment");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [fetchError,     setFetchError]     = useState<string | null>(null);
  const [animIn,         setAnimIn]         = useState(false);

  useEffect(() => {
    if (!PLANOS.find(p => p.id === planoParam)) {
      navigate("/app/galeria", { replace: true });
    }
    const t = setTimeout(() => setAnimIn(true), 80);
    return () => clearTimeout(t);
  }, [planoParam, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) { navigate("/login"); return; }

        const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL    as string;
        const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        const priceId      = plano.stripeIds[periodoParam];

        const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey":        supabaseAnon,
          },
          body: JSON.stringify({ priceId }),
        });

        let data: Record<string, unknown> = {};
        try { data = await res.json(); } catch { /* empty body */ }

        if (cancelled) return;

        if (!res.ok) {
          throw new Error((data?.error as string) ?? `HTTP ${res.status}`);
        }

        setClientSecret(data.clientSecret as string);
        setIntentType((data.intentType as "payment" | "setup") ?? "payment");
        setSubscriptionId((data.subscriptionId as string) ?? "");
      } catch (err: unknown) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Erro ao iniciar checkout.");
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { Icon } = plano;

  return (
    <LayoutAuthenticated>
      <div className="min-h-screen py-8 px-4" style={{ background: "#080010" }}>

        {/* Bokeh */}
        <div className="fixed pointer-events-none" style={{ top: "15%", left: "3%", width: "450px", height: "450px", background: "radial-gradient(circle,rgba(236,72,153,0.07) 0%,transparent 70%)", filter: "blur(70px)", zIndex: 0 }} />
        <div className="fixed pointer-events-none" style={{ bottom: "15%", right: "3%", width: "550px", height: "550px", background: "radial-gradient(circle,rgba(147,51,234,0.06) 0%,transparent 70%)", filter: "blur(90px)", zIndex: 0 }} />

        <div className="relative max-w-5xl mx-auto" style={{ zIndex: 1 }}>

          {/* Header */}
          <div
            className="text-center mb-8"
            style={{
              opacity:    animIn ? 1 : 0,
              transform:  animIn ? "translateY(0)" : "translateY(-14px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            <button
              onClick={() => navigate(-1)}
              className="text-sm mb-3 inline-flex items-center gap-1.5 transition-colors"
              style={{ color: "rgba(255,255,255,0.30)" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#ec4899")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)")}
            >
              <ArrowLeft size={13} /> Voltar
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Introduz os dados do{" "}
              <span style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                cartão
              </span>
            </h1>
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            style={{
              opacity:    animIn ? 1 : 0,
              transform:  animIn ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >

            {/* ── Coluna esquerda — Resumo do plano ────────────────────────── */}
            <div className="space-y-5">
              <h2 className="text-lg font-black text-white">O teu plano</h2>

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
                  className="rounded-[14px] p-6 space-y-4"
                  style={{ background: "linear-gradient(135deg,#0f0218 0%,#1a0830 100%)" }}
                >
                  {/* Ícone + nome do plano */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plano.cor} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <div>
                      <p className={`font-black text-base ${plano.corText}`}>{plano.label}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Subscrição {periodoParam}
                      </p>
                    </div>
                  </div>

                  {/* Preço */}
                  <div
                    className="py-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-end justify-between">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Total hoje</span>
                      <div className="text-right">
                        {periodoParam === "mensal" ? (
                          <>
                            <p className="text-3xl font-black text-white">0,00€</p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                              3 dias grátis, depois {plano.mensal}/mês
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-3xl font-black text-white">{plano.anual}</p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>/ano</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-2">
                    {plano.beneficios.map((b, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${plano.corHex}22`, border: `1px solid ${plano.corHex}55` }}
                        >
                          <Check size={9} style={{ color: plano.corHex }} />
                        </div>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.70)" }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.14)" }}
              >
                <Shield size={13} style={{ color: "#34d399", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "rgba(52,211,153,0.75)" }}>
                  Pagamento 100% seguro via Stripe · Cancela quando quiseres
                </p>
              </div>
            </div>

            {/* ── Coluna direita — Stripe Elements ─────────────────────────── */}
            <div>
              <h2 className="text-lg font-black text-white mb-4">Dados de pagamento</h2>

              <div
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border:     "1px solid rgba(255,255,255,0.09)",
                }}
              >
                {fetchError ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <AlertCircle size={32} style={{ color: "#f87171" }} />
                    <p className="text-sm" style={{ color: "#fca5a5" }}>{fetchError}</p>
                    <button
                      onClick={() => navigate(`/app/checkout?plano=${plano.id}&periodo=${periodoParam}`)}
                      className="text-xs px-4 py-2 rounded-lg transition-colors"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.50)" }}
                    >
                      ← Voltar ao resumo
                    </button>
                  </div>
                ) : !clientSecret ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <Loader2 size={28} className="animate-spin" style={{ color: "#ec4899" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                      A preparar checkout seguro...
                    </p>
                  </div>
                ) : (
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
                  >
                    <PaymentForm
                      plano={plano}
                      periodo={periodoParam}
                      intentType={intentType}
                    />
                  </Elements>
                )}
              </div>

              {/* Nota subscriptionId para debug (oculto em prod) */}
              {subscriptionId && process.env.NODE_ENV === "development" && (
                <p className="mt-2 text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                  sub: {subscriptionId}
                </p>
              )}
            </div>
          </div>
        </div>

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
