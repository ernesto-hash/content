import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Play,
  Grid,
  Menu,
  SlidersHorizontal,
  Search,
  ChevronDown,
  Zap,
  Users,
  Star,
  ThumbsUp
} from "lucide-react";

type ViewMode = "grid" | "list";
type RecommendationType = "para_voce" | "baseado_historico" | "seguindo" | "tendencias_similares";

export default function RecomendadosPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [recommendationType, setRecommendationType] =
    useState<RecommendationType>("para_voce");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setVideos(generateMockVideos());
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [recommendationType]);

  const generateMockVideos = () => {
    const reasons = [
      "Porque você assistiu vídeos de React",
      "Baseado nos seus likes",
      "Criador que você segue",
      "Conteúdo semelhante ao que você viu",
      "Popular entre pessoas como você"
    ];

    const authors = [
      { name: "Tech Flow", avatar: "https://i.pravatar.cc/150?u=11", verified: true },
      { name: "Dev Insight", avatar: "https://i.pravatar.cc/150?u=12", verified: true },
      { name: "Creative Lab", avatar: "https://i.pravatar.cc/150?u=13", verified: false },
    ];

    return Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      title: [
        "React moderno: padrões que você precisa conhecer",
        "Next.js para quem já domina React",
        "Como organizar projetos grandes em Frontend",
        "Tailwind avançado para interfaces profissionais",
        "Arquitetura limpa no Frontend",
        "TypeScript além do básico",
        "Performance no React: boas práticas",
        "Design Systems na prática",
        "Clean Code aplicado ao Frontend",
        "Como escalar aplicações Web"
      ][i],
      thumbnail: `https://picsum.photos/seed/reco${i}/320/180`,
      duration: `${Math.floor(Math.random() * 10 + 6)}:${Math.floor(Math.random() * 59)
        .toString()
        .padStart(2, "0")}`,
      views: `${(Math.random() * 1.8 + 0.3).toFixed(1)}M`,
      likes: `${Math.floor(Math.random() * 120 + 20)}K`,
      comments: `${Math.floor(Math.random() * 15 + 1)}K`,
      author: authors[i % authors.length],
      reason: reasons[i % reasons.length],
      affinity: Math.floor(Math.random() * 20 + 80), // %
    }));
  };

  const VideoCard = ({ video }: any) => (
    <Link
      to={`/video/${video.id}`}
      className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />

        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock size={10} /> {video.duration}
        </span>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition">
          <div className="w-14 h-14 rounded-full bg-neon-pink flex items-center justify-center">
            <Play size={28} fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Reason */}
        <span className="text-[11px] px-2 py-1 bg-neon-pink/10 text-neon-pink rounded-full inline-flex items-center gap-1">
          <Sparkles size={10} />
          {video.reason}
        </span>

        <h3 className="font-semibold line-clamp-2 group-hover:text-neon-pink transition">
          {video.title}
        </h3>

        <div className="flex items-center gap-2">
          <img
            src={video.author.avatar}
            className="w-6 h-6 rounded-full"
            alt={video.author.name}
          />
          <span className="text-xs text-foreground/70">
            {video.author.name}
          </span>
        </div>

        <div className="flex justify-between text-xs text-foreground/60">
          <span className="flex items-center gap-1">
            <Eye size={14} /> {video.views}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={14} /> {video.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} /> {video.comments}
          </span>
        </div>

        {/* Affinity */}
        <div className="flex items-center gap-2 text-xs">
          <ThumbsUp size={14} className="text-neon-pink" />
          <span className="text-foreground/70">
            {video.affinity}% de compatibilidade
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <Layout>
      <div className="max-container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-neon-pink/20 to-neon-purple/20">
                <Sparkles className="text-neon-pink" size={28} />
              </div>
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                Recomendados para você
              </span>
            </h1>
            <p className="text-foreground/60">
              Conteúdos escolhidos com base no seu perfil e interesses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar recomendados..."
                className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm w-64"
              />
            </div>

            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-neon-pink text-white"
                    : "text-foreground/60"
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-neon-pink text-white"
                    : "text-foreground/60"
                }`}
              >
                <Menu size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Recommendation Type */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "para_voce", label: "Para você" },
            { value: "baseado_historico", label: "Baseado no histórico" },
            { value: "seguindo", label: "Criadores que você segue" },
            { value: "tendencias_similares", label: "Tendências similares" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setRecommendationType(r.value as any)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                recommendationType === r.value
                  ? "bg-neon-pink text-white"
                  : "bg-white/5 text-foreground/60"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Videos */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos
                .filter(v =>
                  v.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
            </div>
          )}
        </section>

        {!loading && (
          <div className="flex justify-center pt-6">
            <button className="px-8 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-neon-pink/30 flex items-center gap-2">
              Ver mais recomendações
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}