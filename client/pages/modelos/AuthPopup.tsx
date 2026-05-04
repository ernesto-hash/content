// src/pages/modelos/AuthPopup.tsx
// Pop-up de autenticação reutilizável em toda a pasta /modelos

import { Link } from "react-router-dom";
import { X, Bell, MessageCircle, Heart, Bookmark, Users, Share2 } from "lucide-react";

type Props = {
  action: string;
  onClose: () => void;
};

const CONFIG: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
  subscribe: { title: "Subscrever canal",    desc: "Subscreve este canal para receberes notificações de novos vídeos.",           icon: Bell          },
  message:   { title: "Enviar mensagem",     desc: "Cria uma conta para poderes enviar mensagens diretamente ao modelo.",         icon: MessageCircle },
  like:      { title: "Gostar do vídeo",     desc: "Faz login para gostar de vídeos e os encontrar mais tarde.",                  icon: Heart         },
  save:      { title: "Guardar vídeo",       desc: "Guarda os teus vídeos favoritos na tua lista pessoal.",                      icon: Bookmark      },
  share:     { title: "Partilhar",           desc: "Cria uma conta para partilhares conteúdo com amigos.",                       icon: Share2        },
  follow:    { title: "Seguir modelo",       desc: "Segue este modelo para seres notificado de novos conteúdos.",                 icon: Users         },
};

export default function AuthPopup({ action, onClose }: Props) {
  const cfg = CONFIG[action] ?? CONFIG.subscribe;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="relative max-w-sm w-full rounded-2xl border border-neon-pink/20 shadow-[0_0_60px_rgba(236,72,153,0.15)] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0830 0%, #200a18 60%, #0d0820 100%)" }}
      >
        {/* Brilho decorativo */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-neon-pink/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-neon-purple/8 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="relative p-7 text-center">
          {/* Ícone */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-lg shadow-neon-pink/25">
            <Icon size={26} className="text-white" />
          </div>

          <h3 className="text-xl font-black text-white mb-2">{cfg.title}</h3>
          <p className="text-white/45 text-sm leading-relaxed mb-7">{cfg.desc}</p>

          <div className="space-y-2.5">
            <Link
              to="/signup"
              onClick={onClose}
              className="block w-full py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold rounded-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] transition-all"
            >
              Criar conta grátis
            </Link>
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full py-3 bg-white/6 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Já tenho conta — entrar
            </Link>
            <button
              onClick={onClose}
              className="block w-full text-xs text-white/22 hover:text-white/50 transition-colors py-1"
            >
              Continuar a navegar sem conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}