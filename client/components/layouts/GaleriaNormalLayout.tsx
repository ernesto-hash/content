import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  ImageIcon, Crown, Gem, Lock, Search, Clock,
  TrendingUp, Sparkles, Eye, ChevronRight, Grid3x3, ArrowRight,
} from "lucide-react";
import type { GaleriaLayoutProps, Pack } from "./types";

type SortKey = "recentes" | "populares" | "destaque";
type PlanoNome = "normal" | "exclusivo" | "raro";

const PLANO_NIVEL: Record<PlanoNome, number> = { normal: 1, exclusivo: 2, raro: 3 };
const NAV = [
  { id: "normal"    as PlanoNome, label: "Normal",    Icon: ImageIcon, hex: "#60a5fa", rota: "/app/galeria/normal" },
  { id: "exclusivo" as PlanoNome, label: "Exclusivo", Icon: Crown,     hex: "#ec4899", rota: "/app/galeria/exclusivo" },
  { id: "raro"      as PlanoNome, label: "Raro",      Icon: Gem,       hex: "#fbbf24", rota: "/app/galeria/raro" },
];

function fmtViews(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n); }
function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Hoje"; if (d === 1) return "Ontem";
  if (d < 7) return `há ${d} dias`; return `há ${Math.floor(d / 7)} sem`;
}
function isNovo(iso: string) { return (Date.now() - new Date(iso).getTime()) < 7 * 86400000; }

function PackCardNormal({ pack }: { pack: Pack }) {
  const novo = isNovo(pack.created_at);
  return (
    <a
      href={`/app/galeria/${pack.id}`}
      className="group relative rounded-2xl overflow-hidden bg-black/30 transition-all duration-300"
      style={{ border: "1px solid rgba(96,165,250,0.15)" }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 16px 40px rgba(96,165,250,0.25)";
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.borderColor = "rgba(96,165,250,0.40)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "rgba(96,165,250,0.15)";
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        {pack.thumbnail_url ? (
          <img src={pack.thumbnail_url} alt={pack.titulo} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "rgba(96,165,250,0.04)" }}>
            <ImageIcon size={32} style={{ color: "rgba(96,165,250,0.20)" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {novo && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{ background: "rgba(52,211,153,0.25)", border: "1px solid rgba(52,211,153,0.45)", color: "#34d399" }}>
            NOVO
          </div>
        )}
        {pack.destaque && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{ background: "rgba(96,165,250,0.20)", border: "1px solid rgba(96,165,250,0.40)", color: "#60a5fa" }}>
            ★
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1"
          style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}>
          <ImageIcon size={9} /> {pack.fotos_count}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-4 py-2 rounded-xl font-black text-white text-sm flex items-center gap-2"
            style={{ background: "linear-gradient(90deg,#3b82f6,#60a5fa)", boxShadow: "0 0 20px rgba(96,165,250,0.60)" }}>
            VER PACK <ChevronRight size={14} />
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
          {pack.titulo}
        </h3>
        <div className="flex items-center justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
          <span className="flex items-center gap-1"><Eye size={9} /> {fmtViews(pack.views)}</span>
          <span className="flex items-center gap-1"><Clock size={9} /> {fmtRelative(pack.created_at)}</span>
        </div>
      </div>
    </a>
  );
}

function PackSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
          style={{ border: "1px solid rgba(96,165,250,0.08)", background: "rgba(96,165,250,0.02)" }}>
          <div style={{ aspectRatio: "2/3", background: "rgba(255,255,255,0.03)" }} />
          <div className="p-3 space-y-2">
            <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GaleriaNormalLayout({ packs, packsLoading, nivelUser }: GaleriaLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [sort, setSort]     = useState<SortKey>("recentes");
  const [upgradePreviews, setUpgradePreviews] = useState<string[]>([]);

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
        if (urls.length > 0) setUpgradePreviews(urls);
      });
  }, []);

  const totalFotos = packs.reduce((a, p) => a + p.fotos_count, 0);
  const novosCount = packs.filter(p => isNovo(p.created_at)).length;

  const filtered = [...packs]
    .filter(p => !search || p.titulo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "populares") return b.views - a.views;
      if (sort === "destaque")  return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0);
      return 0;
    });

  return (
    <LayoutAuthenticated>
      <div style={{ background: "#080e1a", minHeight: "100vh" }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0f1a2e 0%,#1a2840 50%,#0a0f1e 100%)" }}>
          <div className="absolute pointer-events-none"
            style={{ top: "-40px", right: "-20px", width: "300px", height: "300px",
              background: "radial-gradient(circle,rgba(96,165,250,0.10) 0%,transparent 70%)", filter: "blur(50px)" }} />
          <div className="absolute pointer-events-none"
            style={{ bottom: "-20px", left: "15%", width: "200px", height: "200px",
              background: "radial-gradient(circle,rgba(96,165,250,0.06) 0%,transparent 70%)", filter: "blur(40px)" }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black"
                style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.28)", color: "#60a5fa" }}>
                <ImageIcon size={11} /> ACESSO NORMAL ACTIVO
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">A tua Galeria</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                O teu conteúdo premium · actualizado regularmente
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <span><strong className="text-white">{packs.length}</strong> packs</span>
                <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.20)" }} />
                <span><strong className="text-white">{totalFotos.toLocaleString()}</strong> fotos</span>
                <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.20)" }} />
                {novosCount > 0
                  ? <span style={{ color: "#34d399" }}><strong>{novosCount}</strong> actualizações</span>
                  : <span>Actualizado hoje</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav bar ─────────────────────────────────────────── */}
        <div className="sticky top-0 z-40"
          style={{ background: "rgba(8,14,26,0.96)", backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(96,165,250,0.10)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
              {NAV.map(p => {
                const temAcesso = nivelUser >= PLANO_NIVEL[p.id];
                const isAtivo   = location.pathname === p.rota;
                const { Icon }  = p;
                return (
                  <button key={p.id}
                    onClick={() => { if (temAcesso) navigate(p.rota); }}
                    disabled={!temAcesso}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0"
                    style={isAtivo
                      ? { background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.28)", color: "#60a5fa" }
                      : temAcesso
                      ? { color: "rgba(255,255,255,0.50)" }
                      : { color: "rgba(255,255,255,0.20)", opacity: 0.4, cursor: "not-allowed" }}>
                    <Icon size={14} />
                    {p.label}
                    {!temAcesso && (
                      <span className="flex items-center gap-1 text-[10px] font-normal ml-1"
                        style={{ color: "rgba(255,255,255,0.28)" }}>
                        <Lock size={9} /> Upgrade
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Conteúdo ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(255,255,255,0.22)" }} />
              <input type="text" placeholder="Pesquisar packs..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)" }} />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {([
                { key: "recentes"  as SortKey, icon: <Clock size={12} />,      label: "Recentes" },
                { key: "populares" as SortKey, icon: <TrendingUp size={12} />, label: "Populares" },
                { key: "destaque"  as SortKey, icon: <Sparkles size={12} />,   label: "Destaque" },
              ]).map(s => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={sort === s.key
                    ? { background: "rgba(96,165,250,0.14)", border: "1px solid rgba(96,165,250,0.28)", color: "#60a5fa" }
                    : { color: "rgba(255,255,255,0.35)" }}>
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {packsLoading ? <PackSkeleton /> : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(pack => <PackCardNormal key={pack.id} pack={pack} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl"
              style={{ border: "1px solid rgba(96,165,250,0.08)", background: "rgba(96,165,250,0.02)" }}>
              <Grid3x3 size={40} style={{ color: "rgba(96,165,250,0.18)" }} />
              <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.28)" }}>
                {search ? `Sem packs para "${search}"` : "Ainda sem packs nesta galeria"}
              </p>
              {search && (
                <button onClick={() => setSearch("")} className="text-xs" style={{ color: "#60a5fa" }}>
                  Limpar pesquisa
                </button>
              )}
            </div>
          )}

          {/* Upgrade card → Exclusivo */}
          {!packsLoading && (
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
              style={{ background: "linear-gradient(135deg,#0f0218 0%,#1a0830 60%,#0a0f1e 100%)",
                border: "1px solid rgba(236,72,153,0.14)" }}>
              <div className="absolute pointer-events-none"
                style={{ top: "-30px", right: "-20px", width: "220px", height: "220px",
                  background: "radial-gradient(circle,rgba(236,72,153,0.10) 0%,transparent 70%)", filter: "blur(35px)" }} />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#ec4899" }}>
                    Queres conteúdo mais exclusivo?
                  </p>
                  <h3 className="text-xl font-black text-white">Faz upgrade para Exclusivo</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                    Conteúdo que não encontras em mais lado nenhum.
                  </p>
                  <div className="flex gap-2 pt-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-14 h-20 rounded-xl overflow-hidden relative flex-shrink-0"
                        style={{ border: "1px solid rgba(236,72,153,0.18)" }}>
                        <div className="absolute inset-0"
                          style={{ background: "linear-gradient(160deg,#2d0a4e,#1a0830)" }} />
                        {upgradePreviews[i] && (
                          <img
                            src={upgradePreviews[i]}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ filter: "blur(12px) brightness(0.4)", transform: "scale(1.05)" }}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ backdropFilter: "blur(4px)" }}>
                          <Lock size={13} style={{ color: "rgba(236,72,153,0.55)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Link to="/app/checkout?plano=exclusivo&periodo=mensal"
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)",
                    boxShadow: "0 0 24px rgba(236,72,153,0.40)" }}>
                  Ver Plano Exclusivo <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutAuthenticated>
  );
}
