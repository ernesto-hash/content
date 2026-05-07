import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ChevronLeft, ChevronRight, Eye, ImageIcon, Star } from "lucide-react";
import type { GaleriaLayoutProps, Pack } from "./types";

// ── Skeleton ──────────────────────────────────────────────────────
function PackSkeleton({ span = 1 }: { span?: 1 | 2 | 4 }) {
  return (
    <div
      style={{
        gridColumn: span > 1 ? `span ${span}` : undefined,
        background: "rgba(251,191,36,0.06)",
        borderRadius: "16px",
        border: "1px solid rgba(251,191,36,0.10)",
        overflow: "hidden",
        animation: "pulse 1.8s ease-in-out infinite",
      }}
    >
      <div style={{ aspectRatio: span === 4 ? "21/9" : span === 2 ? "4/3" : "3/4",
        background: "rgba(251,191,36,0.08)" }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 14, borderRadius: 6, background: "rgba(251,191,36,0.12)", width: "70%" }} />
        <div style={{ height: 10, borderRadius: 6, background: "rgba(251,191,36,0.08)", width: "45%" }} />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────
function PackCardRaro({ pack, span = 1 }: { pack: Pack; span?: 1 | 2 | 4 }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const ar = span === 4 ? "21/9" : span === 2 ? "4/3" : "3/4";
  return (
    <div
      style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}
      onClick={() => navigate(`/app/galeria/${pack.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        borderRadius: "16px", overflow: "hidden", cursor: "pointer",
        border: `1px solid ${hov ? "rgba(251,191,36,0.55)" : "rgba(251,191,36,0.18)"}`,
        background: "rgba(15,8,0,0.90)",
        boxShadow: hov
          ? "0 0 35px rgba(251,191,36,0.40), 0 8px 30px rgba(0,0,0,0.7)"
          : "0 4px 20px rgba(0,0,0,0.5)",
        transform: hov ? "scale(1.02)" : "scale(1)",
        transition: "all 0.28s cubic-bezier(0.34,1.3,0.64,1)",
        position: "relative",
      }}>
        {/* thumbnail */}
        <div style={{ position: "relative", aspectRatio: ar, overflow: "hidden" }}>
          {pack.thumbnail_url ? (
            <img src={pack.thumbnail_url} alt={pack.titulo}
              style={{ width: "100%", height: "100%", objectFit: "cover",
                transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s ease" }} />
          ) : (
            <div style={{ width: "100%", height: "100%",
              background: "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.08))",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={span === 4 ? 48 : 32} style={{ color: "rgba(251,191,36,0.30)" }} />
            </div>
          )}
          {/* hover overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top,rgba(180,120,0,0.75) 0%,rgba(251,191,36,0.30) 50%,transparent 100%)",
            opacity: hov ? 1 : 0, transition: "opacity 0.28s ease",
            display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 16,
          }}>
            <span style={{
              padding: "8px 22px", borderRadius: "100px", fontWeight: 800,
              fontSize: "0.8rem", letterSpacing: "0.12em", color: "#1a0a00",
              background: "linear-gradient(90deg,#fbbf24,#f59e0b)",
              boxShadow: "0 0 18px rgba(251,191,36,0.70)",
            }}>VER PACK</span>
          </div>
          {/* etiqueta */}
          {pack.etiqueta && (
            <div style={{
              position: "absolute", top: 10, left: 10,
              padding: "3px 10px", borderRadius: "100px",
              background: "rgba(180,120,0,0.85)",
              fontSize: "0.65rem", fontWeight: 700, color: "#fff",
              letterSpacing: "0.06em",
            }}>{pack.etiqueta}</div>
          )}
          {/* RARO badge */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "3px 10px", borderRadius: "100px",
            background: "linear-gradient(90deg,#d97706,#fbbf24)",
            fontSize: "0.60rem", fontWeight: 800, color: "#1a0a00",
            letterSpacing: "0.10em",
            animation: "raroPulse 2.4s ease-in-out infinite",
            boxShadow: "0 0 10px rgba(251,191,36,0.55)",
          }}>★ RARO</div>
        </div>
        {/* info */}
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontWeight: 700, fontSize: span === 4 ? "1rem" : "0.85rem", color: "#fff",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pack.titulo}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.72rem", color: "rgba(251,191,36,0.75)", display: "flex", alignItems: "center", gap: 3 }}>
              <ImageIcon size={10} /> {pack.fotos_count} fotos
            </span>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}>
              <Eye size={10} /> {pack.views.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carrossel "Os Mais Raros" ─────────────────────────────────────
function RaroCarrossel({ packs }: { packs: Pack[] }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hovering, setHovering] = useState(false);

  const scroll = useCallback((dir: 1 | -1) => {
    if (!ref.current) return;
    const cardW = ref.current.querySelector("div")?.offsetWidth ?? 220;
    ref.current.scrollBy({ left: dir * (cardW + 16), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (hovering) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => scroll(1), 3600);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hovering, scroll]);

  if (!packs.length) return null;
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      {[{dir: -1 as const, style: { left: 0 }}, {dir: 1 as const, style: { right: 0 }}].map(({dir, style}) => (
        <button key={dir} onClick={() => scroll(dir)} style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 10,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(251,191,36,0.15)",
          border: "1px solid rgba(251,191,36,0.35)",
          color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", ...style,
        }}>
          {dir === -1 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      ))}
      <div ref={ref} style={{
        display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory",
        paddingBottom: 4, paddingLeft: 4, paddingRight: 4, scrollbarWidth: "none",
      }}>
        {packs.map(p => (
          <div key={p.id} onClick={() => navigate(`/app/galeria/${p.id}`)}
            style={{
              flexShrink: 0, width: 220, scrollSnapAlign: "start",
              borderRadius: 14, overflow: "hidden", cursor: "pointer",
              border: "1px solid rgba(251,191,36,0.22)",
              background: "rgba(15,8,0,0.85)",
              transition: "transform 0.25s, box-shadow 0.25s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(251,191,36,0.40)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
              {p.thumbnail_url
                ? <img src={p.thumbnail_url} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "rgba(251,191,36,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon size={24} style={{ color: "rgba(251,191,36,0.30)" }} /></div>
              }
            </div>
            <div style={{ padding: "10px 12px" }}>
              <p style={{ fontWeight: 700, fontSize: "0.78rem", color: "#fff",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.titulo}</p>
              <p style={{ fontSize: "0.68rem", color: "rgba(251,191,36,0.70)", marginTop: 2 }}>{p.fotos_count} fotos</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function GaleriaRaroLayout({ packs, packsLoading, planoUser, nivelUser }: GaleriaLayoutProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recente" | "popular" | "az">("recente");

  const raroCarrossel = packs.filter(p => p.destaque).slice(0, 8);

  const sorted = packs
    .filter(p => p.titulo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "popular") return b.views - a.views;
      if (sort === "az") return a.titulo.localeCompare(b.titulo);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const PLANS = [
    { key: "normal",    label: "NORMAL",    locked: false },
    { key: "exclusivo", label: "EXCLUSIVO", locked: false },
    { key: "raro",      label: "RARO",      locked: false },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#080400", paddingBottom: 80 }}>

      {/* ── KEYFRAMES ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes auroraMove {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,-30px) scale(1.08); }
          66%  { transform: translate(-20px,20px) scale(0.96); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes goldShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes goldPulse {
          0%,100% { box-shadow: 0 0 12px rgba(251,191,36,0.55); }
          50%      { box-shadow: 0 0 28px rgba(251,191,36,0.95), 0 0 50px rgba(245,158,11,0.40); }
        }
        @keyframes raroPulse {
          0%,100% { opacity: 0.85; }
          50%      { opacity: 1; box-shadow: 0 0 16px rgba(251,191,36,0.80); }
        }
      `}</style>

      {/* ── HEADER: AURORA ─────────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg,#1a0c00 0%,#2d1800 45%,#100800 100%)",
        padding: "48px 20px 40px",
        borderBottom: "1px solid rgba(251,191,36,0.12)",
      }}>
        {/* aurora blobs */}
        {[
          { w: 420, h: 420, top: "-10%", left: "-8%",  color: "rgba(251,191,36,0.10)" },
          { w: 350, h: 350, top: "20%",  right: "-5%", color: "rgba(245,158,11,0.08)" },
          { w: 280, h: 280, bottom: "-20%", left: "35%", color: "rgba(252,211,77,0.07)" },
        ].map((b, i) => (
          <div key={i} style={{
            position: "absolute", width: b.w, height: b.h,
            top: b.top, left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            borderRadius: "50%",
            background: `radial-gradient(circle,${b.color} 0%,transparent 70%)`,
            filter: "blur(60px)",
            pointerEvents: "none",
            animation: `auroraMove ${14 + i * 4}s ${i * 2}s ease-in-out infinite`,
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          {/* badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 20px", borderRadius: "100px",
            background: "linear-gradient(90deg,rgba(251,191,36,0.15),rgba(245,158,11,0.15))",
            border: "1px solid rgba(251,191,36,0.40)",
            fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em",
            color: "#fbbf24",
            animation: "goldPulse 2.8s ease-in-out infinite",
            marginBottom: 16,
          }}>
            <Crown size={13} /> ★ RARO ★ <Crown size={13} />
          </div>

          {/* title gold shimmer */}
          <h1 style={{
            fontWeight: 900, fontSize: "clamp(1.8rem,4.5vw,3rem)", lineHeight: 1.1,
            background: "linear-gradient(90deg,#fbbf24 0%,#fffbeb 30%,#f59e0b 50%,#fef3c7 75%,#fbbf24 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "goldShimmer 3.5s linear infinite",
            marginBottom: 10,
          }}>
            Galeria Rara
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(251,191,36,0.55)", marginBottom: 24 }}>
            O patamar mais alto. Conteúdo que não existe em mais lado nenhum.
          </p>

          {/* gold shimmer line */}
          <div style={{ position: "relative", height: 2, maxWidth: 260, margin: "0 auto 24px",
            background: "rgba(251,191,36,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0, width: "60%",
              background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.90),transparent)",
              animation: "goldShimmer 2.0s linear infinite",
            }} />
          </div>

          {/* stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
            {[
              { label: "Packs raros", value: packs.length },
              { label: "Fotos exclusivas", value: `+${packs.reduce((s, p) => s + p.fotos_count, 0).toLocaleString()}` },
              { label: "Os mais raros", value: raroCarrossel.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 800, fontSize: "1.4rem", color: "#fbbf24" }}>{value}</p>
                <p style={{ fontSize: "0.70rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NAV BAR ────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,4,0,0.92)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(251,191,36,0.10)",
        padding: "0 20px", display: "flex", justifyContent: "center",
      }}>
        <div style={{ display: "flex", gap: 4, maxWidth: 960, width: "100%", overflowX: "auto", scrollbarWidth: "none" }}>
          {PLANS.map(plan => {
            const active = plan.key === "raro";
            return (
              <button key={plan.key}
                onClick={() => {
                  if (plan.key === "normal") navigate("/app/galeria/normal");
                  if (plan.key === "exclusivo") navigate("/app/galeria/exclusivo");
                }}
                style={{
                  padding: "14px 22px", fontWeight: 800, fontSize: "0.75rem",
                  letterSpacing: "0.10em", cursor: "pointer",
                  color: active ? "#fbbf24" : "rgba(255,255,255,0.40)",
                  background: "transparent", border: "none",
                  borderBottom: active ? "2px solid #fbbf24" : "2px solid transparent",
                  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                {active && <Star size={10} style={{ color: "#fbbf24" }} />}
                {plan.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── OS MAIS RAROS (carrossel) ──────────────────────────── */}
        {(packsLoading || raroCarrossel.length > 0) && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Crown size={16} style={{ color: "#fbbf24" }} />
              <h2 style={{ fontWeight: 800, fontSize: "0.95rem",
                background: "linear-gradient(90deg,#fbbf24,#f59e0b)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Os Mais Raros
              </h2>
            </div>
            {packsLoading
              ? <div style={{ display: "flex", gap: 16, overflowX: "hidden" }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ flexShrink: 0, width: 220, aspectRatio: "3/4",
                    borderRadius: 14, background: "rgba(251,191,36,0.07)", animation: "pulse 1.8s ease-in-out infinite" }} />)}
                </div>
              : <RaroCarrossel packs={raroCarrossel} />
            }
          </section>
        )}

        {/* ── SEARCH + SORT ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Pesquisar packs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 180, padding: "10px 16px", borderRadius: 10,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.18)",
              color: "#fff", fontSize: "0.85rem", outline: "none",
            }}
          />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.18)",
              color: "#fff", fontSize: "0.82rem", cursor: "pointer", outline: "none",
            }}>
            <option value="recente">Mais Recentes</option>
            <option value="popular">Mais Populares</option>
            <option value="az">A → Z</option>
          </select>
        </div>

        {/* ── GRID HERO ──────────────────────────────────────────── */}
        <section>
          {packsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              <PackSkeleton span={4} />
              <PackSkeleton span={2} />
              <PackSkeleton span={2} />
              {[1,2,3,4].map(i => <PackSkeleton key={i} />)}
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Crown size={36} style={{ color: "rgba(251,191,36,0.20)", margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Nenhum pack encontrado</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {sorted.map((p, i) => {
                // hero layout: 0 → full width, 1+2 → half, rest → normal
                if (i === 0) return <PackCardRaro key={p.id} pack={p} span={4} />;
                if (i === 1 || i === 2) return <PackCardRaro key={p.id} pack={p} span={2} />;
                return <PackCardRaro key={p.id} pack={p} span={1} />;
              })}
            </div>
          )}
        </section>

        {/* ── FOOTER RARO ───────────────────────────────────────── */}
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(251,191,36,0.25)",
          background: "linear-gradient(135deg,rgba(30,15,0,0.90),rgba(20,10,0,0.95))",
          padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 10,
          alignItems: "center", textAlign: "center",
        }}>
          <Crown size={28} style={{ color: "#fbbf24", filter: "drop-shadow(0 0 10px rgba(251,191,36,0.65))" }} />
          <p style={{
            fontWeight: 900, fontSize: "1rem",
            background: "linear-gradient(90deg,#fbbf24,#fffbeb,#f59e0b)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Estás no topo</p>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.40)", lineHeight: 1.5, maxWidth: 380 }}>
            Tens acesso ao nível mais exclusivo da plataforma. Novos conteúdos raros são adicionados regularmente.
          </p>
        </div>
      </div>
    </div>
  );
}
