import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, User, Eye, EyeOff, AlertCircle,
  MonitorPlay, Video, ArrowLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { register, loginWithGoogle } from "../services/auth";
import { createProfile } from "../services/profiles";
import { checkRateLimit } from "@/lib/rateLimiter";

type AccountType = "user" | "creator";

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step,         setStep]         = useState<"select" | "form">("select");
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);

  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [isLoading,     setIsLoading]     = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [ageConfirmed,  setAgeConfirmed]  = useState(false);
  const [error,         setError]         = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
      return;
    }
    if (!agreedToTerms) {
      setError(t("auth.errors.mustAcceptTerms"));
      return;
    }
    if (!ageConfirmed) {
      setError(t("auth.errors.mustConfirmAge"));
      return;
    }
    if (formData.password.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    const rl = checkRateLimit("signup");
    if (!rl.allowed) {
      setError(rl.message ?? t("auth.errors.tooManyAttempts"));
      return;
    }

    setIsLoading(true);

    try {
      const username =
        formData.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") +
        Math.floor(Math.random() * 9000 + 1000);

      const { user } = await register(formData.name, formData.email, formData.password);

      if (user?.id) {
        await createProfile({
          userId:    user.id,
          username,
          full_name: formData.name,
          role:      selectedRole ?? "user",
        });
      }

      alert(t("auth.signup.successAlert"));
      navigate("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.errors.generic");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength =
    formData.password.length === 0 ? "" :
    formData.password.length >= 12 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password) ? "Forte" :
    formData.password.length >= 8  && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? "Médio" : "Fraco";

  const strengthColor =
    passwordStrength === "Forte" ? "text-green-400" :
    passwordStrength === "Médio" ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen flex items-center justify-center safe-area py-8 bg-background">
      <div className="fixed top-20 left-10 w-72 h-72 bg-neon-purple/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-neon-pink/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />

        <div className="relative glass p-6 md:p-8 rounded-2xl">

          {/* Logo — always visible */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">suck</span>
                <span className="text-foreground/40 mx-1">or</span>
                <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">sex</span>
              </h1>
            </Link>
          </div>

          {/* ── Step 1: Account type selection ───────────────────────────── */}
          {step === "select" && (
            <>
              <p className="text-center text-foreground/60 text-sm mb-5">
                {t("auth.signup.howToUse")}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">

                {/* Viewer card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("user")}
                  className={[
                    "w-full text-left rounded-xl border-2 p-4 transition-all duration-200",
                    selectedRole === "user"
                      ? "border-neon-purple bg-neon-purple/10 shadow-[0_0_18px_rgba(139,92,246,0.25)]"
                      : "border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <MonitorPlay
                    className={`w-7 h-7 mb-3 transition-colors ${
                      selectedRole === "user" ? "text-neon-purple" : "text-foreground/40"
                    }`}
                  />
                  <p className="font-bold text-sm text-foreground leading-tight">
                    {t("auth.signup.viewer.title")}
                  </p>
                  <p className="text-[10px] text-foreground/45 mt-1.5 leading-snug">
                    {t("auth.signup.viewer.desc")}
                  </p>
                  {selectedRole === "user" && (
                    <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-neon-purple bg-neon-purple/15 px-2 py-0.5 rounded-full">
                      {t("auth.signup.selected")}
                    </span>
                  )}
                </button>

                {/* Creator card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("creator")}
                  className={[
                    "w-full text-left rounded-xl border-2 p-4 transition-all duration-200",
                    selectedRole === "creator"
                      ? "border-neon-pink bg-neon-pink/10 shadow-[0_0_18px_rgba(236,72,153,0.25)]"
                      : "border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <Video
                    className={`w-7 h-7 mb-3 transition-colors ${
                      selectedRole === "creator" ? "text-neon-pink" : "text-foreground/40"
                    }`}
                  />
                  <p className="font-bold text-sm text-foreground leading-tight">
                    {t("auth.signup.creator.title")}
                  </p>
                  <p className="text-[10px] text-foreground/45 mt-1.5 leading-snug">
                    {t("auth.signup.creator.desc")}
                  </p>
                  {selectedRole === "creator" && (
                    <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-neon-pink bg-neon-pink/15 px-2 py-0.5 rounded-full">
                      {t("auth.signup.selected")}
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={!selectedRole}
                className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("auth.signup.continueBtn")}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-gradient-to-b from-background to-background text-foreground/60">{t("auth.divider")}</span>
                </div>
              </div>

              <button type="button" onClick={() => loginWithGoogle()}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-lg glass border border-white/20 hover:border-white/40 text-foreground transition-all text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>
              <p className="text-center text-foreground/30 text-[10px] mt-1.5">
                {t("auth.signup.googleNote")}
              </p>

              <p className="text-center text-foreground/60 text-xs mt-4">
                {t("auth.signup.hasAccount")}{" "}
                <Link to="/login" className="text-neon-purple hover:text-neon-pink font-semibold transition-colors">{t("auth.login.submit")}</Link>
              </p>
            </>
          )}

          {/* ── Step 2: Registration form ─────────────────────────────────── */}
          {step === "form" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => { setStep("select"); setError(""); }}
                  className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t("auth.signup.changeType")}
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedRole === "creator"
                    ? "text-neon-pink bg-neon-pink/15"
                    : "text-neon-purple bg-neon-purple/15"
                }`}>
                  {selectedRole === "creator" ? t("auth.signup.roleCreator") : t("auth.signup.roleViewer")}
                </span>
              </div>

              <p className="text-center text-foreground/60 text-sm mb-4">{t("auth.signup.formTitle")}</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Nome */}
                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">{t("auth.fields.fullName")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder={t("auth.fields.namePlaceholder")}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                      required disabled={isLoading} autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                      required disabled={isLoading} autoComplete="email"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">{t("auth.fields.password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"} name="password"
                      value={formData.password} onChange={handleChange}
                      placeholder={t("auth.fields.passwordMinPlaceholder")}
                      className="w-full pl-9 pr-8 py-2 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                      required disabled={isLoading} autoComplete="new-password" minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-neon-purple transition-colors"
                      disabled={isLoading} aria-label="Alternar visibilidade da senha">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordStrength && (
                    <p className={`text-[10px] mt-1 ${strengthColor}`}>
                      {t("auth.password.strength", {
                        level: passwordStrength === "Forte" ? t("auth.password.strong")
                          : passwordStrength === "Médio" ? t("auth.password.medium")
                          : t("auth.password.weak"),
                      })}
                    </p>
                  )}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-foreground text-xs font-semibold mb-1">{t("auth.fields.confirmPassword")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                      value={formData.confirmPassword} onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                      required disabled={isLoading} autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-neon-purple transition-colors"
                      disabled={isLoading} aria-label="Alternar visibilidade">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Termos */}
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="terms" checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 rounded bg-white/10 border border-white/20 cursor-pointer accent-neon-purple flex-shrink-0"
                    disabled={isLoading} />
                  <label htmlFor="terms" className="text-foreground/60 text-[11px] cursor-pointer leading-tight">
                    {t("auth.signup.agreeTermsPrefix")}{" "}
                    <Link to="/terms" className="text-neon-purple hover:text-neon-pink transition-colors">{t("auth.signup.termsLink")}</Link>
                    {" "}{t("auth.signup.andText")}{" "}
                    <Link to="/privacycookies" className="text-neon-purple hover:text-neon-pink transition-colors">{t("auth.signup.privacyLink")}</Link>
                  </label>
                </div>

                {/* Idade */}
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="age" checked={ageConfirmed}
                    onChange={e => setAgeConfirmed(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 rounded bg-white/10 border border-white/20 cursor-pointer accent-neon-purple flex-shrink-0"
                    disabled={isLoading} />
                  <label htmlFor="age" className="text-foreground/60 text-[11px] cursor-pointer leading-tight">
                    {t("auth.signup.ageConfirm")}
                  </label>
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t("auth.signup.loading")}
                    </span>
                  ) : t("auth.signup.submit")}
                </button>
              </form>

              <p className="text-center text-foreground/60 text-xs mt-4">
                {t("auth.signup.hasAccount")}{" "}
                <Link to="/login" className="text-neon-purple hover:text-neon-pink font-semibold transition-colors">{t("auth.login.submit")}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
