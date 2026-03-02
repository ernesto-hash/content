import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import {
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Play,
  Grid,
  Menu,
  TrendingUp,
  Star,
  Filter,
  SlidersHorizontal,
  Search,
  ChevronDown,
  Calendar,
  Zap,
  Award,
  Users,
  Sparkles
} from "lucide-react";

type ViewMode = "grid" | "list";
type TimeFilter = "hoje" | "semana" | "mes" | "ano" | "todos";
type CategoryFilter = "todos" | "tecnologia" | "musica" | "games" | "educacao" | "entretenimento";

export default function PopularesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("semana");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"views" | "likes" | "recent">("views");

  // Simular carregamento
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setVideos(generateMockVideos());
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeFilter, categoryFilter]);

  const generateMockVideos = () => {
    const categories = ["tecnologia", "musica", "games", "educacao", "entretenimento"];
    const authors = [
      { name: "Tech Flow", avatar: "https://i.pravatar.cc/150?u=1", verified: true },
      { name: "Dev Insight", avatar: "https://i.pravatar.cc/150?u=2", verified: true },
      { name: "Design Lab", avatar: "https://i.pravatar.cc/150?u=3", verified: false },
      { name: "Code Master", avatar: "https://i.pravatar.cc/150?u=4", verified: true },
      { name: "Creative Hub", avatar: "https://i.pravatar.cc/150?u=5", verified: false },
    ];

    return Array.from({ length: 12 }, (_, i) => ({
      id: `${i + 1}`,
      title: [
        "Como criar um app moderno em React com TailwindCSS",
        "Next.js 15 – Todas as novidades explicadas",
        "UI Design moderno: Tendências 2025",
        "TypeScript: Guia completo para iniciantes",
        "Desenvolvimento Full Stack do zero",
        "Node.js Avançado: Performance e Escalabilidade",
        "Python para Data Science: Tutorial completo",
        "Docker na prática: Containers para devs",
        "GraphQL vs REST: Qual escolher?",
        "Microserviços com Kubernetes",
        "CSS Moderno: Grid, Flexbox e mais",
        "Git Workflow: Como times profissionais usam"
      ][i % 12],
      thumbnail: `https://picsum.photos/seed/${i + 100}/320/180`,
      duration: `${Math.floor(Math.random() * 15 + 5)}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
      views: `${(Math.random() * 2.5 + 0.5).toFixed(1)}M`,
      likes: `${Math.floor(Math.random() * 150 + 30)}K`,
      comments: `${Math.floor(Math.random() * 20 + 2)}K`,
      author: authors[i % authors.length],
      trend: Math.random() > 0.7,
      category: categories[Math.floor(Math.random() * categories.length)],
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      ranking: i + 1
    }));
  };

  const VideoCard = ({ video, index }: any) => (
    <Link
      to={`/video/${video.id}`}
      className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition-all hover:shadow-lg hover:shadow-neon-pink/5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Duration */}
        <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
          <Clock size={10} /> {video.duration}
        </span>

        {/* Ranking Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className={`
            text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1
            ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900' :
              index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white' :
              'bg-black/50 backdrop-blur-sm text-white'}
          `}>
            {index === 0 && <Award size={12} />}
            #{index + 1}
          </span>
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-neon-pink/90 flex items-center justify-center transform group-hover:scale-110 transition">
            <Play className="text-white" size={28} fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Author */}
        <div className="flex items-center gap-2">
          <img
            src={video.author.avatar}
            alt={video.author.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-xs text-foreground/70 flex items-center gap-1">
            {video.author.name}
            {video.author.verified && (
              <div className="w-3 h-3 rounded-full bg-neon-pink/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
              </div>
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-neon-pink transition">
          {video.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-foreground/60">
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

        {/* Category Tag */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full text-foreground/50">
            {video.category}
          </span>
          {video.trend && (
            <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-neon-pink rounded-full flex items-center gap-1">
              <TrendingUp size={8} />
              Em alta
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  const VideoListItem = ({ video, index }: any) => (
    <Link
      to={`/video/${video.id}`}
      className="group flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative w-48 aspect-video overflow-hidden rounded-lg flex-shrink-0">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
          {video.duration}
        </span>
        <span className="absolute top-2 left-2 bg-neon-pink text-white text-xs font-bold px-2 py-1 rounded">
          #{index + 1}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 space-y-3">
        <h3 className="font-semibold text-lg group-hover:text-neon-pink transition">
          {video.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-foreground/60">
          <span className="flex items-center gap-1">
            <Eye size={16} /> {video.views} visualizações
          </span>
          <span className="flex items-center gap-1">
            <Heart size={16} /> {video.likes} likes
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={16} /> {video.comments} comentários
          </span>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={video.author.avatar}
            alt={video.author.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-foreground/70">{video.author.name}</span>
        </div>
      </div>
    </Link>
  );

  const SkeletonCard = () => (
    <div className="rounded-xl bg-white/5 border border-white/10 animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-neon-pink/20 to-neon-purple/20">
                <Flame className="text-neon-pink" size={28} />
            </div>
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                Vídeos Populares
            </span>
            </h1>
            <p className="text-foreground/60">
              Os vídeos mais assistidos e comentados do momento
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Buscar vídeos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-neon-pink/30 w-64"
              />
            </div>

            {/* View mode */}
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition ${
                  viewMode === "grid" 
                    ? "bg-neon-pink text-white" 
                    : "text-foreground/60 hover:text-neon-pink"
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition ${
                  viewMode === "list" 
                    ? "bg-neon-pink text-white" 
                    : "text-foreground/60 hover:text-neon-pink"
                }`}
              >
                <Menu size={16} />
              </button>
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition flex items-center gap-2 ${
                showFilters 
                  ? "bg-neon-pink text-white border-neon-pink" 
                  : "bg-white/5 border-white/10 text-foreground/60 hover:text-neon-pink"
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass p-6 rounded-xl space-y-6 animate-fadeIn">
            {/* Time Filter */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-neon-pink" />
                Período
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "hoje", label: "Hoje" },
                  { value: "semana", label: "Esta semana" },
                  { value: "mes", label: "Este mês" },
                  { value: "ano", label: "Este ano" },
                  { value: "todos", label: "Todos os tempos" }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTimeFilter(f.value as TimeFilter)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      timeFilter === f.value
                        ? "bg-neon-pink text-white"
                        : "bg-white/5 text-foreground/60 hover:text-neon-pink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-neon-pink" />
                Categoria
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "todos", label: "Todos" },
                  { value: "tecnologia", label: "Tecnologia" },
                  { value: "musica", label: "Música" },
                  { value: "games", label: "Games" },
                  { value: "educacao", label: "Educação" },
                  { value: "entretenimento", label: "Entretenimento" }
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategoryFilter(c.value as CategoryFilter)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      categoryFilter === c.value
                        ? "bg-neon-pink text-white"
                        : "bg-white/5 text-foreground/60 hover:text-neon-pink"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Zap size={16} className="text-neon-pink" />
                Ordernar por
              </h3>
              <div className="flex gap-2">
                {[
                  { value: "views", label: "Mais visualizações" },
                  { value: "likes", label: "Mais likes" },
                  { value: "recent", label: "Mais recentes" }
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      sortBy === s.value
                        ? "bg-neon-pink text-white"
                        : "bg-white/5 text-foreground/60 hover:text-neon-pink"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="flex items-center justify-between text-sm text-foreground/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users size={16} className="text-neon-pink" />
              <span className="font-medium text-foreground">12.5M</span> visualizações
            </span>
            <span className="flex items-center gap-1">
              <Heart size={16} className="text-neon-pink" />
              <span className="font-medium text-foreground">850K</span> likes
            </span>
          </div>
          <span>{videos.length} vídeos encontrados</span>
        </div>

        {/* Videos Grid/List */}
        <section>
          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            )
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos
                    .filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((video, index) => (
                      <VideoCard key={video.id} video={video} index={index} />
                    ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {videos
                    .filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((video, index) => (
                      <VideoListItem key={video.id} video={video} index={index} />
                    ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Load More Button */}
        {!loading && (
          <div className="flex justify-center pt-8">
            <button className="px-8 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground/80 hover:text-neon-pink hover:border-neon-pink/30 transition flex items-center gap-2">
              Carregar mais vídeos
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}