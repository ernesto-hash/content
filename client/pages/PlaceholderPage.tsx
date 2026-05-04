import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

interface PlaceholderPageProps {
  title: string;
  emoji: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  emoji,
  description,
}: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center safe-area py-20">
        {/* Background Effects */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-purple/20 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-neon-pink/20 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl">
          <div className="text-7xl md:text-8xl mb-6 animate-float">{emoji}</div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title}
          </h1>

          <p className="text-lg text-foreground/70 mb-8">
            {description}
          </p>

          <p className="text-foreground/60 mb-12 text-center">
            Esta página está em desenvolvimento. Continue explorando a plataforma
            ou envie feedback sobre quais funcionalidades você gostaria de ver
            primeiro.
          </p>

          {/* Glass Card with Info */}
          <div className="glass rounded-xl p-8 mb-8 border border-white/20">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Próximas melhorias:
            </h2>
            <ul className="space-y-3 text-foreground/70 text-left">
              <li className="flex items-start gap-3">
                <span className="text-neon-purple text-xl leading-none mt-0.5">
                  ✓
                </span>
                <span>Interface intuitiva e responsiva</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neon-purple text-xl leading-none mt-0.5">
                  ✓
                </span>
                <span>Filtros avançados e busca inteligente</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neon-purple text-xl leading-none mt-0.5">
                  ✓
                </span>
                <span>Sistema de recomendações personalizado</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neon-purple text-xl leading-none mt-0.5">
                  ✓
                </span>
                <span>Qualidade 4K/60fps ultra HD</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-neon px-8 py-3 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Voltar à Página Inicial
              <ArrowRight size={18} />
            </Link>
            <a
              href="#"
              className="px-8 py-3 rounded-lg glass text-foreground border-2 border-white/20 hover:border-neon-purple/50 transition-all duration-300 w-full sm:w-auto"
            >
              Enviar Feedback
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
