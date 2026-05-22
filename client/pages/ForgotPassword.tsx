import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { requestPasswordReset } from "../services/auth";
import { checkRateLimit } from "@/lib/rateLimiter";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Rate limiting — máximo 3 pedidos em 60 minutos
    const rl = checkRateLimit("reset_password");
    if (!rl.allowed) {
      setError(rl.message ?? t("auth.errors.tooManyAttempts"));
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      // Sempre mostra sucesso — não revelar se email existe na BD (anti-enumeration)
      setSent(true);
    } catch {
      // Mensagem genérica intencionalmente
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center safe-area py-8 bg-background">
      <div className="fixed top-20 left-10 w-72 h-72 bg-neon-purple/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-neon-pink/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />

        <div className="relative glass p-6 md:p-8 rounded-2xl">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">suck</span>
                <span className="text-foreground/40 mx-1">or</span>
                <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">sex</span>
              </h1>
            </Link>
            <h2 className="text-lg font-black text-white mb-1">{t("auth.forgot.title")}</h2>
            <p className="text-foreground/50 text-sm">
              {t("auth.forgot.subtitle")}
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold mb-1">{t("auth.forgot.sentTitle")}</p>
                <p className="text-foreground/50 text-sm max-w-xs">
                  {t("auth.forgot.sentBody")}
                </p>
              </div>
              <Link to="/login"
                className="inline-flex items-center gap-2 text-sm text-neon-purple hover:text-neon-pink transition-colors font-semibold mt-2">
                <ArrowLeft size={14} /> {t("auth.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                      required disabled={isLoading} autoFocus autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t("auth.forgot.loading")}
                    </span>
                  ) : t("auth.forgot.submit")}
                </button>
              </form>

              <p className="text-center text-foreground/50 text-xs mt-5">
                <Link to="/login"
                  className="inline-flex items-center gap-1 text-neon-purple hover:text-neon-pink font-semibold transition-colors">
                  <ArrowLeft size={12} /> {t("auth.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
