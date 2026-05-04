// src/pages/Anunciar.tsx
// Página pública para empresas anunciarem na plataforma
// Fluxo: Escolher plano → Preencher detalhes → Confirmar → /anunciar/pagamento

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  CheckCircle2, Crown, Zap, Star, Shield,
  ArrowRight, ChevronRight, Eye, TrendingUp, Users,
  Building2, Globe, Mail, FileText, Palette,
  Check,
  BarChart3, Target, Megaphone, Gem,
} from "lucide-react";

// ─────────────────────────────────────────────
// Planos
// ─────────────────────────────────────────────
const PLANS = [
  {
    id: "flash", name: "Flash", days: 3, price: 29.99,
    gradientFrom: "#334155", gradientTo: "#1e293b",
    accentColor: "#94a3b8", ringColor: "rgba(148,163,184,0.4)",
    icon: Zap,
    features: ["3 dias de exibição", "Todas as páginas", "Link clicável", "Estatísticas básicas"],
    popular: false,
  },
  {
    id: "weekly", name: "Semanal", days: 7, price: 59.99,
    gradientFrom: "#ec4899", gradientTo: "#8b5cf6",
    accentColor: "#f472b6", ringColor: "rgba(236,72,153,0.5)",
    icon: Star,
    features: ["7 dias de exibição", "Todas as páginas", "Link clicável", "Rotação automática", "Relatório semanal"],
    popular: true,
  },
  {
    id: "monthly", name: "Mensal", days: 30, price: 199.99,
    gradientFrom: "#f59e0b", gradientTo: "#d97706",
    accentColor: "#fbbf24", ringColor: "rgba(245,158,11,0.4)",
    icon: Crown,
    features: ["30 dias de exibição", "Todas as páginas", "Link clicável", "Rotação automática", "Relatório detalhado", "Suporte prioritário"],
    popular: false,
  },
  {
    id: "premium", name: "Premium", days: 90, price: 499.99,
    gradientFrom: "#7c3aed", gradientTo: "#4c1d95",
    accentColor: "#a78bfa", ringColor: "rgba(124,58,237,0.5)",
    icon: Crown,
    features: ["90 dias de exibição", "Todas as páginas", "Link clicável", "Rotação automática", "Relatório diário", "Suporte dedicado", "Destaque especial"],
    popular: false,
  },
  {
    id: "vip", name: "VIP", days: 180, price: 899.99,
    gradientFrom: "#b45309", gradientTo: "#92400e",
    accentColor: "#f59e0b", ringColor: "rgba(180,83,9,0.5)",
    icon: Gem,
    features: ["180 dias de exibição", "Todas as páginas", "Link clicável", "Prioridade máxima", "Relatório diário", "Suporte VIP dedicado", "Destaque permanente"],
    popular: false,
  },
];

const BG_OPTIONS = [
  { value: "#0f0f1a", label: "Escuro" },
  { value: "#1a0020", label: "Púrpura" },
  { value: "#001228", label: "Azul Noite" },
  { value: "#0a1200", label: "Verde Escuro" },
  { value: "#1a0800", label: "Âmbar Escuro" },
  { value: "#180010", label: "Rubi" },
];

const ACCENT_OPTIONS = [
  { value: "#ec4899", label: "Rosa" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#22c55e", label: "Verde" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#8b5cf6", label: "Violeta" },
];

type Step = "plan" | "details" | "payment";
type FormData = {
  company_name: string; company_email: string; website_url: string;
  headline: string; description: string; cta_text: string;
  logo_url: string; bg_color: string; accent_color: string;
};

export default function Anunciar() {
  const navigate = useNavigate();
  const [step,         setStep]        = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [form,         setForm]         = useState<FormData>({
    company_name: "", company_email: "", website_url: "",
    headline: "", description: "", cta_text: "Saber mais",
    logo_url: "", bg_color: "#0f0f1a", accent_color: "#ec4899",
  });

  const upd = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const formValid = () =>
    form.company_name.trim() && form.company_email.includes("@") &&
    form.website_url.startsWith("http") && form.headline.trim() && form.description.trim();

  const handleGoToPayment = () => {
    sessionStorage.setItem("ad_checkout_data", JSON.stringify({
      planId:       selectedPlan.id,
      planName:     selectedPlan.name,
      planDays:     selectedPlan.days,
      planPrice:    selectedPlan.price,
      placement:    JSON.stringify(["all_pages"]),
      companyName:  form.company_name.trim(),
      companyEmail: form.company_email.trim(),
      websiteUrl:   form.website_url.trim(),
      headline:     form.headline.trim(),
      description:  form.description.trim(),
      ctaText:      form.cta_text.trim() || "Saber mais",
      logoUrl:      form.logo_url.trim() || "",
      bgColor:      form.bg_color,
      accentColor:  form.accent_color,
    }));
    navigate("/anunciar/pagamento");
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <Layout>
      <div className="max-container safe-area py-10 space-y-10">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center"
          style={{ background: "linear-gradient(135deg,#1c0830 0%,#2a0a28 50%,#0e1240 100%)", border: "1px solid rgba(236,72,153,0.18)" }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(236,72,153,0.12) 0%,transparent 70%)" }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)" }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)", color: "rgba(236,72,153,0.9)" }}>
              <Megaphone size={12} /> Publicidade
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              Anuncia para milhares de<br />
              <span style={{ background: "linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                utilizadores activos
              </span>
            </h1>
            <p className="text-white/50 text-base max-w-lg mx-auto mb-8">O teu anúncio aparece automaticamente para todos os visitantes. Começa em minutos.</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {[
                { icon: Users,      val: "50K+",  label: "Visitantes/mês" },
                { icon: Eye,        val: "200K+", label: "Impressões/mês" },
                { icon: TrendingUp, val: "2.8%",  label: "CTR médio"      },
                { icon: BarChart3,  val: "18-35", label: "Idade principal" },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label} className="text-center">
                  <Icon size={14} className="text-neon-pink/60 mx-auto mb-1" />
                  <p className="text-lg font-black text-white">{val}</p>
                  <p className="text-[10px] text-white/35">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2">
          {(["plan","details","payment"] as Step[]).map((s, i) => {
            const labels = ["Plano","Detalhes","Pagamento"];
            const done   = ["plan","details","payment"].indexOf(step) > i;
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active ? "bg-neon-pink text-white" : done ? "bg-neon-pink/20 text-neon-pink" : "bg-white/5 text-white/25"
                }`}>
                  {done ? <Check size={11} /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{labels[i]}</span>
                </div>
                {i < 2 && <ChevronRight size={12} className="text-white/20" />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: PLANO ── */}
        {step === "plan" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white text-center">Escolhe o teu plano</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {PLANS.map(plan => {
                const Icon     = plan.icon;
                const selected = selectedPlan.id === plan.id;
                return (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                    className="relative text-left rounded-2xl p-5 border transition-all"
                    style={{
                      background:  selected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                      borderColor: selected ? plan.ringColor : "rgba(255,255,255,0.08)",
                      boxShadow:   selected ? `0 0 0 2px ${plan.ringColor}` : "none",
                    }}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black text-white"
                        style={{ background: "linear-gradient(90deg,#ec4899,#8b5cf6)" }}>
                        Mais popular
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg,${plan.gradientFrom},${plan.gradientTo})` }}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <p className="text-base font-black text-white mb-0.5">{plan.name}</p>
                    <p className="text-[11px] mb-3" style={{ color: plan.accentColor }}>{plan.days} dia{plan.days > 1 ? "s" : ""} de exibição</p>
                    <p className="text-2xl font-black text-white mb-4">€{plan.price}<span className="text-xs text-white/35 font-normal"> /total</span></p>
                    <ul className="space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-white/55">
                          <CheckCircle2 size={10} className="text-neon-pink/60 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center">
              <button onClick={() => setStep("details")}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)", boxShadow: "0 0 24px rgba(236,72,153,0.3)" }}>
                Continuar com {selectedPlan.name} — €{selectedPlan.price} <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Pagamento seguro",       desc: "Processado pelo Stripe. Dados protegidos." },
                { icon: Zap,    title: "Activação imediata",     desc: "Anúncio activo após pagamento." },
                { icon: Target, title: "Audiência qualificada",  desc: "Adultos 18+ com interesse real." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
                  <div className="w-8 h-8 rounded-lg bg-neon-pink/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-neon-pink/70" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/80">{title}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: DETALHES ── */}
        {step === "details" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-black text-white text-center">Detalhes do anúncio</h2>

            {/* Preview em tempo real */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: `${form.accent_color}30` }}>
              <div className="px-3 py-1.5 flex justify-between items-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                <span className="text-[9px] text-white/25 tracking-wider uppercase">Pré-visualização do anúncio</span>
                <span className="text-[9px] text-white/20">{selectedPlan.name} · {selectedPlan.days} dias</span>
              </div>
              <div className="flex items-center" style={{ background: form.bg_color, minHeight: "90px" }}>
                <div className="flex flex-col items-center justify-center gap-1 px-4 flex-shrink-0"
                  style={{ minWidth: "110px", height: "90px", background: `${form.accent_color}15`, borderRight: `1px solid ${form.accent_color}20` }}>
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="w-9 h-9 object-contain rounded-lg"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${form.accent_color}25` }}>
                      <Building2 size={16} style={{ color: form.accent_color }} />
                    </div>
                  )}
                  <span className="text-[11px] font-black" style={{ color: form.accent_color }}>{form.company_name || "Empresa"}</span>
                </div>
                <div className="flex-1 px-5 py-3">
                  <div className="text-[9px] font-bold tracking-wider uppercase mb-1.5" style={{ color: form.accent_color, opacity: 0.7 }}>Publicidade</div>
                  <div className="text-[15px] font-black text-white mb-1">{form.headline || "O título do teu anúncio"}</div>
                  <div className="text-[11px] text-white/50">{form.description || "Descrição breve e apelativa."}</div>
                </div>
                <div className="px-4 flex-shrink-0">
                  <span className="inline-block px-4 py-2 rounded-full text-[12px] font-bold text-white"
                    style={{ background: form.accent_color }}>{form.cta_text || "Saber mais"}</span>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1"><Building2 size={11} />Nome da empresa *</label>
                  <input value={form.company_name} onChange={e => upd("company_name", e.target.value)}
                    placeholder="Ex: NovaSkin Portugal"
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1"><Mail size={11} />Email de contacto *</label>
                  <input type="email" value={form.company_email} onChange={e => upd("company_email", e.target.value)}
                    placeholder="anuncios@empresa.com"
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1"><Globe size={11} />URL do site (destino ao clicar) *</label>
                <input value={form.website_url} onChange={e => upd("website_url", e.target.value)}
                  placeholder="https://www.empresa.com"
                  className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1">
                  <FileText size={11} />Título do anúncio *
                  <span className="ml-auto text-white/25">{form.headline.length}/60</span>
                </label>
                <input maxLength={60} value={form.headline} onChange={e => upd("headline", e.target.value)}
                  placeholder="Ex: A pele que sempre sonhaste — em 30 dias"
                  className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1">
                  <FileText size={11} />Descrição *
                  <span className="ml-auto text-white/25">{form.description.length}/100</span>
                </label>
                <textarea maxLength={100} value={form.description} onChange={e => upd("description", e.target.value)}
                  placeholder="Ex: Tecnologia dermatológica avançada. Testado por especialistas."
                  rows={2}
                  className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Texto do botão CTA</label>
                  <input value={form.cta_text} onChange={e => upd("cta_text", e.target.value)} placeholder="Saber mais"
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">URL do logótipo (opcional)</label>
                  <input value={form.logo_url} onChange={e => upd("logo_url", e.target.value)} placeholder="https://empresa.com/logo.png"
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-pink/40 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2 flex items-center gap-1"><Palette size={11} />Cor de fundo</label>
                  <div className="flex flex-wrap gap-2">
                    {BG_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => upd("bg_color", o.value)} title={o.label}
                        className="w-8 h-8 rounded-lg border-2 transition-all"
                        style={{ background: o.value, borderColor: form.bg_color === o.value ? "#fff" : "transparent" }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2 flex items-center gap-1"><Palette size={11} />Cor de destaque</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => upd("accent_color", o.value)} title={o.label}
                        className="w-8 h-8 rounded-lg border-2 transition-all"
                        style={{ background: o.value, borderColor: form.accent_color === o.value ? "#fff" : "transparent" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("plan")}
                className="px-6 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-all">Voltar</button>
              <button onClick={() => setStep("payment")} disabled={!formValid()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }}>
                Continuar para pagamento <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRMAR E PAGAR ── */}
        {step === "payment" && (
          <div className="max-w-lg mx-auto space-y-6">
            <h2 className="text-xl font-black text-white text-center">Confirmar pedido</h2>

            {/* Resumo */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-sm font-bold text-white/70 mb-3">Resumo do pedido</h3>
              {[
                ["Plano",          `${selectedPlan.name} — ${selectedPlan.days} dias`],
                ["Empresa",        form.company_name],
                ["Email",          form.company_email],
                ["URL",            form.website_url],
                ["Título",         form.headline],
                ["Activo durante", `${selectedPlan.days} dia${selectedPlan.days > 1 ? "s" : ""}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm gap-4">
                  <span className="text-white/55 flex-shrink-0">{k}</span>
                  <span className="text-white font-semibold text-right truncate">{v}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-xl font-black text-neon-pink">€{selectedPlan.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-white/30 bg-white/[0.02] rounded-xl px-3 py-3">
              <Shield size={12} className="text-green-400/60 flex-shrink-0" />
              Introduzirás os dados do cartão na próxima página. Pagamento seguro via Stripe com SSL 256-bit.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("details")}
                className="px-6 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-all">Voltar</button>
              <button
                onClick={handleGoToPayment}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)", boxShadow: "0 0 24px rgba(236,72,153,0.3)" }}
              >
                CONFIRMAR E IR PARA PAGAMENTO <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
