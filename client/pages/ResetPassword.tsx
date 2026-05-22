import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmPasswordReset } from "../services/auth";
import { supabase } from "../lib/supabaseClient";

// Supabase envia o token no URL. O SDK troca automaticamente e emite PASSWORD_RECOVERY.
type PageState = "loading" | "form" | "success" | "invalid";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabase JS v2: quando o utilizador clica no link de recuperação,
    // o SDK deteta o token no URL e emite PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("form");
      }
    });

    // Timeout de segurança: se nenhum evento chegar em 4s, o link é inválido.
    const fallback = setTimeout(() => {
      setPageState((prev) => (prev === "loading" ? "invalid" : prev));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.errors.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(password);
      setPageState("success");
    } catch (err: any) {
      setError(err.message ?? t("auth.errors.generic"));
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
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                  suck
                </span>
                <span className="text-foreground/40 mx-1">or</span>
                <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                  sex
                </span>
              </h1>
            </Link>
          </div>

          {/* A carregar */}
          {pageState === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <svg className="w-8 h-8 animate-spin text-neon-purple" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-foreground/50 text-sm">{t("auth.reset.verifying")}</p>
            </div>
          )}

          {/* Link inválido/expirado */}
          {pageState === "invalid" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold mb-1">{t("auth.reset.invalidTitle")}</p>
                <p className="text-foreground/50 text-sm max-w-xs">
                  {t("auth.reset.invalidBody")}
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all mt-2"
              >
                {t("auth.reset.requestNew")}
              </Link>
              <Link to="/login" className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors">
                {t("auth.backToLogin")}
              </Link>
            </div>
          )}

          {/* Formulário de nova senha */}
          {pageState === "form" && (
            <>
              <h2 className="text-lg font-black text-white mb-1 text-center">{t("auth.reset.formTitle")}</h2>
              <p className="text-foreground/50 text-sm text-center mb-5">
                {t("auth.reset.formSubtitle")}
              </p>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">
                    {t("auth.reset.formTitle")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.fields.passwordMinPlaceholder")}
                      className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all duration-300"
                      required
                      minLength={8}
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-neon-purple transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-red-400 mt-1">{t("auth.reset.passwordMin")}</p>
                  )}
                </div>

                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">
                    {t("auth.fields.confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder={t("auth.reset.confirmPlaceholder")}
                      className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all duration-300"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-neon-purple transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-xs text-red-400 mt-1">{t("auth.errors.passwordMismatch")}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t("auth.reset.loading")}
                    </span>
                  ) : (
                    t("auth.reset.submit")
                  )}
                </button>
              </form>
            </>
          )}

          {/* Sucesso */}
          {pageState === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold mb-1">{t("auth.reset.successTitle")}</p>
                <p className="text-foreground/50 text-sm max-w-xs">
                  {t("auth.reset.successBody")}
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all mt-2"
              >
                {t("auth.reset.goToLogin")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
