import { useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { 
  Play, 
  Heart, 
  Eye, 
  Star, 
  Clock, 
  TrendingUp, 
  Flame, 
  Sparkles, 
  ThumbsUp, 
  MessageCircle,
  Download,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  List,
  Maximize2,
  Volume2,
  VolumeX,
  PlayCircle,
  CheckCircle,
  Crown,
  Zap,
  Award,
  Film,
  Tv,
  Monitor,
  Smartphone,
  Globe,
  Flag,
  Users,
  Calendar,
  Hash,
  Video,
  Image,
  Mic,
  Camera,
  Music,
  Gamepad2,
  BookOpen,
  Gift,
  ShoppingBag,
  Shield,
  Wind,
  Sun,
  Moon,
  MapPin,
  Languages,
  Drama,
  Smile,
  Podcast,
  Headphones,
  User
} from "lucide-react";

export default function VideosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [selectedDuration, setSelectedDuration] = useState('todos');
  const [selectedQuality, setSelectedQuality] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);

  // Dados mockados para os vídeos
  const videos = {
    populares: [
      {
        id: 1,
        title: "Noite de Paixão com Modelo VIP",
        thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
        duration: "32:15",
        views: "1.2M",
        likes: "85K",
        rating: 4.9,
        author: "Luna Star",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        hd: true,
        quality: "4K",
        category: "Profissional",
        tags: ["vip", "exclusivo", "4k"],
        date: "2 dias atrás"
      },
      {
        id: 2,
        title: "Encontro Secreto - Versão Completa",
        thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
        duration: "45:20",
        views: "890K",
        likes: "67K",
        rating: 4.8,
        author: "Sofia Santos",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        hd: true,
        quality: "Full HD",
        category: "Casal",
        tags: ["romântico", "casal"],
        date: "5 dias atrás"
      },
      {
        id: 3,
        title: "Aventura Tropical com Amigas",
        thumbnail: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&h=600&fit=crop",
        duration: "28:45",
        views: "2.1M",
        likes: "156K",
        rating: 4.9,
        author: "Isabella & Friends",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        hd: true,
        quality: "4K",
        category: "Grupo",
        tags: ["grupo", "praia", "exclusivo"],
        date: "1 dia atrás"
      },
      {
        id: 4,
        title: "Momento Íntimo - Solo",
        thumbnail: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=600&fit=crop",
        duration: "18:30",
        views: "560K",
        likes: "42K",
        rating: 4.7,
        author: "Maya Rodriguez",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        hd: true,
        quality: "HD",
        category: "Solo",
        tags: ["solo", "íntimo"],
        date: "1 semana atrás"
      },
      {
        id: 5,
        title: "Lésbico - Paixão Proibida",
        thumbnail: "https://images.unsplash.com/photo-1548142813-c34835dfe326?w=400&h=600&fit=crop",
        duration: "38:50",
        views: "1.5M",
        likes: "98K",
        rating: 4.9,
        author: "Alice & Bia",
        authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        hd: true,
        quality: "Full HD",
        category: "Lésbico",
        tags: ["lésbico", "romântico"],
        date: "3 dias atrás"
      },
      {
        id: 6,
        title: "Encontro Surpresa no Escritório",
        thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
        duration: "42:15",
        views: "980K",
        likes: "71K",
        rating: 4.8,
        author: "Carol Lima",
        authorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        hd: true,
        quality: "4K",
        category: "Profissional",
        tags: ["escritório", "surpresa"],
        date: "4 dias atrás"
      }
    ],
    maisVistos: [
      {
        id: 7,
        title: "Festa Privada - Edição Especial",
        thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
        duration: "52:30",
        views: "3.2M",
        likes: "245K",
        rating: 4.9,
        author: "VIP Models",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        hd: true,
        quality: "4K",
        category: "Grupo",
        tags: ["festa", "vip", "exclusivo"],
        date: "1 semana atrás"
      },
      {
        id: 8,
        title: "Making Of - Bastidores",
        thumbnail: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&h=600&fit=crop",
        duration: "25:45",
        views: "2.8M",
        likes: "189K",
        rating: 4.8,
        author: "Studio X",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        hd: true,
        quality: "Full HD",
        category: "Bastidores",
        tags: ["makingof", "exclusivo"],
        date: "2 semanas atrás"
      }
    ],
    recomendados: [
      {
        id: 9,
        title: "Experiência Sensorial com ASMR",
        thumbnail: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=600&fit=crop",
        duration: "35:20",
        views: "450K",
        likes: "34K",
        rating: 4.7,
        author: "Sensual ASMR",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        hd: true,
        quality: "HD",
        category: "ASMR",
        tags: ["asmr", "sensorial"],
        date: "3 dias atrás"
      },
      {
        id: 10,
        title: "Cosplay Erótico - Personagem Famoso",
        thumbnail: "https://images.unsplash.com/photo-1548142813-c34835dfe326?w=400&h=600&fit=crop",
        duration: "42:10",
        views: "890K",
        likes: "67K",
        rating: 4.9,
        author: "NerdGirl Cosplay",
        authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        hd: true,
        quality: "4K",
        category: "Cosplay",
        tags: ["cosplay", "fantasia"],
        date: "2 dias atrás"
      }
    ]
  };

  const filters = [
    { id: 'todos', label: 'Todos', icon: Film },
    { id: 'populares', label: 'Populares', icon: Flame },
    { id: 'recentes', label: 'Recentes', icon: Sparkles },
    { id: 'tendencias', label: 'Tendências', icon: TrendingUp },
    { id: 'melhores', label: 'Melhores Avaliados', icon: Star },
    { id: 'maisVistos', label: 'Mais Vistos', icon: Eye },
  ];

  const durations = [
    { id: 'todos', label: 'Todos' },
    { id: 'curto', label: 'Até 10 min' },
    { id: 'medio', label: '10-30 min' },
    { id: 'longo', label: '30-60 min' },
    { id: 'extralongo', label: '60+ min' },
  ];

  const qualities = [
    { id: 'todos', label: 'Todos' },
    { id: '4k', label: '4K' },
    { id: 'fullhd', label: 'Full HD' },
    { id: 'hd', label: 'HD' },
    { id: 'sd', label: 'SD' },
  ];

  const categories = [
    { id: 'amador', name: 'Amador', icon: Camera, count: '2.5K' },
    { id: 'profissional', name: 'Profissional', icon: Film, count: '3.8K' },
    { id: 'casal', name: 'Casal', icon: Users, count: '4.2K' },
    { id: 'solo', name: 'Solo', icon: User, count: '1.9K' },
    { id: 'grupo', name: 'Grupo', icon: Users, count: '2.1K' },
    { id: 'lesbico', name: 'Lésbico', icon: Users, count: '3.4K' },
    { id: 'gay', name: 'Gay', icon: Users, count: '2.8K' },
    { id: 'trans', name: 'Trans', icon: Users, count: '1.5K' },
    { id: 'hentai', name: 'Hentai', icon: Gamepad2, count: '5.6K' },
    { id: 'anime', name: 'Anime', icon: Tv, count: '4.9K' },
    { id: 'cosplay', name: 'Cosplay', icon: Drama, count: '2.3K' },
    { id: 'asmr', name: 'ASMR', icon: Headphones, count: '1.2K' },
    { id: 'vr', name: 'VR', icon: Monitor, count: '890' },
    { id: 'ao-vivo', name: 'Ao Vivo', icon: Camera, count: '234' },
  ];

  const VideoCard = ({ video }: { video: any }) => (
    <Link to={`/video/${video.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-3">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Overlay com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button className="w-full py-2 bg-neon-pink text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-neon-pink/90 transition-colors">
              <Play size={16} />
              Assistir
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {video.vip && (
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Crown size={10} />
              VIP
            </span>
          )}
          {video.quality === '4K' && (
            <span className="bg-neon-blue text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Zap size={10} />
              4K
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg">
          {video.duration}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-neon-pink/90 flex items-center justify-center">
            <Play size={20} className="text-white ml-1" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors line-clamp-2 flex-1">
            {video.title}
          </h3>
          <button className="text-foreground/40 hover:text-neon-pink transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <img 
            src={video.authorAvatar} 
            alt={video.author}
            className="w-6 h-6 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm text-foreground/60">{video.author}</span>
              {video.verified && (
                <CheckCircle size={12} className="text-neon-blue" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-foreground/40">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {video.views}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} className="text-neon-pink" />
            {video.likes}
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} className="text-yellow-500" />
            {video.rating}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {video.tags.slice(0, 2).map((tag: string, index: number) => (
            <span key={index} className="text-xs px-2 py-1 bg-white/5 rounded-full text-foreground/40">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );

  const VideoListItem = ({ video }: { video: any }) => (
    <Link to={`/video/${video.id}`} className="group block">
      <div className="flex gap-4 bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors">
        <div className="relative w-48 aspect-[2/3]">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
          
          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg">
            {video.duration}
          </div>

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
            <div className="w-10 h-10 rounded-full bg-neon-pink/90 flex items-center justify-center">
              <Play size={16} className="text-white ml-1" />
            </div>
          </div>
        </div>

        <div className="flex-1 py-3 pr-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors">
              {video.title}
            </h3>
            <button className="text-foreground/40 hover:text-neon-pink transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <img 
              src={video.authorAvatar} 
              alt={video.author}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-foreground/80">{video.author}</span>
                {video.verified && (
                  <CheckCircle size={12} className="text-neon-blue" />
                )}
              </div>
              <span className="text-xs text-foreground/40">{video.date}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {video.views} visualizações
            </span>
            <span className="flex items-center gap-1">
              <Heart size={14} className="text-neon-pink" />
              {video.likes} likes
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500" />
              {video.rating}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag: string, index: number) => (
              <span key={index} className="text-xs px-2 py-1 bg-white/5 rounded-full text-foreground/40">
                #{tag}
              </span>
            ))}
            <span className="text-xs px-2 py-1 bg-neon-pink/20 text-neon-pink rounded-full">
              {video.category}
            </span>
            {video.vip && (
              <span className="text-xs px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 rounded-full flex items-center gap-1">
                <Crown size={10} />
                VIP
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                Vídeos
              </span>
            </h1>
            <p className="text-foreground/60">
              Explore milhares de vídeos exclusivos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground hover:bg-white/10'
                }`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground hover:bg-white/10'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors border border-white/10"
            >
              <Filter size={16} />
              <span className="text-sm font-medium">Filtros</span>
              <SlidersHorizontal size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass p-6 rounded-xl border border-white/10 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tipo de filtro */}
              <div>
                <h4 className="text-sm font-medium text-foreground/60 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-neon-pink rounded-full"></span>
                  Tipo
                </h4>
                <div className="space-y-2">
                  {filters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
                        selectedFilter === filter.id
                          ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                      }`}
                    >
                      <filter.icon size={14} />
                      <span className="text-sm">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duração */}
              <div>
                <h4 className="text-sm font-medium text-foreground/60 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-neon-purple rounded-full"></span>
                  Duração
                </h4>
                <div className="space-y-2">
                  {durations.map(duration => (
                    <button
                      key={duration.id}
                      onClick={() => setSelectedDuration(duration.id)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
                        selectedDuration === duration.id
                          ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                      }`}
                    >
                      <Clock size={14} />
                      <span className="text-sm">{duration.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualidade */}
              <div>
                <h4 className="text-sm font-medium text-foreground/60 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-neon-blue rounded-full"></span>
                  Qualidade
                </h4>
                <div className="space-y-2">
                  {qualities.map(quality => (
                    <button
                      key={quality.id}
                      onClick={() => setSelectedQuality(quality.id)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
                        selectedQuality === quality.id
                          ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                      }`}
                    >
                      <Maximize2 size={14} />
                      <span className="text-sm">{quality.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply filters button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
              <button className="px-6 py-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all">
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/categoria/${category.id}`}
              className="group relative overflow-hidden rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-all border border-white/10 hover:border-neon-pink/30"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <category.icon size={20} className="text-neon-pink" />
                </div>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-neon-pink transition-colors">
                  {category.name}
                </span>
                <span className="text-xs text-foreground/40 mt-1">
                  {category.count}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Section - Populares */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="text-neon-pink" size={20} />
              <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                Populares
              </span>
            </h2>
            <Link to="/populares" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-pink transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {videos.populares.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {videos.populares.map(video => (
                <VideoListItem key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Section - Mais Vistos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Eye className="text-neon-purple" size={20} />
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                Mais Vistos
              </span>
            </h2>
            <Link to="/mais-vistos" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-purple transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {videos.maisVistos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {videos.maisVistos.map(video => (
                <VideoListItem key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Section - Recomendados */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="text-neon-blue" size={20} />
              <span className="bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
                Recomendados para Você
              </span>
            </h2>
            <Link to="/recomendados" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-blue transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {videos.recomendados.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {videos.recomendados.map(video => (
                <VideoListItem key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>

        {/* Trending Tags */}
        <section className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash size={18} className="text-neon-pink" />
            Tags em Alta
          </h3>
          <div className="flex flex-wrap gap-2">
            {['vip', '4k', 'exclusivo', 'novidade', 'romântico', 'grupo', 'solo', 'amador', 'profissional', 'lesbico', 'gay', 'trans', 'hentai', 'cosplay', 'asmr', 'vr', 'ao-vivo', 'makingof', 'bastidores', 'entrevista'].map((tag, index) => (
              <Link
                key={index}
                to={`/tag/${tag}`}
                className="px-3 py-1.5 bg-white/5 rounded-full text-sm text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-colors border border-white/10"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>

        {/* Load More Button */}
        <div className="flex justify-center pt-4">
          <button className="px-8 py-3 bg-white/5 text-foreground/80 rounded-lg font-medium hover:text-neon-pink hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2">
            <PlayCircle size={18} />
            Carregar mais vídeos
          </button>
        </div>
      </div>
    </Layout>
  );
}