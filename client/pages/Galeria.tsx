// src/pages/Galeria.tsx
// Galeria Premium — versão pública
// Design fiel à imagem de referência:
//   • Fotos de modelos nas laterais (esquerda + direita) com fade para o centro
//   • 3 thumbnails desfocadas/censuradas na secção inferior do hero card
//   • Hero com todos os copy elements exactos

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import {
  Crown, ImageIcon, Shield, X, Check, Gem, Lock, AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────
// URLs das imagens — substitui pelos teus URLs reais
// (ex: https://xxxx.supabase.co/storage/v1/object/public/galeria/...)
// ─────────────────────────────────────────────
const SIDE_LEFT_IMGS  = ["/assets/galeria/side-left-1.jpg",  "/assets/galeria/side-left-2.jpg"];
const SIDE_RIGHT_IMGS = ["/assets/galeria/side-right-1.jpg", "/assets/galeria/side-right-2.jpg"];
const PREVIEW_THUMBS  = ["/assets/galeria/preview-1.jpg", "/assets/galeria/preview-2.jpg", "/assets/galeria/preview-3.jpg"];

// ─────────────────────────────────────────────
// Planos
// ─────────────────────────────────────────────
const PLANOS = [
  {
    id: "normal", label: "Acesso Normal", icon: <ImageIcon size={20} />,
    cor: "from-blue-500 to-blue-700", corBorder: "border-blue-500/50",
    corText: "text-blue-400", corBg: "bg-blue-500/10",
    mensal: "4,49€", anual: "40€",
    desc: "Acesso ao conteúdo base da galeria.",
    beneficios: ["Acesso a packs normais","Novos packs mensais","Visualização em HD","Cancela quando quiseres"],
  },
  {
    id: "exclusivo", label: "Conteúdo Exclusivo", icon: <Crown size={20} />,
    cor: "from-pink-500 to-purple-600", corBorder: "border-pink-500/50",
    corText: "text-pink-400", corBg: "bg-pink-500/10",
    mensal: "6,65€", anual: "60€", destaque: true,
    desc: "Conteúdo exclusivo que não encontras em mais lado.",
    beneficios: ["Tudo do Pack Normal","Conteúdo exclusivo premium","Packs adicionados semanalmente","Download em alta resolução"],
  },
  {
    id: "raro", label: "Conteúdo Raro", icon: <Gem size={20} />,
    cor: "from-amber-400 to-orange-500", corBorder: "border-amber-400/50",
    corText: "text-amber-400", corBg: "bg-amber-400/10",
    mensal: "9€", anual: "75€",
    desc: "O topo da galeria. Conteúdo raro e irrepetível.",
    beneficios: ["Tudo dos planos anteriores","Conteúdo raro e exclusivo","Acesso antecipado a novos packs","Suporte prioritário"],
  },
];

// ─────────────────────────────────────────────
// Popup de planos
// ─────────────────────────────────────────────
function UnlockPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-pink-500/25 max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(135deg,#120820 0%,#1a0a2e 50%,#0d1220 100%)" }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(236,72,153,0.12)" }} />
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
          <X size={15} />
        </button>
        <div className="relative p-7 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#ec4899,#9333ea)", boxShadow: "0 0 25px rgba(236,72,153,0.3)" }}>
              <Crown size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Escolhe o teu Plano</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Acesso imediato após subscrição</p>
          </div>
          <div className="space-y-3">
            {PLANOS.map(plano => (
              <div key={plano.id}
                className={`relative rounded-xl border p-4 ${plano.corBorder} ${plano.corBg} ${"destaque" in plano && plano.destaque ? "ring-1 ring-pink-500/30" : ""}`}>
                {"destaque" in plano && plano.destaque && (
                  <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-white text-[10px] font-black"
                    style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                    MAIS POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plano.cor} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white">{plano.icon}</span>
                    </div>
                    <div>
                      <p className={`font-black text-sm ${plano.corText}`}>{plano.label}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{plano.desc}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-white font-black text-xl">
                      {plano.mensal}<span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>/mês</span>
                    </p>
                    <p className={`text-[10px] ${plano.corText}`}>{plano.anual}/ano</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2.5">
            <Link to="/signup" onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-black text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)", boxShadow: "0 0 20px rgba(236,72,153,0.35)" }}>
              → QUERO ACESSO AGORA
            </Link>
            <Link to="/login" onClick={onClose}
              className="block w-full py-3 rounded-xl text-white text-sm font-semibold text-center transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              Já tenho conta — Entrar
            </Link>
            <button onClick={onClose} className="w-full text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.22)" }}>
              Continuar com preview gratuita
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Shield size={11} /> Pagamento seguro · Cancela quando quiseres
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente SideImages — colunas laterais com fotos
// ─────────────────────────────────────────────
function SideColumn({ imgs, side }: { imgs: string[]; side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div
      className="absolute top-0 h-full pointer-events-none select-none"
      style={{
        [isLeft ? "left" : "right"]: 0,
        width: "clamp(72px, 18vw, 260px)",
        zIndex: 0,
      }}
    >
      {/* Foto superior */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "55%" }}>
        <img src={imgs[0]} alt="" aria-hidden="true"
          className="w-full h-full object-cover"
          style={{ objectPosition: isLeft ? "right center" : "left center", opacity: 0.6 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#2a0838 0%,#180624 100%)", zIndex: -1 }} />
      </div>
      {/* Foto inferior */}
      <div className="absolute bottom-0 left-0 w-full" style={{ height: "50%" }}>
        <img src={imgs[1]} alt="" aria-hidden="true"
          className="w-full h-full object-cover"
          style={{ objectPosition: isLeft ? "right center" : "left center", opacity: 0.5 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#180624 0%,#0c0416 100%)", zIndex: -1 }} />
      </div>
      {/* Fade horizontal — escurece na direcção do conteúdo central */}
      <div className="absolute inset-0" style={{
        background: isLeft
          ? "linear-gradient(to right, rgba(8,0,14,0.1) 0%, rgba(8,0,14,0.55) 70%, rgba(8,0,14,1) 100%)"
          : "linear-gradient(to left,  rgba(8,0,14,0.1) 0%, rgba(8,0,14,0.55) 70%, rgba(8,0,14,1) 100%)",
      }} />
      {/* Vinheta vertical (topo e fundo) */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(8,0,14,0.75) 0%, transparent 15%, transparent 82%, rgba(8,0,14,0.75) 100%)",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function Galeria() {
  const [showPopup, setShowPopup] = useState(false);
  const totalUsers = 2847;
  const [previewThumbs, setPreviewThumbs] = useState<string[]>(PREVIEW_THUMBS);

  useEffect(() => {
    supabase
      .from("galeria_fotos")
      .select("storage_path")
      .eq("is_preview", true)
      .limit(3)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const urls = (data as { storage_path: string }[])
          .map(f => supabase.storage.from("galeria-fotos").getPublicUrl(f.storage_path).data.publicUrl)
          .filter(Boolean);
        if (urls.length > 0) setPreviewThumbs(urls);
      });
  }, []);

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════
          WRAPPER DE PÁGINA — fundo escuro + fotos laterais
          ═══════════════════════════════════════════════ */}
      <div className="relative w-full overflow-x-hidden" style={{ background: "#080010", minHeight: "100vh" }}>

        {/* Fotos laterais (apenas decorativas, fundo) */}
        <SideColumn imgs={SIDE_LEFT_IMGS}  side="left"  />
        <SideColumn imgs={SIDE_RIGHT_IMGS} side="right" />

        {/* ═══════════════════════════════════════════════
            CONTEÚDO CENTRAL
            Usa padding lateral para nunca sobrepor as colunas.
            Em mobile o padding é menor (as colunas são mais estreitas).
            ═══════════════════════════════════════════════ */}
        <div
          className="relative space-y-6 py-8"
          style={{
            zIndex: 1,
            maxWidth: "680px",
            width: "100%",
            margin: "0 auto",
            /* padding lateral em px para garantir que o conteúdo
               central não entra na zona das fotos laterais */
            paddingLeft:  "clamp(16px, 4vw, 32px)",
            paddingRight: "clamp(16px, 4vw, 32px)",
          }}
        >

          {/* ══ HERO CARD ══ */}
          <div
            className="relative overflow-hidden rounded-3xl text-center"
            style={{
              background: "linear-gradient(180deg,rgba(18,4,32,0.97) 0%,rgba(26,8,48,0.97) 38%,rgba(16,10,28,0.97) 68%,rgba(10,12,24,0.97) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 0 80px rgba(236,72,153,0.06)",
            }}
          >
            {/* Brilho de fundo */}
            <div className="absolute pointer-events-none" style={{
              top: "-60px", left: "50%", transform: "translateX(-50%)",
              width: "480px", height: "260px",
              background: "radial-gradient(ellipse,rgba(236,72,153,0.14) 0%,transparent 70%)",
            }} />

            {/* ─── Zona de texto ─── */}
            <div className="relative px-5 sm:px-10 pt-10 pb-6 space-y-4">

              {/* Headline */}
              <div className="space-y-0.5">
                <h1 className="font-black leading-tight text-white"
                  style={{ fontSize: "clamp(1.65rem,5.5vw,2.75rem)" }}>
                  +1.000 fotos privadas
                </h1>
                <h2 className="font-black leading-tight"
                  style={{ fontSize: "clamp(1.4rem,5vw,2.4rem)" }}>
                  que <span style={{ color: "#ec4899" }}>NÃO estão</span> na internet
                </h2>
              </div>

              {/* Subtítulo */}
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(0.82rem,2.4vw,0.97rem)" }}>
                Conteúdo <strong className="text-white">raro</strong>,{" "}
                <strong className="text-white">vazado</strong> e atualizado todos os dias.
              </p>

              {/* Acesso limitado */}
              <div className="flex items-center justify-center gap-1.5"
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(0.78rem,2.2vw,0.9rem)" }}>
                <Lock size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
                Apenas para <strong className="text-white">membros</strong> — acesso limitado
              </div>

              {/* Hook */}
              <p className="font-bold" style={{ color: "#ec4899", fontSize: "clamp(0.82rem,2.4vw,0.97rem)" }}>
                Já imaginaste ver o que ninguém conseguiu ver?
              </p>

              {/* CTA principal */}
              <div>
                <button
                  onClick={() => setShowPopup(true)}
                  className="font-black text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "400px",
                    margin: "0 auto",
                    padding: "clamp(13px,3vw,17px) clamp(20px,5vw,40px)",
                    borderRadius: "50px",
                    fontSize: "clamp(0.88rem,2.8vw,1.05rem)",
                    background: "linear-gradient(90deg,#e91e8c 0%,#b5135a 100%)",
                    boxShadow: "0 0 36px rgba(233,30,140,0.55), 0 5px 20px rgba(0,0,0,0.5)",
                    letterSpacing: "0.03em",
                  }}
                >
                  ➔ QUERO ACESSO AGORA
                </button>
              </div>

              {/* Trust bullets */}
              <div
                className="rounded-2xl p-4 sm:p-5 space-y-3 text-left"
                style={{
                  background: "rgba(0,0,0,0.42)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                {[`${totalUsers.toLocaleString()} membros ativos`, "Atualizações diárias", "Conteúdo exclusivo"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5"
                    style={{ fontSize: "clamp(0.78rem,2.3vw,0.88rem)", color: "rgba(255,255,255,0.82)" }}>
                    <Check size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
                <div className="flex items-start gap-2.5 pt-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "clamp(0.75rem,2.2vw,0.85rem)" }}>
                  <AlertTriangle size={13} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ color: "rgba(251,191,36,0.85)" }}>
                    Acesso pode ser fechado a <strong style={{ color: "#fbbf24" }}>qualquer momento</strong>
                  </span>
                </div>
              </div>

              {/* Preço destaque */}
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(0.82rem,2.4vw,0.92rem)" }}>
                Hoje: acesso completo por <strong className="text-white">apenas</strong>{" "}
                <span className="font-black" style={{ color: "#fbbf24", fontSize: "clamp(1.05rem,3vw,1.3rem)" }}>6,65€</span>
              </p>

              {/* 3 planos compactos */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "clamp(6px,2vw,12px)", maxWidth: "400px", margin: "0 auto" }}>
                {PLANOS.map(plano => (
                  <button key={plano.id}
                    onClick={() => setShowPopup(true)}
                    className={`text-center rounded-2xl border transition-all hover:scale-[1.04] active:scale-[0.97] ${plano.corBg} ${plano.corBorder}`}
                    style={{ padding: "clamp(10px,2.5vw,14px) clamp(4px,1.5vw,10px)" }}>
                    <p className={`font-black leading-tight mb-1 ${plano.corText}`}
                      style={{ fontSize: "clamp(8px,1.8vw,10px)" }}>
                      {plano.label}
                    </p>
                    <p className={`font-black ${plano.corText}`} style={{ fontSize: "clamp(0.95rem,3vw,1.15rem)" }}>
                      {plano.mensal}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px" }}>/mês</p>
                  </button>
                ))}
              </div>

              {/* Copy modelos */}
              <p className="pb-1" style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(0.68rem,1.9vw,0.78rem)" }}>
                Modelos famosas, influencers e{" "}
                <strong style={{ color: "rgba(255,255,255,0.6)" }}>conteúdo privado</strong>{" "}
                como{" "}
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>MC Mirella, Bernice Burgos</span>
                {" "}e mais...
              </p>
            </div>

            {/* ═══════════════════════════════════════════════
                THUMBNAILS DESFOCADAS — secção inferior do card
                3 imagens em grelha com blur pesado, exactamente
                como na fotografia de referência.
                ═══════════════════════════════════════════════ */}
            <div className="relative" style={{ marginTop: "2px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2px" }}>
                {previewThumbs.map((src, i) => (
                  <div key={i} className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    {/* Imagem real desfocada */}
                    <img src={src} alt="" aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: "blur(13px) brightness(0.55) saturate(0.9)", transform: "scale(1.1)" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {/* Fallback de cor se imagem não carregar */}
                    <div className="absolute inset-0" style={{
                      background: i === 0
                        ? "linear-gradient(160deg,#2e0a40 0%,#1c062e 100%)"
                        : i === 1
                        ? "linear-gradient(160deg,#3a0a2e 0%,#200618 100%)"
                        : "linear-gradient(160deg,#280a3a 0%,#180428 100%)",
                      zIndex: -1,
                    }} />
                    {/* Cadeado de censura */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full flex items-center justify-center"
                        style={{
                          width: "clamp(30px,7vw,46px)",
                          height: "clamp(30px,7vw,46px)",
                          background: "rgba(236,72,153,0.22)",
                          border: "1px solid rgba(236,72,153,0.45)",
                          backdropFilter: "blur(4px)",
                        }}>
                        <Lock style={{ width: "clamp(12px,3vw,18px)", height: "clamp(12px,3vw,18px)", color: "#ec4899" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gradiente de fade sobre os thumbs (baixo para cima) */}
              <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{
                height: "75%",
                background: "linear-gradient(to bottom, transparent 0%, rgba(8,0,14,0.5) 50%, rgba(8,0,14,0.97) 100%)",
              }} />

              {/* Texto sobre os thumbs */}
              <div className="absolute bottom-0 left-0 w-full text-center pb-5 px-4" style={{ zIndex: 2 }}>
                <p className="italic" style={{ color: "rgba(255,255,255,0.78)", fontSize: "clamp(0.72rem,2.2vw,0.88rem)" }}>
                  Modelos famosas, influencers e{" "}
                  <strong className="not-italic text-white">conteúdo privado</strong>
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(0.68rem,2vw,0.82rem)" }}>
                  como{" "}
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>MC Mirella, Bernice Burgos</span>
                  {" "}e mais...
                </p>
              </div>
            </div>
          </div>

          {/* ══ Cards detalhados dos 3 planos ══ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "16px" }}>
            {PLANOS.map(plano => (
              <div key={plano.id}
                className={`relative rounded-2xl border p-5 space-y-4 ${plano.corBorder} ${plano.corBg} ${"destaque" in plano && plano.destaque ? "ring-1 ring-pink-500/20" : ""}`}
                style={{ background: "linear-gradient(135deg,#0f0218 0%,#110820 100%)" }}>
                {"destaque" in plano && plano.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full text-white text-[10px] font-black whitespace-nowrap"
                    style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                    MAIS POPULAR
                  </div>
                )}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plano.cor} flex items-center justify-center`}>
                  <span className="text-white">{plano.icon}</span>
                </div>
                <div>
                  <h3 className={`text-base font-black ${plano.corText}`}>{plano.label}</h3>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{plano.desc}</p>
                </div>
                <div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-white">{plano.mensal}</span>
                    <span className="text-sm mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>/mês</span>
                  </div>
                  <p className={`text-xs ${plano.corText}`}>{plano.anual}/ano — poupas 2 meses</p>
                </div>
                <div className="space-y-2">
                  {plano.beneficios.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plano.corBg} border ${plano.corBorder}`}>
                        <Check size={9} className={plano.corText} />
                      </div>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{b}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowPopup(true)}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${plano.cor} text-white font-black text-sm hover:opacity-90 transition-all`}>
                  Começar agora
                </button>
              </div>
            ))}
          </div>

          {/* ══ CTA final ══ */}
          <div className="relative overflow-hidden rounded-2xl p-7 text-center"
            style={{ background: "linear-gradient(135deg,#1a0830 0%,#200a18 60%,#0d0820 100%)", border: "1px solid rgba(236,72,153,0.15)" }}>
            <div className="absolute pointer-events-none"
              style={{ top: "-40px", right: "-40px", width: "176px", height: "176px",
                background: "radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 70%)" }} />
            <div className="relative max-w-md mx-auto space-y-3">
              <Shield size={30} style={{ margin: "0 auto", color: "#ec4899" }} />
              <h2 className="text-xl font-black text-white">Acesso total à galeria</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>3 planos disponíveis. Cancela quando quiseres.</p>
              <button onClick={() => setShowPopup(true)}
                className="px-6 py-3 rounded-xl text-white font-black text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                Ver galeria completa
              </button>
            </div>
          </div>

        </div>
      </div>

      {showPopup && <UnlockPopup onClose={() => setShowPopup(false)} />}
    </Layout>
  );
}