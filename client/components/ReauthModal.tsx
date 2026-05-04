/**
 * ReauthModal.tsx — Modal de reautenticação para ações críticas
 *
 * Usar antes de:
 *   - Cancelar subscrição
 *   - Apagar conta
 *   - Alterar email
 *   - Alterar senha
 *   - Exportar dados pessoais
 *   - Operações financeiras sensíveis
 *
 * Verifica a senha no servidor via Supabase antes de prosseguir.
 *
 * Uso:
 *   const [showReauth, setShowReauth] = useState(false);
 *
 *   <ReauthModal
 *     open={showReauth}
 *     onClose={() => setShowReauth(false)}
 *     onSuccess={() => { setShowReauth(false); proceedWithSensitiveAction(); }}
 *     action="Cancelar subscrição"
 *   />
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, X, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { checkRateLimit } from "@/lib/rateLimiter";

interface ReauthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Descrição da ação sensível que requer reautenticação */
  action: string;
}

export default function ReauthModal({ open, onClose, onSuccess, action }: ReauthModalProps) {
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setShowPw(false);
      // Foca o input automaticamente
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Rate limiting para reauth — 5 tentativas em 10 minutos
    const rl = checkRateLimit("login");
    if (!rl.allowed) {
      setError(rl.message ?? "Demasiadas tentativas. Tenta mais tarde.");
      return;
    }

    setLoading(true);

    try {
      // Obtém o email do utilizador atual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        setError("Sessão inválida. Por favor, volta a entrar.");
        return;
      }

      // Reautentica com a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    userData.user.email,
        password: password,
      });

      if (signInError) {
        setError("Senha incorreta. Tenta novamente.");
        return;
      }

      // Sucesso — chama o callback
      onSuccess();
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-title"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0218 0%, #1a0830 100%)" }}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>

        <div className="p-7 space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
              <ShieldCheck size={22} className="text-neon-purple" />
            </div>
            <div>
              <h2 id="reauth-title" className="text-base font-black text-white">
                Confirma a tua identidade
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Para <strong className="text-white/70">{action}</strong>, precisamos
                confirmar a tua senha.
              </p>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-semibold mb-1.5">
                Senha atual
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-purple/40 w-4 h-4" />
                <input
                  ref={inputRef}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple/40 transition-all"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  disabled={loading}
                  aria-label="Alternar visibilidade"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/8 hover:text-white/70 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-black hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    A verificar...
                  </span>
                ) : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
