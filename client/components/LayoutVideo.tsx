import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface LayoutVideoProps {
  children: React.ReactNode;
}

export default function LayoutVideo({ children }: LayoutVideoProps) {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId]       = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        supabase.from("profiles_public")
          .select("avatar_url")
          .eq("id", uid)
          .maybeSingle()
          .then(({ data: p }) => setAvatarUrl((p as any)?.avatar_url ?? null));
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000000" }}>
      {/* ── Header compacto 48px ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center"
        style={{
          height: 48,
          background: "rgba(0,0,0,0.90)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="w-full flex items-center justify-between px-4">
          {/* Esquerda: botão voltar + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-white/55 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <div className="w-px h-4 bg-white/12" />

            <Link to="/" className="flex items-center leading-none">
              <span
                className="text-base font-black"
                style={{
                  background: "linear-gradient(90deg,#ec4899,#8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                suck
              </span>
              <span className="text-white/25 mx-1 text-xs font-normal">or</span>
              <span
                className="text-base font-black"
                style={{
                  background: "linear-gradient(90deg,#8b5cf6,#3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                sex
              </span>
            </Link>
          </div>

          {/* Direita: ícone pesquisa + avatar */}
          <div className="flex items-center gap-3">
            <Link
              to="/videos"
              className="text-white/45 hover:text-white/80 transition-colors"
              aria-label="Pesquisar"
            >
              <Search size={17} />
            </Link>

            {userId ? (
              <Link to="/dashboard">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(139,92,246,0.15))" }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <User size={14} className="text-white/45" />
                  }
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 rounded-lg text-white/60 hover:text-white text-xs font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
