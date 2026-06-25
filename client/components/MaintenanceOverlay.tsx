import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function MaintenanceOverlay() {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <style>{`
        @keyframes sos-maintenance-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes sos-maintenance-glow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("maintenance.ariaLabel", "Plataforma em manutenção")}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 28%, rgba(155,77,255,0.20) 0%, rgba(255,27,141,0.10) 38%, transparent 68%), #060608",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow orb */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "32%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(155,77,255,0.14) 0%, rgba(255,27,141,0.07) 45%, transparent 70%)",
            animation: "sos-maintenance-glow 3.5s ease-in-out infinite",
            pointerEvents: "none",
            filter: "blur(2px)",
          }}
        />

        {/* Card */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            padding: "2.5rem 2rem",
            maxWidth: 520,
            width: "90%",
            textAlign: "center",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(155,77,255,0.18)",
            borderRadius: "1.25rem",
            boxShadow:
              "0 0 0 1px rgba(255,27,141,0.06), 0 32px 80px rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Wordmark */}
          <div style={{ animation: "sos-maintenance-pulse 4s ease-in-out infinite" }}>
            <div
              style={{
                fontSize: "2.4rem",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              <span style={{ color: "#ff1b8d" }}>suck</span>
              <span style={{ color: "#5a5a68" }}>or</span>
              <span style={{ color: "#9b4dff" }}>sex</span>
            </div>
            <div
              style={{
                color: "#3e3e4a",
                fontSize: "0.6rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                marginTop: 5,
              }}
            >
              community
            </div>
          </div>

          {/* Gradient divider */}
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(155,77,255,0.7), rgba(255,27,141,0.7), transparent)",
            }}
          />

          {/* Title */}
          <h1
            style={{
              color: "#ffffff",
              fontSize: "1.65rem",
              fontWeight: 700,
              lineHeight: 1.25,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {t("maintenance.title", "Estamos a evoluir 🔥")}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: "#c4b5fd",
              fontSize: "1rem",
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {t(
              "maintenance.subtitle",
              "A plataforma está em manutenção enquanto preparamos algo muito maior.",
            )}
          </p>

          {/* Body */}
          <p
            style={{
              color: "#7a7490",
              fontSize: "0.875rem",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {t(
              "maintenance.body",
              "Estamos a melhorar a experiência, a velocidade e a qualidade de tudo o que vais ver a seguir. Volta em breve — vai valer a pena.",
            )}
          </p>

          {/* Footer */}
          <div
            style={{
              marginTop: 4,
              color: "#3a3a48",
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {t("maintenance.footer", "SuckOrSex • Voltamos já")}
          </div>
        </div>
      </div>
    </>
  );
}
