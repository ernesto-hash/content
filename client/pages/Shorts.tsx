import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { 
  Zap,
  Flame,
  Sparkles,
  TrendingUp,
  Star,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  List,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  ThumbsUp,
  Music,
  Mic,
  Headphones,
  Camera,
  Film,
  Tv,
  Monitor,
  Smartphone,
  Gamepad2,
  Drama,
  Smile,
  Users,
  User,
  CheckCircle,
  Crown,
  Award,
  Gift,
  ShoppingBag,
  Clock,
  Calendar,
  MapPin,
  Globe,
  Flag,
  Languages,
  BookOpen,
  Podcast,
  Radio,
  Circle,
  CircleDot,
  CircleDotDashed,
  PlayCircle,
  PauseCircle,
  Volume,
  Volume1,
  VolumeX as VolumeMute
} from "lucide-react";

export default function ShortiesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('paraVoce');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [muted, setMuted] = useState(false);

  // Dados mockados para os shorties
  const shorties = {
    paraVoce: [
      {
        id: 1,
        title: "Dança Sensual",
        description: "Coreografia sensual que está bombando",
        video: "https://player.vimeo.com/external/371837261.sd.mp4?s=7d8f7c8d8d8d8d8d8d8d8d8d8d8d8d8d&profile_id=139",
        thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=700&fit=crop",
        duration: "15",
        views: "1.2M",
        likes: "85K",
        comments: "1.2K",
        shares: "5.4K",
        author: "Luna Star",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        music: "Sexy Dance - Remix",
        musicAuthor: "DJ Sensual",
        tags: ["danca", "sexy", "trending"],
        category: "Dança",
        date: "2 horas atrás"
      },
      {
        id: 2,
        title: "Momento Íntimo",
        description: "Um momento especial a sós",
        thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=700&fit=crop",
        duration: "23",
        views: "890K",
        likes: "67K",
        comments: "892",
        shares: "3.2K",
        author: "Sofia Santos",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        music: "Sensual Moments",
        musicAuthor: "Relax Beats",
        tags: ["intimo", "sensual"],
        category: "Solo",
        date: "5 horas atrás"
      },
      {
        id: 3,
        title: "Strip Tease Rápido",
        description: "Despindo com muito estilo",
        thumbnail: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&h=700&fit=crop",
        duration: "18",
        views: "2.1M",
        likes: "156K",
        comments: "2.3K",
        shares: "8.9K",
        author: "Isabella Rodriguez",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        music: "Slow Strip",
        musicAuthor: "Erotic Beats",
        tags: ["strip", "sexy"],
        category: "Strip",
        date: "1 hora atrás"
      },
      {
        id: 4,
        title: "Beijo Intenso",
        description: "Paixão em poucos segundos",
        thumbnail: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=700&fit=crop",
        duration: "12",
        views: "560K",
        likes: "42K",
        comments: "567",
        shares: "2.1K",
        author: "Maya Rodriguez",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        music: "Kiss Me",
        musicAuthor: "Romantic Flow",
        tags: ["beijo", "romantico"],
        category: "Romântico",
        date: "1 dia atrás"
      },
      {
        id: 5,
        title: "Só de Lingerie",
        description: "Modelo exibindo lingerie nova",
        thumbnail: "https://images.unsplash.com/photo-1548142813-c34835dfe326?w=400&h=700&fit=crop",
        duration: "21",
        views: "1.5M",
        likes: "98K",
        comments: "1.5K",
        shares: "4.7K",
        author: "Alice Moreira",
        authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        music: "Lingerie Show",
        musicAuthor: "Fashion Beats",
        tags: ["lingerie", "fashion"],
        category: "Moda",
        date: "3 horas atrás"
      },
      {
        id: 6,
        title: "Massagem Sensual",
        description: "Massagem relaxante com final feliz",
        thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=700&fit=crop",
        duration: "28",
        views: "980K",
        likes: "71K",
        comments: "1.1K",
        shares: "3.8K",
        author: "Carol Lima",
        authorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        music: "Relaxing Touch",
        musicAuthor: "Spa Music",
        tags: ["massagem", "relax"],
        category: "Bem-estar",
        date: "6 horas atrás"
      }
    ],
    trending: [
      {
        id: 7,
        title: "Desafio da Dança",
        description: "Participando do desafio viral",
        thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=700&fit=crop",
        duration: "14",
        views: "3.2M",
        likes: "245K",
        comments: "3.4K",
        shares: "12.5K",
        author: "Luna & Bia",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        music: "Challenge Song",
        musicAuthor: "DJ Viral",
        tags: ["desafio", "danca"],
        category: "Challenge",
        date: "30 minutos atrás"
      },
      {
        id: 8,
        title: "Making Of Sensual",
        description: "Bastidores de um ensaio quente",
        thumbnail: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&h=700&fit=crop",
        duration: "32",
        views: "2.8M",
        likes: "189K",
        comments: "2.8K",
        shares: "7.2K",
        author: "Studio Models",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        music: "Behind the Scenes",
        musicAuthor: "Studio Beats",
        tags: ["makingof", "bastidores"],
        category: "Bastidores",
        date: "2 horas atrás"
      }
    ],
    musicas: [
      {
        id: 9,
        title: "Coreografia Erótica",
        description: "Dançando ao som do momento",
        thumbnail: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=700&fit=crop",
        duration: "19",
        views: "450K",
        likes: "34K",
        comments: "456",
        shares: "1.8K",
        author: "Dance Crew",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        music: "Erotic Dance 2024",
        musicAuthor: "DJ Sensation",
        tags: ["danca", "coreografia"],
        category: "Dança",
        date: "4 horas atrás"
      },
      {
        id: 10,
        title: "Playlist Sensual",
        description: "Melhores momentos com música",
        thumbnail: "https://images.unsplash.com/photo-1548142813-c34835dfe326?w=400&h=700&fit=crop",
        duration: "27",
        views: "890K",
        likes: "67K",
        comments: "892",
        shares: "3.4K",
        author: "Music Lovers",
        authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        music: "Sensual Mix 2024",
        musicAuthor: "Various Artists",
        tags: ["playlist", "musica"],
        category: "Música",
        date: "5 horas atrás"
      }
    ],
    funny: [
      {
        id: 11,
        title: "Fail Engraçado",
        description: "Quando a dança não sai como esperado",
        thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=700&fit=crop",
        duration: "11",
        views: "2.3M",
        likes: "178K",
        comments: "2.1K",
        shares: "6.7K",
        author: "Funny Models",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        music: "Funny Sound",
        musicAuthor: "Comedy Beats",
        tags: ["fail", "comedia"],
        category: "Humor",
        date: "1 hora atrás"
      },
      {
        id: 12,
        title: "Lipe Sync Engraçado",
        description: "Dublagem hilária",
        thumbnail: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=700&fit=crop",
        duration: "16",
        views: "1.8M",
        likes: "134K",
        comments: "1.6K",
        shares: "4.9K",
        author: "Comedy Queen",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        music: "Viral Sound",
        musicAuthor: "TikTok Hits",
        tags: ["lipsync", "comedia"],
        category: "Humor",
        date: "3 horas atrás"
      }
    ]
  };

  const filters = [
    { id: 'paraVoce', label: 'Para Você', icon: Sparkles },
    { id: 'trending', label: 'Em Alta', icon: Flame },
    { id: 'seguindo', label: 'Seguindo', icon: Users },
    { id: 'musicas', label: 'Músicas', icon: Music },
    { id: 'dancas', label: 'Danças', icon: Users },
    { id: 'funny', label: 'Engraçados', icon: Smile },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'novos', label: 'Novos', icon: Sparkles },
  ];

  const categories = [
    { id: 'todos', label: 'Todos', icon: Zap },
    { id: 'danca', label: 'Dança', icon: Users },
    { id: 'solo', label: 'Solo', icon: User },
    { id: 'casal', label: 'Casal', icon: Users },
    { id: 'strip', label: 'Strip', icon: Film },
    { id: 'lingerie', label: 'Lingerie', icon: Gift },
    { id: 'massagem', label: 'Massagem', icon: Users },
    { id: 'cosplay', label: 'Cosplay', icon: Drama },
    { id: 'asmr', label: 'ASMR', icon: Headphones },
    { id: 'funny', label: 'Humor', icon: Smile },
  ];

  const ShortieCard = ({ shortie, index }: { shortie: any, index: number }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current) {
        if (isHovered && autoPlay) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }, [isHovered, autoPlay]);

    return (
      <Link 
        to={`/shortie/${shortie.id}`} 
        className="group block relative aspect-[9/16] rounded-xl overflow-hidden bg-white/5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail/Video */}
        {shortie.video && isHovered ? (
          <video
            ref={videoRef}
            src={shortie.video}
            loop
            muted={muted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={shortie.thumbnail} 
            alt={shortie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
          {/* Top bar */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {shortie.vip && (
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Crown size={10} />
                  VIP
                </span>
              )}
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {shortie.duration}s
              </span>
            </div>
            <button className="text-white/80 hover:text-white transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Author info */}
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={shortie.authorAvatar} 
                alt={shortie.author}
                className="w-8 h-8 rounded-full border-2 border-white/20"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-white">{shortie.author}</span>
                  {shortie.verified && (
                    <CheckCircle size={12} className="text-neon-blue" />
                  )}
                </div>
                <p className="text-xs text-white/60">{shortie.category}</p>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-white mb-1 line-clamp-1">
              {shortie.title}
            </h3>

            {/* Music info */}
            <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
              <Music size={10} />
              <span className="truncate">{shortie.music} - {shortie.musicAuthor}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Eye size={10} />
                {shortie.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={10} className="text-neon-pink" />
                {shortie.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={10} />
                {shortie.comments}
              </span>
            </div>
          </div>
        </div>

        {/* Play/Pause indicator */}
        {isHovered && isPlaying && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={16} className="text-white" />
            </div>
          </div>
        )}

        {/* Index number (for grid view) */}
        <div className="absolute top-2 right-2 text-2xl font-bold text-white/20">
          #{index + 1}
        </div>
      </Link>
    );
  };

  const ShortieListItem = ({ shortie }: { shortie: any }) => (
    <Link to={`/shortie/${shortie.id}`} className="group block">
      <div className="flex gap-4 bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors">
        <div className="relative w-24 aspect-[9/16]">
          <img 
            src={shortie.thumbnail} 
            alt={shortie.title}
            className="w-full h-full object-cover"
          />
          
          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg">
            {shortie.duration}s
          </div>

          {/* VIP badge */}
          {shortie.vip && (
            <div className="absolute top-2 left-2">
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Crown size={8} />
                VIP
              </span>
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
            <div className="w-8 h-8 rounded-full bg-neon-pink/90 flex items-center justify-center">
              <Play size={12} className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        <div className="flex-1 py-3 pr-3">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors">
                {shortie.title}
              </h3>
              <p className="text-xs text-foreground/60 line-clamp-1">
                {shortie.description}
              </p>
            </div>
            <button className="text-foreground/40 hover:text-neon-pink transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <img 
                src={shortie.authorAvatar} 
                alt={shortie.author}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm text-foreground/80">{shortie.author}</span>
                {shortie.verified && (
                  <CheckCircle size={10} className="text-neon-blue" />
                )}
              </div>
            </div>
            <span className="text-xs text-foreground/40">{shortie.date}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-foreground/60 mb-2">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {shortie.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={12} className="text-neon-pink" />
              {shortie.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} />
              {shortie.comments}
            </span>
            <span className="flex items-center gap-1">
              <Share2 size={12} />
              {shortie.shares}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-foreground/40">
              <Music size={10} />
              <span className="truncate max-w-[200px]">{shortie.music}</span>
            </div>
            <span className="w-1 h-1 bg-foreground/20 rounded-full"></span>
            <span className="text-foreground/40">{shortie.category}</span>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {shortie.tags.map((tag: string, index: number) => (
              <span key={index} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-foreground/40">
                #{tag}
              </span>
            ))}
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
                Shorties
              </span>
            </h1>
            <p className="text-foreground/60">
              Vídeos curtos sensuais para você
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Autoplay toggle */}
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                autoPlay
                  ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/30'
                  : 'bg-white/5 text-foreground/60 hover:text-foreground border-white/10'
              }`}
            >
              <PlayCircle size={16} />
              <span className="text-sm font-medium">AutoPlay</span>
            </button>

            {/* Mute toggle */}
            <button
              onClick={() => setMuted(!muted)}
              className={`p-2 rounded-lg transition-colors border ${
                muted
                  ? 'bg-white/5 text-foreground/60'
                  : 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
              }`}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

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
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass p-6 rounded-xl border border-white/10 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de filtro */}
              <div>
                <h4 className="text-sm font-medium text-foreground/60 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-neon-pink rounded-full"></span>
                  O que você quer ver?
                </h4>
                <div className="flex flex-wrap gap-2">
                  {filters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedFilter === filter.id
                          ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                          : 'bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <filter.icon size={14} />
                      <span className="text-sm">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorias */}
              <div>
                <h4 className="text-sm font-medium text-foreground/60 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-neon-purple rounded-full"></span>
                  Categorias
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                          : 'bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <category.icon size={14} />
                      <span className="text-sm">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration range */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-foreground/60 mb-3">
                Duração
              </h4>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-neon-blue/20 text-neon-blue rounded-lg border border-neon-blue/30 text-sm">
                  Até 15s
                </button>
                <button className="px-4 py-2 bg-white/5 text-foreground/60 hover:text-foreground rounded-lg border border-white/10 text-sm">
                  15-30s
                </button>
                <button className="px-4 py-2 bg-white/5 text-foreground/60 hover:text-foreground rounded-lg border border-white/10 text-sm">
                  30-60s
                </button>
                <button className="px-4 py-2 bg-white/5 text-foreground/60 hover:text-foreground rounded-lg border border-white/10 text-sm">
                  60s+
                </button>
              </div>
            </div>

            {/* Apply filters button */}
            <div className="flex justify-end mt-6">
              <button className="px-6 py-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all">
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Stories Row */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
            <button key={item} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple p-[2px]">
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  <img 
                    src={`https://images.unsplash.com/photo-${1534528741775 + item}?w=100&h=100&fit=crop`}
                    alt="Story"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs text-foreground/60">Usuário {item}</span>
            </button>
          ))}
        </div>

        {/* Para Você Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="text-neon-pink" size={20} />
              <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                Para Você
              </span>
            </h2>
            <Link to="/shorties/para-voce" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-pink transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {shorties.paraVoce.map((shortie, index) => (
                <ShortieCard key={shortie.id} shortie={shortie} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {shorties.paraVoce.map(shortie => (
                <ShortieListItem key={shortie.id} shortie={shortie} />
              ))}
            </div>
          )}
        </section>

        {/* Em Alta Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="text-neon-purple" size={20} />
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                Em Alta 🔥
              </span>
            </h2>
            <Link to="/shorties/trending" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-purple transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {shorties.trending.map((shortie, index) => (
                <ShortieCard key={shortie.id} shortie={shortie} index={index + 6} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {shorties.trending.map(shortie => (
                <ShortieListItem key={shortie.id} shortie={shortie} />
              ))}
            </div>
          )}
        </section>

        {/* Categorias Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link to="/shorties/danca" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-2">
              <Users size={20} className="text-neon-pink" />
            </div>
            <span className="text-sm font-medium text-foreground/80">Dança</span>
            <span className="text-xs text-foreground/40 block mt-1">2.5K vídeos</span>
          </Link>
          
          <Link to="/shorties/casal" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-2">
              <Users size={20} className="text-neon-purple" />
            </div>
            <span className="text-sm font-medium text-foreground/80">Casal</span>
            <span className="text-xs text-foreground/40 block mt-1">1.8K vídeos</span>
          </Link>
          
          <Link to="/shorties/strip" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-pink/20 flex items-center justify-center mx-auto mb-2">
              <Film size={20} className="text-neon-blue" />
            </div>
            <span className="text-sm font-medium text-foreground/80">Strip</span>
            <span className="text-xs text-foreground/40 block mt-1">1.2K vídeos</span>
          </Link>
          
          <Link to="/shorties/lingerie" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-2">
              <Gift size={20} className="text-neon-pink" />
            </div>
            <span className="text-sm font-medium text-foreground/80">Lingerie</span>
            <span className="text-xs text-foreground/40 block mt-1">3.1K vídeos</span>
          </Link>
          
          <Link to="/shorties/asmr" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-2">
              <Headphones size={20} className="text-neon-purple" />
            </div>
            <span className="text-sm font-medium text-foreground/80">ASMR</span>
            <span className="text-xs text-foreground/40 block mt-1">890 vídeos</span>
          </Link>
          
          <Link to="/shorties/funny" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-pink/20 flex items-center justify-center mx-auto mb-2">
              <Smile size={20} className="text-neon-blue" />
            </div>
            <span className="text-sm font-medium text-foreground/80">Humor</span>
            <span className="text-xs text-foreground/40 block mt-1">2.2K vídeos</span>
          </Link>
        </div>

        {/* Músicas Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Music className="text-neon-blue" size={20} />
              <span className="bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
                Trends Musicais
              </span>
            </h2>
            <Link to="/shorties/musicas" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-blue transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {shorties.musicas.map((shortie, index) => (
                <ShortieCard key={shortie.id} shortie={shortie} index={index + 8} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {shorties.musicas.map(shortie => (
                <ShortieListItem key={shortie.id} shortie={shortie} />
              ))}
            </div>
          )}
        </section>

        {/* Humor Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Smile className="text-neon-pink" size={20} />
              <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                Para dar risada
              </span>
            </h2>
            <Link to="/shorties/humor" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-pink transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {shorties.funny.map((shortie, index) => (
                <ShortieCard key={shortie.id} shortie={shortie} index={index + 10} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {shorties.funny.map(shortie => (
                <ShortieListItem key={shortie.id} shortie={shortie} />
              ))}
            </div>
          )}
        </section>

        {/* Trending Tags */}
        <section className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-neon-pink" />
            Tags em Alta nos Shorties
          </h3>
          <div className="flex flex-wrap gap-2">
            {['dancachallenge', 'strip tease', 'lingerie', 'casal', 'asmr', 'cosplay', 'funny', 'fail', 'lipsync', 'trend', 'viral', 'sexy', 'hot', 'romantico', 'massagem'].map((tag, index) => (
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

        {/* Create Shortie CTA */}
        <section className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              Quer criar seus próprios shorties?
            </span>
          </h3>
          <p className="text-foreground/60 mb-6 max-w-2xl mx-auto">
            Mostre seu talento e ganhe seguidores com vídeos curtos sensuais
          </p>
          <Link
            to="/upload/shortie"
            className="px-8 py-4 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-xl font-medium hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all inline-flex items-center gap-3 text-lg"
          >
            <Camera size={20} />
            Criar Shortie Agora
          </Link>
        </section>

        {/* Load More Button */}
        <div className="flex justify-center pt-4">
          <button className="px-8 py-3 bg-white/5 text-foreground/80 rounded-lg font-medium hover:text-neon-pink hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2">
            <Zap size={18} />
            Carregar mais shorties
          </button>
        </div>
      </div>
    </Layout>
  );
}