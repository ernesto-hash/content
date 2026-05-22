// client/pages/AnunciarSucesso.tsx
// Rota pública: /anunciar/sucesso

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Megaphone, CheckCircle2, ArrowRight, Calendar, Building2, Mail } from "lucide-react";

interface AdData {
  planName:     string;
  planDays:     number;
  planPrice:    number;
  companyName:  string;
  companyEmail: string;
}

export default function AnunciarSucesso() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [adData, setAdData] = useState<AdData | null>(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ad_checkout_data");
      if (raw) setAdData(JSON.parse(raw) as AdData);
    } catch { /* ignore */ }

    const timer = setTimeout(() => setAnimIn(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const startsAt = new Date();
  const endsAt   = adData
    ? new Date(startsAt.getTime() + adData.planDays * 24 * 60 * 60 * 1000)
    : null;

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: "#080010" }}>

        {/* Bokeh */}
        <div className="fixed pointer-events-none" style={{ top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle,rgba(52,211,153,0.06) 0%,transparent 70%)", filter: "blur(90px)", zIndex: 0 }} />

        <div
          className="relative max-w-lg w-full text-center"
          style={{
            zIndex:     1,
            opacity:    animIn ? 1 : 0,
            transform:  animIn ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div
              className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                background: "rgba(52,211,153,0.10)",
                border:     "1px solid rgba(52,211,153,0.30)",
                boxShadow:  "0 0 60px rgba(52,211,153,0.20)",
              }}
            >
              <Megaphone size={40} style={{ color: "#34d399" }} />
              <div
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#34d399", boxShadow: "0 0 20px rgba(52,211,153,0.50)" }}
              >
                <CheckCircle2 size={18} className="text-white" />
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl font-black text-white mb-2">{t("anunciar.sucesso.title")}</h1>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
            {t("anunciar.sucesso.subtitle")}
          </p>

          {/* Card com detalhes */}
          <div
            className="rounded-2xl p-6 mb-6 text-left space-y-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border:     "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <p className="text-xs font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              {t("anunciar.sucesso.detailsHeader")}
            </p>

            {adData ? (
              <div className="space-y-3">
                <Row icon={<Building2 size={14} />} label={t("anunciar.sucesso.labelCompany")} value={adData.companyName} />
                <Row icon={<Mail size={14} />}      label={t("anunciar.sucesso.labelEmail")}   value={adData.companyEmail} />
                <Row
                  icon={<Megaphone size={14} />}
                  label={t("anunciar.sucesso.labelPlan")}
                  value={`${adData.planName} · ${adData.planDays} ${t("anunciar.sucesso.days")} · ${adData.planPrice.toFixed(2).replace(".", ",")}€`}
                />
                {endsAt && (
                  <Row
                    icon={<Calendar size={14} />}
                    label={t("anunciar.sucesso.labelPeriod")}
                    value={`${fmt(startsAt)} → ${fmt(endsAt)}`}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                {t("anunciar.sucesso.paymentConfirmed")}
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(90deg,#34d399 0%,#059669 100%)",
              boxShadow:  "0 0 30px rgba(52,211,153,0.25), 0 6px 24px rgba(0,0,0,0.4)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            {t("anunciar.sucesso.ctaView")} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </Layout>
  );
}

function Row({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span style={{ color: "rgba(255,255,255,0.30)", marginTop: "1px" }}>{icon}</span>
      <div>
        <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.30)" }}>{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
