import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Crown, ChevronLeft, ChevronRight, Eye, ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { GaleriaLayoutProps, Pack } from "./types";

// ── Partículas flutuantes ─────────────────────────────────────────
interface Particle { id: number; x: number; y: number; size: number; delay: number; duration: number; color: string; }
function genParticles(n: number): Particle[] {
  const colors = ["#ec4899","#a855f7","#f472b6","#c084fc","#e879f9","#f9a8d4"];
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 5,
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 5,
    color: colors[i % colors.length],
  }));
}
const PARTICLES = genParticles(14);

// ── Skeleton ──────────────────────────────────────────────────────
function PackSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={wide ? "col-span-2" : ""}
      style={{
        background: "rgba(236,72,153,0.06)",
        borderRadius: "16px",
        border: "1px solid rgba(236,72,153,0.10)",
        overflow: "hidden",
        animation: "pulse 1.8s ease-in-out infinite",
      }}
    >
      <div style={{ aspectRatio: wide ? "2/1" : "3/4", background: "rgba(236,72,153,0.08)" }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 14, borderRadius: 6, background: "rgba(236,72,153,0.12)", width: "70%" }} />
        <div style={{ height: 10, borderRadius: 6, background: "rgba(236,72,153,0.08)", width: "45%" }} />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────
function PackCardExclusivo({ pack, wide = false }: { pack: Pack; wide?: boolean }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  return (
    <div
      className={wide ? "col-span-2" : ""}
      onClick={() => navigate(`/app/galeria/${pack.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hov ? "rgba(236,72,153,0.50)" : "rgba(236,72,153,0.15)"}`,
        background: "rgba(20,4,30,0.85)",
        boxShadow: hov
          ? "0 0 30px rgba(236,72,153,0.35), 0 8px 30px rgba(0,0,0,0.6)"
          : "0 4px 20px rgba(0,0,0,0.4)",
        transform: hov ? "scale(1.02)" : "scale(1)",
        transition: "all 0.28s cubic-bezier(0.34,1.3,0.64,1)",
        position: "relative",
      }}
    >
      {/* thumbnail */}
      <div style={{ position: "relative", aspectRatio: wide ? "2/1" : "3/4", overflow: "hidden" }}>
        {pack.thumbnail_url ? (
          <img
            src={pack.thumbnail_url}
            alt={pack.titulo}
            style={{ width: "100%", height: "100%", objectFit: "cover",
              transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s ease" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%",
            background: "linear-gradient(135deg,rgba(236,72,153,0.15),rgba(147,51,234,0.15))",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={32} style={{ color: "rgba(236,72,153,0.35)" }} />
          </div>
        )}
        {/* hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top,rgba(236,72,153,0.75) 0%,rgba(147,51,234,0.40) 50%,transparent 100%)",
          opacity: hov ? 1 : 0, transition: "opacity 0.28s ease",
          display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 16,
        }}>
          <span style={{
            padding: "8px 22px", borderRadius: "100px", fontWeight: 800,
            fontSize: "0.8rem", letterSpacing: "0.12em", color: "#fff",
            background: "rgba(0,0,0,0.45)",
            boxShadow: "0 0 18px rgba(236,72,153,0.70)",
          }}>VER PACK</span>
        </div>
        {/* etiqueta */}
        {pack.etiqueta && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            padding: "3px 10px", borderRadius: "100px",
            background: "rgba(236,72,153,0.85)",
            fontSize: "0.65rem", fontWeight: 700, color: "#fff",
            letterSpacing: "0.06em",
          }}>{pack.etiqueta}</div>
        )}
        {/* EXCLUSIVO badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          padding: "3px 10px", borderRadius: "100px",
          background: "linear-gradient(90deg,#ec4899,#a855f7)",
          fontSize: "0.60rem", fontWeight: 800, color: "#fff",
          letterSpacing: "0.10em",
          animation: "exBadgePulse 2.4s ease-in-out infinite",
          boxShadow: "0 0 10px rgba(236,72,153,0.55)",
        }}>✦ EXCLUSIVO</div>
      </div>
      {/* info */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pack.titulo}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.72rem", color: "rgba(236,72,153,0.75)", display: "flex", alignItems: "center", gap: 3 }}>
            <ImageIcon size={10} /> {pack.fotos_count} fotos
          </span>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}>
            <Eye size={10} /> {pack.views.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Carrossel Destaque ────────────────────────────────────────────
function DestaqueCarrossel({ packs }: { packs: Pack[] }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hovering, setHovering] = useState(false);

  const scroll = useCallback((dir: 1 | -1) => {
    if (!ref.current) return;
    const cardW = ref.current.querySelector("div")?.offsetWidth ?? 240;
    ref.current.scrollBy({ left: dir * (cardW + 16), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (hovering) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => scroll(1), 3200);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hovering, scroll]);

  if (!packs.length) return null;
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      {/* arrows */}
      {[{dir: -1 as const, label: "prev", style: { left: 0 }}, {dir: 1 as const, label: "next", style: { right: 0 }}].map(({dir, label, style}) => (
        <button key={label} onClick={() => scroll(dir)} style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 10,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(236,72,153,0.20)",
          border: "1px solid rgba(236,72,153,0.35)",
          color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", ...style,
        }}>
          {dir === -1 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      ))}
      <div ref={ref} style={{
        display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory",
        paddingBottom: 4, paddingLeft: 4, paddingRight: 4,
        scrollbarWidth: "none",
      }}>
        {packs.map(p => (
          <div key={p.id} onClick={() => navigate(`/app/galeria/${p.id}`)}
            style={{
              flexShrink: 0, width: 200, scrollSnapAlign: "start",
              borderRadius: 14, overflow: "hidden", cursor: "pointer",
              border: "1px solid rgba(236,72,153,0.20)",
              background: "rgba(20,4,30,0.80)",
              transition: "transform 0.25s, box-shadow 0.25s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(236,72,153,0.40)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
              {p.thumbnail_url
                ? <img src={p.thumbnail_url} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "rgba(236,72,153,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon size={24} style={{ color: "rgba(236,72,153,0.35)" }} /></div>
              }
            </div>
            <div style={{ padding: "10px 12px" }}>
              <p style={{ fontWeight: 700, fontSize: "0.78rem", color: "#fff",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.titulo}</p>
              <p style={{ fontSize: "0.68rem", color: "rgba(236,72,153,0.70)", marginTop: 2 }}>{p.fotos_count} fotos</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Upgrade card → Raro ───────────────────────────────────────────
function UpgradeRaroCard({ previews }: { previews: string[] }) {
  const navigate = useNavigate();
  return (
    <div style={{
      borderRadius: 20, overflow: "hidden",
      border: "1px solid rgba(251,191,36,0.30)",
      background: "linear-gradient(135deg,rgba(30,15,5,0.95) 0%,rgba(20,10,2,0.95) 100%)",
      boxShadow: "0 0 60px rgba(251,191,36,0.12)",
      padding: "28px 24px",
      display: "flex", flexDirection: "column", gap: 16,
      alignItems: "center", textAlign: "center",
    }}>
      <Crown size={32} style={{ color: "#fbbf24", filter: "drop-shadow(0 0 10px rgba(251,191,36,0.65))" }} />
      <div>
        <p style={{
          fontWeight: 900, fontSize: "1.1rem",
          background: "linear-gradient(90deg,#fbbf24,#f59e0b,#fbbf24)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Nível RARO disponível</p>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.50)", marginTop: 6, lineHeight: 1.5 }}>
          O conteúdo mais exclusivo da plataforma.<br />
          Acesso a modelos que não aparecem em mais lado nenhum.
        </p>
      </div>
      {/* blurred preview tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, width: "100%" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            aspectRatio: "3/4", borderRadius: 10, overflow: "hidden",
            background: `linear-gradient(135deg,rgba(251,191,36,${0.10+(i+1)*0.03}),rgba(245,158,11,0.08))`,
            border: "1px solid rgba(251,191,36,0.18)",
            position: "relative",
          }}>
            {previews[i] && (
              <img
                src={previews[i]}
                alt=""
                aria-hidden="true"
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%", objectFit: "cover",
                  filter: "blur(12px) brightness(0.4)", transform: "scale(1.05)",
                  pointerEvents: "none",
                }}
              />
            )}
            <div style={{
              position: "absolute", inset: 0,
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock size={18} style={{ color: "rgba(251,191,36,0.55)" }} />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate("/app/galeria?upgrade=true")}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12,
          background: "linear-gradient(90deg,#d97706,#fbbf24,#d97706)",
          fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.1em",
          color: "#1a0a00", border: "none", cursor: "pointer",
          boxShadow: "0 0 30px rgba(251,191,36,0.40)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 50px rgba(251,191,36,0.60)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(251,191,36,0.40)"; }}
      >
        UPGRADE PARA RARO →
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function GaleriaExclusivoLayout({ packs, packsLoading, planoUser, nivelUser }: GaleriaLayoutProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recente" | "popular" | "az">("recente");
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

  const destaquePacks = packs.filter(p => p.destaque).slice(0, 8);

  const filtered = packs
    .filter(p => p.titulo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "popular") return b.views - a.views;
      if (sort === "az") return a.titulo.localeCompare(b.titulo);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const PLANS = [
    { key: "normal",    label: "NORMAL",    locked: false },
    { key: "exclusivo", label: "EXCLUSIVO", locked: false },
    { key: "raro",      label: "RARO",      locked: nivelUser < 3 },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0010", paddingBottom: 60 }}>

      {/* ── KEYFRAMES ────────────────────────────────────────────── */}
      <style>{`
        @keyframes floatParticle {
          0%,100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50%      { transform: translateY(-18px) scale(1.15); opacity: 1; }
        }
        @keyframes shimmerLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes badgeGlow {
          0%,100% { box-shadow: 0 0 10px rgba(236,72,153,0.50); }
          50%      { box-shadow: 0 0 24px rgba(236,72,153,0.90), 0 0 40px rgba(147,51,234,0.40); }
        }
        @keyframes exBadgePulse {
          0%,100% { opacity: 0.85; }
          50%      { opacity: 1; box-shadow: 0 0 16px rgba(236,72,153,0.80); }
        }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg,#160028 0%,#2a0050 50%,#100020 100%)",
        padding: "40px 20px 36px",
        borderBottom: "1px solid rgba(236,72,153,0.15)",
      }}>
        {/* partículas */}
        {PARTICLES.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: 0.65,
            pointerEvents: "none",
            filter: "blur(0.5px)",
            animation: `floatParticle ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          {/* badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 18px", borderRadius: "100px",
            background: "linear-gradient(90deg,rgba(236,72,153,0.20),rgba(147,51,234,0.20))",
            border: "1px solid rgba(236,72,153,0.40)",
            fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em",
            color: "#f9a8d4",
            animation: "badgeGlow 2.6s ease-in-out infinite",
            marginBottom: 14,
          }}>
            <Sparkles size={12} /> ✦ EXCLUSIVO ✦ <Sparkles size={12} />
          </div>

          <h1 style={{
            fontWeight: 900, fontSize: "clamp(1.6rem,4vw,2.6rem)", lineHeight: 1.1,
            background: "linear-gradient(90deg,#f9a8d4 0%,#ec4899 40%,#a855f7 70%,#f9a8d4 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 10,
          }}>
            Galeria Exclusiva
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(249,168,212,0.65)", marginBottom: 20 }}>
            Conteúdo que não encontras em mais lado nenhum
          </p>

          {/* shimmer line */}
          <div style={{ position: "relative", height: 2, maxWidth: 300, margin: "0 auto 20px",
            background: "rgba(236,72,153,0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0, width: "60%",
              background: "linear-gradient(90deg,transparent,rgba(236,72,153,0.90),transparent)",
              animation: "shimmerLine 2.2s linear infinite",
            }} />
          </div>

          {/* stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { label: "Packs exclusivos", value: packs.length },
              { label: "Fotos total", value: `+${packs.reduce((s, p) => s + p.fotos_count, 0).toLocaleString()}` },
              { label: "Em destaque", value: destaquePacks.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 800, fontSize: "1.3rem", color: "#ec4899" }}>{value}</p>
                <p style={{ fontSize: "0.70rem", color: "rgba(255,255,255,0.40)", marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NAV BAR ──────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(10,0,16,0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(236,72,153,0.12)",
        padding: "0 20px",
        display: "flex", justifyContent: "center",
      }}>
        <div style={{ display: "flex", gap: 4, maxWidth: 960, width: "100%", overflowX: "auto", scrollbarWidth: "none" }}>
          {PLANS.map(plan => {
            const active = plan.key === "exclusivo";
            return (
              <button key={plan.key}
                onClick={() => {
                  if (plan.locked) return;
                  if (plan.key === "normal") navigate("/app/galeria/normal");
                  if (plan.key === "raro") navigate("/app/galeria/raro");
                }}
                disabled={plan.locked}
                style={{
                  padding: "14px 22px", fontWeight: 800, fontSize: "0.75rem",
                  letterSpacing: "0.10em", cursor: plan.locked ? "not-allowed" : "pointer",
                  color: active ? "#ec4899" : plan.locked ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.45)",
                  background: "transparent", border: "none",
                  borderBottom: active ? "2px solid #ec4899" : "2px solid transparent",
                  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                {plan.locked && <Lock size={10} />}
                {plan.label}
                {plan.locked && <span style={{ fontSize: "0.62rem", color: "rgba(147,51,234,0.60)", fontWeight: 600 }}>Upgrade</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── EM DESTAQUE ─────────────────────────────────────────── */}
        {(packsLoading || destaquePacks.length > 0) && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Sparkles size={16} style={{ color: "#ec4899" }} />
              <h2 style={{ fontWeight: 800, fontSize: "0.95rem",
                background: "linear-gradient(90deg,#ec4899,#a855f7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Em Destaque
              </h2>
            </div>
            {packsLoading
              ? <div style={{ display: "flex", gap: 16, overflowX: "hidden" }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ flexShrink: 0, width: 200, aspectRatio: "3/4",
                    borderRadius: 14, background: "rgba(236,72,153,0.07)", animation: "pulse 1.8s ease-in-out infinite" }} />)}
                </div>
              : <DestaqueCarrossel packs={destaquePacks} />
            }
          </section>
        )}

        {/* ── SEARCH + SORT ────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Pesquisar packs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 180, padding: "10px 16px", borderRadius: 10,
              background: "rgba(236,72,153,0.06)",
              border: "1px solid rgba(236,72,153,0.18)",
              color: "#fff", fontSize: "0.85rem", outline: "none",
            }}
          />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(236,72,153,0.06)",
              border: "1px solid rgba(236,72,153,0.18)",
              color: "#fff", fontSize: "0.82rem", cursor: "pointer", outline: "none",
            }}>
            <option value="recente">Mais Recentes</option>
            <option value="popular">Mais Populares</option>
            <option value="az">A → Z</option>
          </select>
        </div>

        {/* ── GRID MASONRY ────────────────────────────────────────── */}
        <section>
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
            gap: 14 }}>
            {packsLoading
              ? Array.from({ length: 8 }, (_, i) => <PackSkeleton key={i} wide={i % 6 === 0 || i % 6 === 3} />)
              : filtered.length === 0
                ? (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>
                    <ImageIcon size={36} style={{ color: "rgba(236,72,153,0.20)", margin: "0 auto 12px" }} />
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Nenhum pack encontrado</p>
                  </div>
                )
                : filtered.map((p, i) => (
                  <PackCardExclusivo key={p.id} pack={p} wide={i % 6 === 0 || i % 6 === 3} />
                ))
            }
          </div>
        </section>

        {/* ── UPGRADE → RARO ──────────────────────────────────────── */}
        {nivelUser < 3 && <UpgradeRaroCard previews={upgradePreviews} />}
      </div>
    </div>
  );
}
