import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { login, loginWithGoogle } from "../services/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimiter";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Rate limiting — bloqueia após 5 tentativas em 15 minutos
    const rl = checkRateLimit("login");
    if (!rl.allowed) {
      setError(rl.message ?? "Demasiadas tentativas. Tenta mais tarde.");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Reset counter após login bem-sucedido
      resetRateLimit("login");
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar. Tenta novamente.";
      // Mensagem genérica para não revelar se email existe
      setError("Email ou senha incorretos.");
      console.error("[Login]", msg);
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
          <div className="text-center mb-4">
            <Link to="/" className="inline-block">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">suck</span>
                <span className="text-foreground/40 mx-1">or</span>
                <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">sex</span>
              </h1>
            </Link>
            <p className="text-foreground/60 text-sm mt-1">Bem-vindo de volta</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-foreground text-xs font-semibold mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all duration-300"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground text-xs font-semibold mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/50 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-8 py-2 text-sm rounded-lg glass border border-white/20 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all duration-300"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-neon-purple transition-colors"
                  disabled={isLoading}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded bg-white/10 border border-white/20 cursor-pointer accent-neon-purple"
                  disabled={isLoading}
                />
                <span className="text-foreground/60 text-xs">Lembrar-me</span>
              </label>
              <Link to="/forgot-password" className="text-neon-purple hover:text-neon-pink transition-colors text-xs font-semibold">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gradient-to-b from-background to-background text-foreground/60">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-1 py-2 rounded-lg glass border border-white/20 hover:border-white/40 text-foreground transition-all duration-300 text-sm"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Google</span>
          </button>

          <p className="text-center text-foreground/60 text-xs mt-4">
            Não tem conta?{" "}
            <Link to="/signup" className="text-neon-purple hover:text-neon-pink font-semibold transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
