// src/pages/Categorias.tsx
import { useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import {
  Grid, ChevronRight, Search, Filter, SlidersHorizontal,
  Flame, Sparkles, TrendingUp, Star, Eye, Users, Camera,
  Film, Tv, Gamepad2, Headphones, Drama, Flag, User, Menu,
  Video, ThumbsUp,
} from "lucide-react";

export default function CategoriasPage() {
  const [searchTerm, setSearchTerm]         = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [showFilters, setShowFilters]       = useState(false);
  const [viewMode, setViewMode]             = useState<"grid" | "list">("grid");

  // ─── Dados ─────────────────────────────────────────────────────────────────

  const mainCategories = [
    { id: "populares",          name: "Populares",          icon: Flame,      color: "from-neon-pink to-neon-purple",  bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "2.5K", description: "Os vídeos mais assistidos da semana"  },
    { id: "recentes",           name: "Recentes",           icon: Sparkles,   color: "from-neon-purple to-neon-blue",  bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "1.8K", description: "Novidades adicionadas recentemente"   },
    { id: "tendencias",         name: "Tendências",         icon: TrendingUp, color: "from-neon-blue to-neon-pink",    bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "3.2K", description: "O que está bombando agora"            },
    { id: "melhores-avaliados", name: "Melhores Avaliados", icon: Star,       color: "from-yellow-500 to-orange-500",  bgColor: "from-yellow-500/20 to-orange-500/20",  count: "1.2K", description: "Os favoritos da comunidade"           },
    { id: "mais-vistos",        name: "Mais Vistos",        icon: Eye,        color: "from-green-500 to-emerald-500",  bgColor: "from-green-500/20 to-emerald-500/20",  count: "4.1K", description: "Os recordistas de visualizações"      },
    { id: "recomendados",       name: "Recomendados",       icon: ThumbsUp,   color: "from-blue-500 to-indigo-500",    bgColor: "from-blue-500/20 to-indigo-500/20",    count: "980",  description: "Selecionados especialmente para você" },
  ];

  const contentCategories = [
    { id: "amador",       name: "Amador",       icon: Camera,     color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "2.5K", description: "Conteúdo autêntico e caseiro"    },
    { id: "profissional", name: "Profissional", icon: Film,       color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "3.8K", description: "Produções de alta qualidade"     },
    { id: "casal",        name: "Casal",        icon: Users,      color: "neon-blue",   bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "4.2K", description: "Momentos íntimos a dois"         },
    { id: "solo",         name: "Solo",         icon: User,       color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "1.9K", description: "Auto-prazer e intimidade"        },
    { id: "grupo",        name: "Grupo",        icon: Users,      color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "2.1K", description: "Mais de 2 pessoas em cena"       },
    { id: "lesbico",      name: "Lésbico",      icon: Users,      color: "neon-blue",   bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "3.4K", description: "Conteúdo feminino exclusivo"     },
    { id: "gay",          name: "Gay",          icon: Users,      color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "2.8K", description: "Conteúdo masculino"              },
    { id: "trans",        name: "Trans",        icon: Users,      color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "1.5K", description: "Modelos trans e travestis"       },
    { id: "hentai",       name: "Hentai",       icon: Gamepad2,   color: "neon-blue",   bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "5.6K", description: "Animações eróticas japonesas"    },
    { id: "anime",        name: "Anime",        icon: Tv,         color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "4.9K", description: "Desenhos animados adultos"       },
    { id: "cosplay",      name: "Cosplay",      icon: Drama,      color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "2.3K", description: "Fantasias e personagens"         },
    { id: "asmr",         name: "ASMR",         icon: Headphones, color: "neon-blue",   bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "1.2K", description: "Sons sensuais e relaxantes"      },
  ];

  const countryCategories = [
    { id: "brasil",   name: "Brasil",         icon: Flag, flag: "🇧🇷", color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "3.2K", description: "Conteúdo brasileiro"  },
    { id: "eua",      name: "Estados Unidos", icon: Flag, flag: "🇺🇸", color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "5.8K", description: "American content"     },
    { id: "japao",    name: "Japão",          icon: Flag, flag: "🇯🇵", color: "neon-blue",   bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "4.1K", description: "コンテンツ日本語"       },
    { id: "coreia",   name: "Coreia do Sul",  icon: Flag, flag: "🇰🇷", color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "2.3K", description: "한국어 콘텐츠"           },
    { id: "italia",   name: "Itália",         icon: Flag, flag: "🇮🇹", color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "1.8K", description: "Contenuto italiano"   },
    { id: "franca",   name: "França",         icon: Flag, flag: "🇫🇷", color: "neon-blue",   bgColor: "from-neon-blue/20 to-neon-pink/20",    count: "1.9K", description: "Contenu français"     },
    { id: "espanha",  name: "Espanha",        icon: Flag, flag: "🇪🇸", color: "neon-pink",   bgColor: "from-neon-pink/20 to-neon-purple/20",  count: "2.2K", description: "Contenido español"    },
    { id: "alemanha", name: "Alemanha",       icon: Flag, flag: "🇩🇪", color: "neon-purple", bgColor: "from-neon-purple/20 to-neon-blue/20",  count: "1.7K", description: "Deutscher Inhalt"     },
  ];

  const popularTags = [
    "vip","exclusivo","4k","novidade","romântico","selvagem",
    "soft","hardcore","oral","anal","massagem","fetish",
    "bdsm","roleplay","uniforme","praia","piscina","escritório",
    "vestido","lingerie","meia","salto","tatuada","loira",
    "morena","ruiva","musculosa","natural","peluda","depilada",
  ];

  const filters = [
    { id: "todos",      label: "Todos",          icon: Grid       },
    { id: "populares",  label: "Mais Populares", icon: Flame      },
    { id: "recentes",   label: "Recentes",       icon: Sparkles   },
    { id: "tendencias", label: "Em Tendência",   icon: TrendingUp },
  ];

  // ── Rotas das Principais Categorias (algoritmo — páginas próprias) ──────────
  const mainCategoryRoutes: Record<string, string> = {
    "populares":          "/populares",
    "recentes":           "/recentes",
    "tendencias":         "/tendencias",
    "melhores-avaliados": "/melhores-avaliados",
    "mais-vistos":        "/mais-vistos",
    "recomendados":       "/recomendados",
  };

  // ── Rotas das categorias de conteúdo — versão PÚBLICA (/categoria/:slug) ───
  const contentCategoryRoutes: Record<string, string> = {
    "amador":       "/categoria/amador",
    "profissional": "/categoria/profissional",
    "casal":        "/categoria/casal",
    "solo":         "/categoria/solo",
    "grupo":        "/categoria/grupo",
    "lesbico":      "/categoria/lesbica",
    "gay":          "/categoria/gay",
    "trans":        "/categoria/trans",
    "hentai":       "/categoria/hentai",
    "anime":        "/categoria/anime",
    "cosplay":      "/categoria/cosplay",
    "asmr":         "/categoria/asmr",
  };

  // ── Rotas dos países — versão PÚBLICA (/categoria/:slug) ────────────────────
  const countryCategoryRoutes: Record<string, string> = {
    "brasil":   "/categoria/brasil",
    "eua":      "/categoria/eua",
    "japao":    "/categoria/japao",
    "coreia":   "/categoria/coreia",
    "italia":   "/categoria/italia",
    "franca":   "/categoria/franca",
    "espanha":  "/categoria/espanha",
    "alemanha": "/categoria/alemanha",
  };

  // ─── Sub-components ────────────────────────────────────────────────────────

  const MainCategoryCard = ({ category, index }: { category: any; index: number }) => {
    const to = mainCategoryRoutes[category.id] ?? `/categoria/${category.id}`;
    return (
      <Link to={to} className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <category.icon size={24} />
            </div>
            <span className="text-2xl font-bold text-foreground/20 group-hover:text-foreground/30 transition-colors">#{index + 1}</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-neon-pink transition-colors mb-1">{category.name}</h3>
          <p className="text-sm text-foreground/60 mb-3 line-clamp-2">{category.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/40">{category.count} vídeos</span>
            <span className="text-neon-pink group-hover:translate-x-1 transition-transform"><ChevronRight size={16} /></span>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  };

  const MainCategoryListItem = ({ category }: { category: any }) => {
    const to = mainCategoryRoutes[category.id] ?? `/categoria/${category.id}`;
    return (
      <Link to={to} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 hover:bg-white/10 transition-all group">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
          <category.icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors truncate mb-0.5">{category.name}</h3>
          <p className="text-sm text-foreground/60 truncate">{category.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground/40">{category.count}</span>
          <ChevronRight size={16} className="text-foreground/40 group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    );
  };

  const CategoryListItem = ({ category, to }: { category: any; to: string }) => (
    <Link to={to} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 hover:bg-white/10 transition-all group">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
        <category.icon size={20} className={`text-${category.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors truncate">{category.name}</h3>
          {category.flag && <span className="text-lg">{category.flag}</span>}
        </div>
        <p className="text-sm text-foreground/60 truncate">{category.description}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground/40">{category.count}</span>
        <ChevronRight size={16} className="text-foreground/40 group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">Categorias</span>
            </h1>
            <p className="text-foreground/60">Explore nosso conteúdo organizado por categorias</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input type="text" placeholder="Buscar categorias..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-neon-pink/50 transition-colors" />
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/60 hover:text-foreground hover:bg-white/10"}`}><Grid size={18} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/60 hover:text-foreground hover:bg-white/10"}`}><Menu size={18} /></button>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors border border-white/10">
              <Filter size={16} /><SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass p-6 rounded-xl border border-white/10 animate-slideDown">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Filtros</h3>
              <button onClick={() => setSelectedFilter("todos")} className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors">Limpar filtros</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button key={f.id} onClick={() => setSelectedFilter(f.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${selectedFilter === f.id ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30" : "bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10 border border-white/10"}`}>
                  <f.icon size={14} /><span className="text-sm">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Principais Categorias ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-pink to-neon-purple rounded-full" />
            Principais Categorias
          </h2>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainCategories.map((cat, i) => <MainCategoryCard key={cat.id} category={cat} index={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {mainCategories.map((cat) => <MainCategoryListItem key={cat.id} category={cat} />)}
            </div>
          )}
        </section>

        {/* ── Por Tipo de Conteúdo ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-purple to-neon-blue rounded-full" />
            Por Tipo de Conteúdo
          </h2>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {contentCategories.map((cat) => {
                const to = contentCategoryRoutes[cat.id] ?? `/categoria/${cat.id}`;
                return (
                  <Link key={cat.id} to={to} className="group text-center">
                    <div className={`aspect-square rounded-xl bg-gradient-to-br ${cat.bgColor} p-4 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform border border-white/10`}>
                      <cat.icon size={32} className={`text-${cat.color}`} />
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors text-sm">{cat.name}</h3>
                    <p className="text-xs text-foreground/40 mt-1">{cat.count}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {contentCategories.map((cat) => {
                const to = contentCategoryRoutes[cat.id] ?? `/categoria/${cat.id}`;
                return <CategoryListItem key={cat.id} category={cat} to={to} />;
              })}
            </div>
          )}
        </section>

        {/* ── Por País ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-pink to-neon-purple rounded-full" />
            Por País
          </h2>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {countryCategories.map((cat) => {
                const to = countryCategoryRoutes[cat.id] ?? `/categoria/${cat.id}`;
                return (
                  <Link key={cat.id} to={to} className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-neon-pink/30 transition-all p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.flag}</span>
                      <div>
                        <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors">{cat.name}</h3>
                        <p className="text-xs text-foreground/40">{cat.count} vídeos</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {countryCategories.map((cat) => {
                const to = countryCategoryRoutes[cat.id] ?? `/categoria/${cat.id}`;
                return <CategoryListItem key={cat.id} category={cat} to={to} />;
              })}
            </div>
          )}
        </section>

        {/* ── Tags Populares ────────────────────────────────────────────────── */}
        <section className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-neon-pink rounded-full" />
            Tags Populares
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag, i) => (
              <Link key={i} to={`/tag/${tag}`} className="px-3 py-1.5 bg-white/5 rounded-full text-sm text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-colors border border-white/10">
                #{tag}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Explore More ─────────────────────────────────────────────────── */}
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
            <Link to="/videos" className="px-6 py-3 bg-white/5 text-foreground/80 rounded-lg font-medium hover:text-neon-pink hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2">
              <Video size={18} />Ver todos os vídeos
            </Link>
            <Link to="/populares" className="px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all flex items-center gap-2">
              <Flame size={18} />Ver populares
            </Link>
          </div>
        </section>

      </div>
    </Layout>
  );
}
