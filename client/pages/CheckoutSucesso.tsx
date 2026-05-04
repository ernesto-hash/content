// client/pages/CheckoutSucesso.tsx
// Página fullscreen de celebração pós-pagamento
// Activada via /app/checkout/sucesso (redireccionado de /app/galeria?success=true)

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, Sparkles, Lock, ImageIcon, Zap, Star } from "lucide-react";

// ─────────────────────────────────────────────
// Tipos e geração de confetti
// ─────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  isSquare: boolean;
}

function generateParticles(count: number): Particle[] {
  const colors = ["#ec4899", "#9333ea", "#fbbf24", "#f472b6", "#a855f7", "#fb923c", "#facc15", "#34d399"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 5 + Math.random() * 8,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 2.5,
    rotation: Math.random() * 360,
    isSquare: Math.random() > 0.5,
  }));
}

// ─────────────────────────────────────────────
// Hook: contador animado com easing
// ─────────────────────────────────────────────
function useCounter(target: number, durationMs: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const startTime = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, target, durationMs]);
  return value;
}

// ─────────────────────────────────────────────
// Benefícios
// ─────────────────────────────────────────────
const BENEFITS = [
  { icon: ImageIcon, text: "+1.000 fotos exclusivas desbloqueadas", color: "#ec4899" },
  { icon: Zap,       text: "Acesso instantâneo a todos os packs",    color: "#9333ea" },
  { icon: Star,      text: "Novos conteúdos adicionados semanalmente", color: "#fbbf24" },
  { icon: Lock,      text: "Conteúdo que não encontras em mais lado", color: "#34d399" },
];

const COUNTDOWN_TOTAL = 8;

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function CheckoutSucesso() {
  const navigate   = useNavigate();
  const [animIn, setAnimIn]       = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL);

  const particles = useMemo(() => generateParticles(44), []);
  const counter   = useCounter(1247, 2200, animIn);

  // Entrada
  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Countdown — decrementa 1 por segundo
  useEffect(() => {
    if (!animIn) return;
    const timer = setInterval(() => {
      setCountdown(c => Math.max(c - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [animIn]);

  // Redirect quando countdown chega a 0
  useEffect(() => {
    if (countdown === 0) {
      navigate("/app/galeria?from=sucesso", { replace: true });
    }
  }, [countdown, navigate]);

  const progress = ((COUNTDOWN_TOTAL - countdown) / COUNTDOWN_TOTAL) * 100;

  return (
    <>
      <div
        style={{
          position:       "relative",
          height:         "100vh",
          overflow:       "hidden",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "0 16px",
          background:     "linear-gradient(160deg,#080010 0%,#14002e 45%,#080018 100%)",
        }}
      >
        {/* ── Confetti ─────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              style={{
                position:        "absolute",
                left:            `${p.x}%`,
                top:             "-12px",
                width:           `${p.size}px`,
                height:          `${p.size}px`,
                backgroundColor: p.color,
                borderRadius:    p.isSquare ? "2px" : "50%",
                transform:       `rotate(${p.rotation}deg)`,
                opacity:         0.85,
                willChange:      "transform",
                animation:       `confettiFall ${p.duration}s ${p.delay}s linear infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Bokeh ────────────────────────────────────────────── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "8%", left: "12%",
            width: "350px", height: "350px",
            background: "radial-gradient(circle,rgba(236,72,153,0.13) 0%,transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "10%", right: "8%",
            width: "420px", height: "420px",
            background: "radial-gradient(circle,rgba(147,51,234,0.10) 0%,transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%", right: "20%",
            width: "200px", height: "200px",
            background: "radial-gradient(circle,rgba(251,191,36,0.07) 0%,transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* ── Conteúdo ─────────────────────────────────────────── */}
        <div
          className="relative z-10 w-full text-center"
          style={{
            maxWidth:      "520px",
            display:       "flex",
            flexDirection: "column",
            alignItems:    "center",
            gap:           "clamp(6px, 1.4vh, 14px)",
            opacity:       animIn ? 1 : 0,
            transform:     animIn ? "translateY(0)" : "translateY(28px)",
            transition:    "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Coroa animada */}
          <div style={{ width: "fit-content" }}>
            <div style={{ animation: "crownFloat 2.8s ease-in-out infinite", position: "relative" }}>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  background: "linear-gradient(135deg,#ec4899,#9333ea)",
                  boxShadow:  "0 0 40px rgba(236,72,153,0.55), 0 0 80px rgba(236,72,153,0.20)",
                }}
              >
                <Crown size={30} className="text-white" />
              </div>
              <div
                style={{
                  position:     "absolute",
                  inset:        "-8px",
                  borderRadius: "20px",
                  background:   "linear-gradient(135deg,#ec4899,#9333ea)",
                  opacity:      0.25,
                  filter:       "blur(14px)",
                  animation:    "glowPulse 2.8s ease-in-out infinite",
                  zIndex:       -1,
                }}
              />
            </div>
          </div>

          {/* Título */}
          <h1
            className="font-black leading-tight"
            style={{
              fontSize:             "clamp(1.4rem, 3.5vw, 2.2rem)",
              background:           "linear-gradient(90deg,#ec4899 0%,#a855f7 50%,#fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
            }}
          >
            Bem-vindo à<br />Galeria Exclusiva
          </h1>

          {/* Subtítulo */}
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Juntaste-te a{" "}
            <strong className="text-white">2.847 membros</strong>{" "}
            que têm acesso ao que mais ninguém vê
          </p>

          {/* Contador */}
          <div
            className="inline-flex items-center gap-3 px-5 rounded-2xl"
            style={{
              padding:    "clamp(8px,1.2vh,12px) 20px",
              background: "rgba(236,72,153,0.08)",
              border:     "1px solid rgba(236,72,153,0.25)",
            }}
          >
            <Sparkles size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
            <span
              className="text-base font-black"
              style={{
                background:           "linear-gradient(90deg,#ec4899,#fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
              }}
            >
              Desbloqueaste +{counter.toLocaleString()} fotos exclusivas
            </span>
          </div>

          {/* Benefícios */}
          <div className="w-full max-w-md" style={{ display: "flex", flexDirection: "column", gap: "clamp(4px,0.7vh,8px)" }}>
            {BENEFITS.map(({ icon: Icon, text, color }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 rounded-xl"
                style={{
                  padding:    "clamp(6px,0.9vh,10px) 12px",
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.08)",
                  opacity:    animIn ? 1 : 0,
                  transform:  animIn ? "translateX(0)" : "translateX(-18px)",
                  transition: `opacity 0.5s ease ${0.45 + i * 0.12}s, transform 0.5s ease ${0.45 + i * 0.12}s`,
                  textAlign:  "left",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20`, color }}
                >
                  <Icon size={13} />
                </div>
                <span className="text-xs font-semibold flex-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {text}
                </span>
                <Check size={11} style={{ color: "#34d399", flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/app/galeria?from=sucesso", { replace: true })}
            className="w-full max-w-md font-black text-white rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{
              padding:       "clamp(10px,1.6vh,16px) 40px",
              fontSize:      "1.05rem",
              letterSpacing: "0.05em",
              background:    "linear-gradient(90deg,#e91e8c 0%,#9333ea 100%)",
              boxShadow:     "0 0 40px rgba(233,30,140,0.45), 0 8px 30px rgba(0,0,0,0.5)",
              animation:     "ctaGlow 2.2s ease-in-out infinite",
            }}
          >
            ENTRAR NA GALERIA AGORA →
          </button>

          {/* Countdown */}
          <div className="w-full max-w-md space-y-1.5">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              A redirecionar em {countdown} segundo{countdown !== 1 ? "s" : ""}...
            </p>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${progress}%`,
                  background: "linear-gradient(90deg,#ec4899,#9333ea)",
                  transition: "width 1s linear",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframes ──────────────────────────────────────────── */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-16px) rotate(0deg);    opacity: 1; }
          80%  { opacity: 0.7; }
          100% { transform: translateY(100vh) rotate(680deg);  opacity: 0; }
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0)    scale(1);    }
          50%       { transform: translateY(-6px) scale(1.04); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.22; transform: scale(1);    }
          50%       { opacity: 0.45; transform: scale(1.12); }
        }
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(233,30,140,0.45), 0 8px 30px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 65px rgba(233,30,140,0.70), 0 8px 30px rgba(0,0,0,0.5); }
        }
      `}</style>
    </>
  );
}
