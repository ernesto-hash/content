// client/pages/AnunciarPagamento.tsx
// Rota pública: /anunciar/pagamento
// Stripe Elements para pagamento único de publicidade.

import { useEffect, useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import {
  Megaphone, Check, Lock, Shield,
  Loader2, AlertCircle, ArrowLeft,
} from "lucide-react";

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
    ".Tab":           { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" },
    ".Tab--selected": { backgroundColor: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.35)" },
  },
};

interface AdData {
  planId:       string;
  planName:     string;
  planDays:     number;
  planPrice:    number;
  placement:    string;
  companyName:  string;
  companyEmail: string;
  websiteUrl:   string;
  headline:     string;
  description:  string;
  ctaText:      string;
  logoUrl:      string;
  bgColor:      string;
  accentColor:  string;
}

// ─── Formulário de pagamento (dentro de <Elements>) ───────────────────────────
function PaymentForm({ adData }: { adData: AdData }) {
  const { t }    = useTranslation();
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [cardName, setCardName] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url:          `${window.location.origin}/anunciar/sucesso`,
          payment_method_data: { billing_details: { name: cardName } },
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message ?? "Erro no pagamento.");
      } else {
        // ── Inserção directa: activa o anúncio imediatamente ──
        try {
          const now    = new Date();
          const endsAt = new Date(now.getTime() + adData.planDays * 24 * 60 * 60 * 1000);

          let placement: string[] = ["all_pages"];
          try {
            const parsed = JSON.parse(adData.placement);
            if (Array.isArray(parsed)) placement = parsed;
          } catch {
            placement = [adData.placement];
          }

          const piId = (result as { paymentIntent?: { id?: string } }).paymentIntent?.id ?? null;

          const { error: insertError } = await supabase
            .from("ads")
            .insert({
              company_name:      adData.companyName,
              company_email:     adData.companyEmail,
              website_url:       adData.websiteUrl,
              headline:          adData.headline,
              description:       adData.description ?? "",
              cta_text:          adData.ctaText      || "Saber mais",
              logo_url:          adData.logoUrl       || null,
              bg_color:          adData.bgColor       || "#0f0f1a",
              accent_color:      adData.accentColor   || "#ec4899",
              plan_id:           adData.planId,
              plan_days:         adData.planDays,
              plan_price:        adData.planPrice.toFixed(2),
              placement,
              status:            "active",
              stripe_payment_id: piId,
              paid_at:           now.toISOString(),
              starts_at:         now.toISOString(),
              ends_at:           endsAt.toISOString(),
            });

          if (insertError) {
            console.error("[AnunciarPagamento] Erro ao inserir anúncio:", insertError.message);
            // Não bloqueia — o webhook tenta novamente
          }
        } catch (insertErr) {
          console.error("[AnunciarPagamento] Excepção ao inserir anúncio:", insertErr);
        }

        navigate("/anunciar/sucesso", { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  // Mini banner preview
  const MiniPreview = () => (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden"
      style={{
        background: adData.bgColor || "#0f0f1a",
        border:     `1px solid ${adData.accentColor}44`,
        boxShadow:  `0 0 18px ${adData.accentColor}20`,
      }}
    >
      {adData.logoUrl && (
        <img
          src={adData.logoUrl}
          alt="Logo"
          className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className="font-black text-sm truncate"
          style={{ color: adData.accentColor || "#ec4899" }}
        >
          {adData.headline || t("anunciar.pagamento.previewHeadline")}
        </p>
        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
          {adData.description || t("anunciar.pagamento.previewDesc")}
        </p>
      </div>
      <span
        className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
        style={{ background: `${adData.accentColor}22`, color: adData.accentColor || "#ec4899" }}
      >
        {adData.ctaText || t("anunciar.pagamento.previewCta")}
      </span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Preview do anúncio */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
          {t("anunciar.pagamento.previewLabel")}
        </p>
        <MiniPreview />
      </div>

      {/* Resumo do plano */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.30)" }}
          >
            <Megaphone size={16} style={{ color: "#ec4899" }} />
          </div>
          <div>
            <p className="font-black text-sm text-white">{adData.planName}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {adData.planDays} {t("anunciar.pagamento.daysOfAd")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-white text-base">{adData.planPrice.toFixed(2).replace(".", ",")}€</p>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{t("anunciar.pagamento.singlePayment")}</p>
        </div>
      </div>

      {/* Nome no cartão */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
          {t("anunciar.pagamento.cardName")}
        </label>
        <input
          type="text"
          placeholder={t("anunciar.pagamento.cardNamePlaceholder")}
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
          {t("anunciar.pagamento.cardData")}
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
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" /> {t("anunciar.pagamento.processing")}
          </span>
        ) : (
          <span>{t("anunciar.pagamento.submitBtn")}</span>
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AnunciarPagamento() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [adData,       setAdData]       = useState<AdData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [animIn,       setAnimIn]       = useState(false);

  // Lê sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ad_checkout_data");
      if (!raw) { navigate("/anunciar", { replace: true }); return; }
      setAdData(JSON.parse(raw) as AdData);
    } catch {
      navigate("/anunciar", { replace: true });
    }
    const timer = setTimeout(() => setAnimIn(true), 80);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Cria PaymentIntent assim que temos adData
  useEffect(() => {
    if (!adData) return;
    let cancelled = false;

    (async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const amount      = Math.round(adData.planPrice * 100);

        const res = await fetch(`${supabaseUrl}/functions/v1/create-ad-payment-intent`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            amount,
            planId:       adData.planId,
            planDays:     adData.planDays,
            planName:     adData.planName,
            companyName:  adData.companyName,
            companyEmail: adData.companyEmail,
            websiteUrl:   adData.websiteUrl,
            headline:     adData.headline,
            description:  adData.description,
            ctaText:      adData.ctaText,
            logoUrl:      adData.logoUrl,
            bgColor:      adData.bgColor,
            accentColor:  adData.accentColor,
            placement:    adData.placement,
          }),
        });

        let data: Record<string, unknown> = {};
        try { data = await res.json(); } catch { /* empty */ }

        if (cancelled) return;

        if (!res.ok) throw new Error((data?.error as string) ?? `HTTP ${res.status}`);

        setClientSecret(data.clientSecret as string);
      } catch (err: unknown) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Erro ao iniciar checkout.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [adData]);

  const BENEFITS = [
    t("anunciar.pagamento.benefit0"),
    t("anunciar.pagamento.benefit1"),
    t("anunciar.pagamento.benefit2"),
    t("anunciar.pagamento.benefit3"),
  ];

  return (
    <Layout>
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
              onClick={() => navigate("/anunciar")}
              className="text-sm mb-3 inline-flex items-center gap-1.5 transition-colors"
              style={{ color: "rgba(255,255,255,0.30)" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#ec4899")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)")}
            >
              <ArrowLeft size={13} /> {t("anunciar.pagamento.back")}
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              {t("anunciar.pagamento.titlePrefix")}{" "}
              <span style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {t("anunciar.pagamento.titleHighlight")}
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

            {/* ── Coluna esquerda — Resumo ──────────────────────────────────── */}
            <div className="space-y-5">
              <h2 className="text-lg font-black text-white">{t("anunciar.pagamento.summaryTitle")}</h2>

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
                  {/* Empresa */}
                  {adData && (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.30)" }}
                        >
                          <Megaphone size={22} style={{ color: "#ec4899" }} />
                        </div>
                        <div>
                          <p className="font-black text-base text-white">{adData.companyName}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {adData.planName} · {adData.planDays} {t("anunciar.pagamento.days")}
                          </p>
                        </div>
                      </div>

                      {/* Preço */}
                      <div
                        className="py-3"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div className="flex items-end justify-between">
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{t("anunciar.pagamento.total")}</span>
                          <div className="text-right">
                            <p className="text-3xl font-black text-white">
                              {adData.planPrice.toFixed(2).replace(".", ",")}€
                            </p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>{t("anunciar.pagamento.singlePayment")}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Benefícios */}
                  <div className="space-y-2">
                    {BENEFITS.map((b, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.35)" }}
                        >
                          <Check size={9} style={{ color: "#ec4899" }} />
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
                  {t("anunciar.pagamento.secureMsg")}
                </p>
              </div>
            </div>

            {/* ── Coluna direita — Stripe Elements ──────────────────────────── */}
            <div>
              <h2 className="text-lg font-black text-white mb-4">{t("anunciar.pagamento.paymentDataTitle")}</h2>

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
                      onClick={() => navigate("/anunciar")}
                      className="text-xs px-4 py-2 rounded-lg transition-colors"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.50)" }}
                    >
                      {t("anunciar.pagamento.backToStart")}
                    </button>
                  </div>
                ) : !clientSecret || !adData ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <Loader2 size={28} className="animate-spin" style={{ color: "#ec4899" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {t("anunciar.pagamento.preparingCheckout")}
                    </p>
                  </div>
                ) : (
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
                  >
                    <PaymentForm adData={adData} />
                  </Elements>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes gradientBorder {
            0%   { background-position: 0%   50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0%   50%; }
          }
        `}</style>
      </div>
    </Layout>
  );
}
