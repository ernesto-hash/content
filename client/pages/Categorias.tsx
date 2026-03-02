import { useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { 
  Grid,
  ChevronRight,
  Search,
  Filter,
  SlidersHorizontal,
  Flame,
  Sparkles,
  TrendingUp,
  Star,
  Eye,
  Heart,
  Clock,
  Play,
  Users,
  Camera,
  Film,
  Tv,
  Monitor,
  Smartphone,
  Gamepad2,
  BookOpen,
  Music,
  Mic,
  Headphones,
  Radio,
  Podcast,
  Drama,
  Award,
  Crown,
  Gem,
  Rocket,
  Zap,
  Wind,
  Sun,
  Moon,
  Globe,
  Flag,
  MapPin,
  Languages,
  Smile,
  Image,
  Video,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  Pause,
  PlayCircle,
  CheckCircle,
  Circle,
  CircleDot,
  CircleDotDashed,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Home,
  Compass,
  Gift,
  ShoppingBag,
  Shield,
  User,
  LogIn,
  Menu,
  X
} from "lucide-react";

export default function CategoriasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Categorias principais
  const mainCategories = [
    {
      id: 'populares',
      name: 'Populares',
      icon: Flame,
      color: 'from-neon-pink to-neon-purple',
      count: '2.5K',
      description: 'Os vídeos mais assistidos da semana'
    },
    {
      id: 'recentes',
      name: 'Recentes',
      icon: Sparkles,
      color: 'from-neon-purple to-neon-blue',
      count: '1.8K',
      description: 'Novidades adicionadas recentemente'
    },
    {
      id: 'tendencias',
      name: 'Tendências',
      icon: TrendingUp,
      color: 'from-neon-blue to-neon-pink',
      count: '3.2K',
      description: 'O que está bombando agora'
    },
    {
      id: 'melhores',
      name: 'Melhores Avaliados',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      count: '1.2K',
      description: 'Os favoritos da comunidade'
    },
    {
      id: 'mais-vistos',
      name: 'Mais Vistos',
      icon: Eye,
      color: 'from-green-500 to-emerald-500',
      count: '4.1K',
      description: 'Os recordistas de visualizações'
    },
    {
      id: 'recomendados',
      name: 'Recomendados',
      icon: ThumbsUp,
      color: 'from-blue-500 to-indigo-500',
      count: '980',
      description: 'Selecionados especialmente para você'
    }
  ];

  // Categorias de conteúdo
  const contentCategories = [
    {
      id: 'amador',
      name: 'Amador',
      icon: Camera,
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '2.5K',
      description: 'Conteúdo autêntico e caseiro'
    },
    {
      id: 'profissional',
      name: 'Profissional',
      icon: Film,
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '3.8K',
      description: 'Produções de alta qualidade'
    },
    {
      id: 'casal',
      name: 'Casal',
      icon: Users,
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '4.2K',
      description: 'Momentos íntimos a dois'
    },
    {
      id: 'solo',
      name: 'Solo',
      icon: User,
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '1.9K',
      description: 'Auto-prazer e intimidade'
    },
    {
      id: 'grupo',
      name: 'Grupo',
      icon: Users,
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '2.1K',
      description: 'Mais de 2 pessoas em cena'
    },
    {
      id: 'lesbico',
      name: 'Lésbico',
      icon: Users,
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '3.4K',
      description: 'Conteúdo feminino exclusivo'
    },
    {
      id: 'gay',
      name: 'Gay',
      icon: Users,
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '2.8K',
      description: 'Conteúdo masculino'
    },
    {
      id: 'trans',
      name: 'Trans',
      icon: Users,
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '1.5K',
      description: 'Modelos trans e travestis'
    },
    {
      id: 'hentai',
      name: 'Hentai',
      icon: Gamepad2,
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '5.6K',
      description: 'Animações eróticas japonesas'
    },
    {
      id: 'anime',
      name: 'Anime',
      icon: Tv,
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '4.9K',
      description: 'Desenhos animados adultos'
    },
    {
      id: 'cosplay',
      name: 'Cosplay',
      icon: Drama,
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '2.3K',
      description: 'Fantasias e personagens'
    },
    {
      id: 'asmr',
      name: 'ASMR',
      icon: Headphones,
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '1.2K',
      description: 'Sons sensuais e relaxantes'
    }
  ];

  // Categorias por formato
  const formatCategories = [
    {
      id: 'vr',
      name: 'Realidade Virtual',
      icon: Monitor,
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '890',
      description: 'Experiência imersiva 360°'
    },
    {
      id: '4k',
      name: '4K Ultra HD',
      icon: Maximize2,
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '1.5K',
      description: 'Máxima qualidade de imagem'
    },
    {
      id: 'fullhd',
      name: 'Full HD',
      icon: Film,
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '3.2K',
      description: 'Alta definição'
    },
    {
      id: 'ao-vivo',
      name: 'Ao Vivo',
      icon: Radio,
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '234',
      description: 'Transmissões em tempo real'
    },
    {
      id: 'shorties',
      name: 'Shorties',
      icon: Zap,
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '4.8K',
      description: 'Vídeos curtos e rápidos'
    },
    {
      id: 'podcasts',
      name: 'Podcasts Eróticos',
      icon: Podcast,
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '567',
      description: 'Áudio sensual para ouvir'
    }
  ];

  // Categorias por país
  const countryCategories = [
    {
      id: 'brasil',
      name: 'Brasil',
      icon: Flag,
      flag: '🇧🇷',
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '3.2K',
      description: 'Conteúdo brasileiro'
    },
    {
      id: 'eua',
      name: 'Estados Unidos',
      icon: Flag,
      flag: '🇺🇸',
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '5.8K',
      description: 'American content'
    },
    {
      id: 'japao',
      name: 'Japão',
      icon: Flag,
      flag: '🇯🇵',
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '4.1K',
      description: 'コンテンツ日本語'
    },
    {
      id: 'coreia',
      name: 'Coreia do Sul',
      icon: Flag,
      flag: '🇰🇷',
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '2.3K',
      description: '한국어 콘텐츠'
    },
    {
      id: 'italia',
      name: 'Itália',
      icon: Flag,
      flag: '🇮🇹',
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '1.8K',
      description: 'Contenuto italiano'
    },
    {
      id: 'franca',
      name: 'França',
      icon: Flag,
      flag: '🇫🇷',
      color: 'neon-blue',
      bgColor: 'from-neon-blue/20 to-neon-pink/20',
      count: '1.9K',
      description: 'Contenu français'
    },
    {
      id: 'espanha',
      name: 'Espanha',
      icon: Flag,
      flag: '🇪🇸',
      color: 'neon-pink',
      bgColor: 'from-neon-pink/20 to-neon-purple/20',
      count: '2.2K',
      description: 'Contenido español'
    },
    {
      id: 'alemanha',
      name: 'Alemanha',
      icon: Flag,
      flag: '🇩🇪',
      color: 'neon-purple',
      bgColor: 'from-neon-purple/20 to-neon-blue/20',
      count: '1.7K',
      description: 'Deutscher Inhalt'
    }
  ];

  // Categorias de tags populares
  const popularTags = [
    'vip', 'exclusivo', '4k', 'novidade', 'romântico', 'selvagem', 
    'soft', 'hardcore', 'oral', 'anal', 'massagem', 'fetish', 
    'bdsm', 'roleplay', 'uniforme', 'praia', 'piscina', 'escritório',
    'vestido', 'lingerie', 'meia', 'salto', 'tatuada', 'loira',
    'morena', 'ruiva', 'musculosa', 'natural', 'peluda', 'depilada'
  ];

  const filters = [
    { id: 'todos', label: 'Todos', icon: Grid },
    { id: 'populares', label: 'Mais Populares', icon: Flame },
    { id: 'recentes', label: 'Recentes', icon: Sparkles },
    { id: 'tendencias', label: 'Em Tendência', icon: TrendingUp },
  ];

  const CategoryCard = ({ category, index }: { category: any, index: number }) => (
    <Link 
      to={`/categoria/${category.id}`}
      className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <category.icon size={24} className={`text-${category.color}`} />
          </div>
          <span className="text-2xl font-bold text-foreground/20 group-hover:text-foreground/30 transition-colors">
            #{index + 1}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-foreground group-hover:text-neon-pink transition-colors mb-1">
          {category.name}
        </h3>
        
        <p className="text-sm text-foreground/60 mb-3 line-clamp-2">
          {category.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/40">
            {category.count} vídeos
          </span>
          <span className="text-neon-pink group-hover:translate-x-1 transition-transform">
            <ChevronRight size={16} />
          </span>
        </div>
      </div>

      {/* Decoração de fundo */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Link>
  );

  const CategoryListItem = ({ category }: { category: any }) => (
    <Link 
      to={`/categoria/${category.id}`}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 hover:bg-white/10 transition-all group"
    >
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
        <category.icon size={20} className={`text-${category.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors truncate">
            {category.name}
          </h3>
          {category.flag && (
            <span className="text-lg">{category.flag}</span>
          )}
        </div>
        <p className="text-sm text-foreground/60 truncate">
          {category.description}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground/40">
          {category.count}
        </span>
        <ChevronRight size={16} className="text-foreground/40 group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
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
                Categorias
              </span>
            </h1>
            <p className="text-foreground/60">
              Explore nosso conteúdo organizado por categorias
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-neon-pink/50 transition-colors"
              />
            </div>

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
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground hover:bg-white/10'
                }`}
              >
                <Menu size={18} />
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Filtros</h3>
              <button 
                onClick={() => setSelectedFilter('todos')}
                className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors"
              >
                Limpar filtros
              </button>
            </div>

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
        )}

        {/* Main Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-pink to-neon-purple rounded-full"></span>
            Principais Categorias
          </h2>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainCategories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mainCategories.map(category => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>

        {/* Content Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-purple to-neon-blue rounded-full"></span>
            Por Tipo de Conteúdo
          </h2>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {contentCategories.map(category => (
                <Link
                  key={category.id}
                  to={`/categoria/${category.id}`}
                  className="group text-center"
                >
                  <div className={`aspect-square rounded-xl bg-gradient-to-br ${category.bgColor} p-4 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform border border-white/10 group-hover:border-${category.color}/30`}>
                    <category.icon size={32} className={`text-${category.color}`} />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors text-sm">
                    {category.name}
                  </h3>
                  <p className="text-xs text-foreground/40 mt-1">
                    {category.count}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {contentCategories.map(category => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>

        {/* Format Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-blue to-neon-pink rounded-full"></span>
            Por Formato
          </h2>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {formatCategories.map(category => (
                <Link
                  key={category.id}
                  to={`/categoria/${category.id}`}
                  className="group text-center"
                >
                  <div className={`aspect-square rounded-xl bg-gradient-to-br ${category.bgColor} p-4 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform border border-white/10 group-hover:border-${category.color}/30`}>
                    <category.icon size={32} className={`text-${category.color}`} />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors text-sm">
                    {category.name}
                  </h3>
                  <p className="text-xs text-foreground/40 mt-1">
                    {category.count}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {formatCategories.map(category => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>

        {/* Country Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-pink to-neon-purple rounded-full"></span>
            Por País
          </h2>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {countryCategories.map(category => (
                <Link
                  key={category.id}
                  to={`/pais/${category.id}`}
                  className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition-all p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.flag}</span>
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-foreground/40">
                        {category.count} vídeos
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {countryCategories.map(category => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>

        {/* Popular Tags */}
        <section className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-neon-pink rounded-full"></span>
            Tags Populares
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag, index) => (
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

        {/* Explore More */}
        <section className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              Não encontrou o que procurava?
            </span>
          </h3>
          <p className="text-foreground/60 mb-6 max-w-2xl mx-auto">
            Experimente usar a busca ou explore nossas tags para encontrar conteúdo mais específico
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/videos"
              className="px-6 py-3 bg-white/5 text-foreground/80 rounded-lg font-medium hover:text-neon-pink hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
            >
              <Video size={18} />
              Ver todos os vídeos
            </Link>
            <Link
              to="/populares"
              className="px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all flex items-center gap-2"
            >
              <Flame size={18} />
              Ver populares
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}