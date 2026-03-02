import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Video, Grid, Users, Star, ChevronDown, User, LogIn, Heart, TrendingUp, Flame, Sparkles, Camera, MessageCircle, Globe, Flag, Image, Mic, Compass, Home, Film, Music, Gamepad2, BookOpen, Gift, ShoppingBag, Shield, Zap, Eye, ThumbsUp, PlayCircle, Radio, Tv, Monitor, Smartphone, Clock, Calendar, Award, Crown, Gem, Rocket, Wind, Sun, Moon, MapPin, Languages, Drama, Smile, Podcast, Headphones, Volume2, VolumeX, Maximize2, Minimize2, SkipForward, SkipBack, Pause, Circle, CircleDot, CircleDotDashed } from "lucide-react";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean; // Mantido para compatibilidade, mas vamos usar de forma diferente
}

export default function Layout({ children, hideHeader = false }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const location = useLocation();

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      // Se hideHeader for true, o header SEMPRE fica visível (não desaparece)
      if (hideHeader) {
        setIsHeaderVisible(true);
        return;
      }
      
      // Comportamento normal: esconder ao rolar para baixo, mostrar ao rolar para cima
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Adiciona o evento em TODAS as páginas, não apenas quando hideHeader é true
    window.addEventListener('scroll', controlHeader);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [lastScrollY, hideHeader]); // Dependências: lastScrollY e hideHeader

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenCategory(null);
  };

  // A classe agora usa isHeaderVisible para controlar a visibilidade
  // Se hideHeader for true, o header fica sempre visível (translate-y-0)
  const headerClasses = `sticky top-0 z-50 glass border-b border-white/10 transition-transform duration-300 ${
    hideHeader ? 'translate-y-0' : (isHeaderVisible ? 'translate-y-0' : '-translate-y-full')
  }`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className={headerClasses}>
        {/* Top Header - Logo, Search, Icons, User */}
        <div className="max-container safe-area py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Hamburger + Logo */}
            <div className="flex items-center gap-3">

              {/* Logo - suck or sex */}
              <Link to="/" className="flex items-center gap-1 group" onClick={closeMenu}>
                <h1 className="text-2xl font-black">
                  <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                    suck
                  </span>
                  <span className="text-foreground/40 mx-1">or</span>
                  <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                    sex
                  </span>
                </h1>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:block flex-1 max-w-2xl">
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r from-neon-pink/20 via-neon-purple/20 to-neon-blue/20 rounded-full blur-md transition-opacity ${isSearchFocused ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`relative flex items-center gap-2 bg-white/5 border ${isSearchFocused ? 'border-neon-purple/50 bg-white/10' : 'border-white/10'} rounded-full px-4 py-2.5 transition-all`}>
                  <Search size={18} className={`${isSearchFocused ? 'text-neon-pink' : 'text-foreground/40'} transition-colors`} />
                  <input
                    type="text"
                    placeholder="Buscar vídeos, modelos, categorias..."
                    className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground/30 outline-none"
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </div>
              </div>
            </div>

            {/* Right Section: Icons + User */}
            <div className="flex items-center gap-2">
              {/* User Menu */}
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-all border border-white/10"
                  onClick={closeMenu}
                >
                  <LogIn size={16} />
                  <span className="text-sm font-medium">Entrar</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all"
                  onClick={closeMenu}
                >
                  <User size={16} />
                  <span className="text-sm font-medium hidden sm:inline">Criar Conta</span>
                </Link>
              </div>

              {/* Mobile Search Icon */}
              <button className="md:hidden w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-all">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Search - Shows below on mobile */}
          <div className="md:hidden mt-3">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <Search size={18} className="text-foreground/40" />
                <input
                  type="text"
                  placeholder="Buscar vídeos..."
                  className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground/30 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="border-t border-white/10 bg-black/20">
          <div className="max-container safe-area">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {/* Link da Página Inicial com destque condicional */}
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  location.pathname === '/' 
                    ? 'text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30' 
                    : 'text-foreground/80 hover:text-neon-pink hover:bg-white/5'
                }`}
              >
                Página Inicial
              </Link>
              
              {/* Link de Vídeos com destaque condicional */}
              <Link 
                to="/videos" 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  location.pathname === '/videos' 
                    ? 'text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30' 
                    : 'text-foreground/80 hover:text-neon-pink hover:bg-white/5'
                }`}
              >
                Vídeos
              </Link>

              {/* Outros links (sem destaque condicional por enquanto) */}
              <Link 
              to="/categorias" 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location.pathname === '/categorias' 
                  ? 'text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30' 
                  : 'text-foreground/80 hover:text-neon-pink hover:bg-white/5'
              }`}
            >
                Categorias
              </Link>
              <Link 
              to="/modelos" 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location.pathname === '/modelos' 
                  ? 'text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30' 
                  : 'text-foreground/80 hover:text-neon-pink hover:bg-white/5'
              }`}
            >
                Modelos
              </Link>

              <Link to="/fotos-gifs" 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location.pathname === '/fotos-gifs' 
                  ? 'text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30' 
                  : 'text-foreground/80 hover:text-neon-pink hover:bg-white/5'
              }`}>
                Fotos e GIFs
              </Link>
            </div>
          </div>
        </nav>

        {/* Sub Navigation */}
        <nav className="border-t border-white/5 bg-black/10">
          <div className="max-container safe-area">
            <div className="flex items-center gap-4 overflow-x-auto py-2 scrollbar-hide">
            <Link to="/populares" 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  location.pathname === '/populares' 
                    ? 'text-neon-pink' 
                    : 'text-foreground/80 hover:text-neon-pink'
                }`}>
                <Flame size={12} /> Populares
              </Link>
              <Link to="/recomendados" 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                location.pathname === '/recomendados' 
                  ? 'text-neon-pink' 
                  : 'text-foreground/80 hover:text-neon-pink'
              }`}>
                <Star size={12} /> Recomendados
              </Link>
              <Link to="/internacional" 
              className="flex items-center gap-1 text-xs bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 px-3 py-1 rounded-full text-neon-pink border border-neon-pink/30 whitespace-nowrap">
                <Globe size={12} /> Internacional
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[120px] bottom-0 glass-dark border-t border-white/10 overflow-y-auto z-40 animate-slideDown">
            <div className="p-4 space-y-4">
              
              {/* Main Menu Items */}
              <div className="space-y-1">
                <Link 
                  to="/" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/' 
                      ? 'bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-foreground border border-neon-pink/30' 
                      : 'hover:bg-white/5 text-foreground/80'
                  }`}
                  onClick={closeMenu}
                >
                  <Home size={18} className="text-neon-pink" />
                  <span>Página Inicial</span>
                </Link>

                <Link 
                  to="/videos" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/videos' 
                      ? 'bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-foreground border border-neon-pink/30' 
                      : 'hover:bg-white/5 text-foreground/80'
                  }`}
                  onClick={closeMenu}
                >
                  <Video size={18} className="text-neon-purple" />
                  <span>Vídeos</span>
                </Link>

                {/* Rest of the mobile menu items... */}
                <Link 
                  to="/categorias" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-foreground/80 transition-colors"
                  onClick={closeMenu}
                >
                  <Grid size={18} className="text-neon-blue" />
                  <span>Categorias</span>
                </Link>

                <Link 
                  to="/fotos-gifs" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-foreground/80 transition-colors"
                  onClick={closeMenu}
                >
                  <Image size={18} className="text-neon-purple" />
                  <span>Fotos e GIFs</span>
                </Link>
              </div>

              {/* Countries Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('paises')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-pink font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe size={18} />
                    <span>PAÍSES</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'paises' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'paises' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/pais/brasil" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> Brasil
                    </Link>
                    <Link to="/pais/eua" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> EUA
                    </Link>
                    <Link to="/pais/japao" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> Japão
                    </Link>
                    <Link to="/pais/coreia" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> Coreia
                    </Link>
                    <Link to="/pais/italia" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> Itália
                    </Link>
                    <Link to="/pais/franca" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> França
                    </Link>
                    <Link to="/pais/espanha" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> Espanha
                    </Link>
                    <Link to="/pais/alemanha" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>
                      <Flag size={14} className="inline mr-1" /> Alemanha
                    </Link>
                  </div>
                )}
              </div>

              {/* Models Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('modelos')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-purple font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span>MODELOS</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'modelos' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'modelos' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/modelos/populares" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🔥 Populares</Link>
                    <Link to="/modelos/novos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>✨ Novos</Link>
                    <Link to="/modelos/vip" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>👑 VIP</Link>
                    <Link to="/modelos/verificados" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>✅ Verificados</Link>
                    <Link to="/modelos/plus" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>💎 Premium</Link>
                    <Link to="/modelos/estreantes" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🌟 Estreantes</Link>
                  </div>
                )}
              </div>

              {/* Categories Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('categorias')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-blue font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Grid size={18} />
                    <span>CATEGORIAS</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'categorias' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'categorias' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/categoria/amador" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎥 Amador</Link>
                    <Link to="/categoria/profissional" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎬 Profissional</Link>
                    <Link to="/categoria/casal" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>💑 Casal</Link>
                    <Link to="/categoria/solo" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👤 Solo</Link>
                    <Link to="/categoria/grupo" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👥 Grupo</Link>
                    <Link to="/categoria/lésbico" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👭 Lésbico</Link>
                    <Link to="/categoria/gay" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👬 Gay</Link>
                    <Link to="/categoria/trans" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>⚧ Trans</Link>
                    <Link to="/categoria/hentai" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎌 Hentai</Link>
                    <Link to="/categoria/anime" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>📺 Anime</Link>
                  </div>
                )}
              </div>

              {/* Shorties Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('shorties')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-pink font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={18} />
                    <span>SHORTIES</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'shorties' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'shorties' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/shorties/virais" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>📱 Virais</Link>
                    <Link to="/shorties/tendencias" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>📈 Tendências</Link>
                    <Link to="/shorties/desafios" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🎯 Desafios</Link>
                    <Link to="/shorties/dancinhas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>💃 Danças</Link>
                    <Link to="/shorties/funny" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>😂 Engraçados</Link>
                    <Link to="/shorties/sexy" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🔥 Sensuais</Link>
                  </div>
                )}
              </div>

              {/* Live Cams Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('live')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-purple font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Camera size={18} />
                    <span>LIVE CAMS</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'live' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'live' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/live/em-alta" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🔥 Em Alta</Link>
                    <Link to="/live/novas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>✨ Novas</Link>
                    <Link to="/live/grupo" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>👥 Grupo</Link>
                    <Link to="/live/privadas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🔒 Privadas</Link>
                    <Link to="/live/vr" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🥽 Realidade Virtual</Link>
                    <Link to="/live/4k" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🎥 4K Ultra HD</Link>
                  </div>
                )}
              </div>

              {/* Photos & GIFs Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('fotos')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-blue font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Image size={18} />
                    <span>FOTOS E GIFS</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'fotos' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'fotos' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/fotos/ensaios" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>📸 Ensaios</Link>
                    <Link to="/fotos/gifs-populares" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎞️ GIFs Populares</Link>
                    <Link to="/fotos/wallpapers" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🖼️ Wallpapers</Link>
                    <Link to="/fotos/albuns" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>📁 Álbuns</Link>
                    <Link to="/fotos/exclusivas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👑 Exclusivas</Link>
                    <Link to="/fotos/behind-scenes" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎬 Bastidores</Link>
                  </div>
                )}
              </div>

              {/* Podcasts Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('podcasts')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-pink font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Podcast size={18} />
                    <span>PODCASTS</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'podcasts' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'podcasts' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/podcasts/populares" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🎙️ Populares</Link>
                    <Link to="/podcasts/eroticos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🔞 Eróticos</Link>
                    <Link to="/podcasts/entrevistas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🎤 Entrevistas</Link>
                    <Link to="/audio/asmr" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🎧 ASMR</Link>
                    <Link to="/audio/contos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>📖 Contos Eróticos</Link>
                    <Link to="/audio/relaxamento" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}>🌙 Relaxamento</Link>
                  </div>
                )}
              </div>

              {/* VR & 360 Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('vr')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-purple font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Rocket size={18} />
                    <span>VR & 360°</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'vr' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'vr' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/vr/videos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🥽 Vídeos VR</Link>
                    <Link to="/vr/cams" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>📹 Cams VR</Link>
                    <Link to="/vr/360" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🔄 360°</Link>
                    <Link to="/vr/jogos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🎮 Jogos VR</Link>
                    <Link to="/vr/fotos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>📸 Fotos 360</Link>
                    <Link to="/vr/experiencias" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>✨ Experiências</Link>
                  </div>
                )}
              </div>

              {/* Store Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('store')}
                  className="flex items-center justify-between w-full px-4 py-2 text-neon-blue font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} />
                    <span>LOJA</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'store' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'store' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/loja/produtos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🛍️ Produtos</Link>
                    <Link to="/loja/assinaturas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>📦 Assinaturas</Link>
                    <Link to="/loja/vip" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👑 Clube VIP</Link>
                    <Link to="/loja/presentes" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎁 Presentes</Link>
                    <Link to="/loja/creditos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>💳 Créditos</Link>
                    <Link to="/loja/ofertas" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🏷️ Ofertas</Link>
                  </div>
                )}
              </div>

              {/* More Section */}
              <div className="border-t border-white/10 pt-4">
                <button 
                  onClick={() => toggleCategory('mais')}
                  className="flex items-center justify-between w-full px-4 py-2 text-foreground/80 font-semibold hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Compass size={18} />
                    <span>EXPLORAR MAIS</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === 'mais' ? 'rotate-180' : ''}`} />
                </button>
                
                {openCategory === 'mais' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/blog" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors" onClick={closeMenu}>📝 Blog</Link>
                    <Link to="/noticias" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors" onClick={closeMenu}>📰 Notícias</Link>
                    <Link to="/tutoriais" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors" onClick={closeMenu}>📚 Tutoriais</Link>
                    <Link to="/faq" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors" onClick={closeMenu}>❓ FAQ</Link>
                    <Link to="/suporte" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors" onClick={closeMenu}>🆘 Suporte</Link>
                    <Link to="/carreiras" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors" onClick={closeMenu}>💼 Carreiras</Link>
                  </div>
                )}
              </div>

              {/* Auth Buttons */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <Link 
                  to="/login" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors mb-2"
                  onClick={closeMenu}
                >
                  <LogIn size={18} />
                  <span>Entrar</span>
                </Link>
                <Link 
                  to="/signup" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all"
                  onClick={closeMenu}
                >
                  <User size={18} />
                  <span>Criar Conta</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 glass mt-20">
        <div className="max-container safe-area py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-black">
                  <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                    suck
                  </span>
                  <span className="text-foreground/40 mx-1">or</span>
                  <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                    sex
                  </span>
                </h2>
              </div>
              <p className="text-foreground/60 text-sm leading-relaxed">
                Plataforma premium de conteúdo adulto com design futurista e experiência imersiva.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-pink to-neon-purple rounded-full"></span>
                Navegação
              </h4>
              <ul className="space-y-2 text-foreground/60 text-sm">
                <li><Link to="/" className="hover:text-neon-pink transition-colors">Início</Link></li>
                <li><Link to="/categorias" className="hover:text-neon-pink transition-colors">Categorias</Link></li>
                <li><Link to="/modelos" className="hover:text-neon-pink transition-colors">Modelos</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-purple to-neon-blue rounded-full"></span>
                Política
              </h4>
              <ul className="space-y-2 text-foreground/60 text-sm">
                <li><a href="#" className="hover:text-neon-purple transition-colors">Termos de Serviço</a></li>
                <li><a href="#" className="hover:text-neon-purple transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-neon-purple transition-colors">Cookies</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-blue to-neon-pink rounded-full"></span>
                Contato
              </h4>
              <ul className="space-y-2 text-foreground/60 text-sm">
                <li><a href="#" className="hover:text-neon-blue transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-neon-pink transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-neon-purple transition-colors">Email</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-foreground/50 text-sm">© 2024 suck or sex. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-foreground/30 text-xs">18+</span>
              <span className="w-1 h-1 bg-foreground/30 rounded-full"></span>
              <p className="text-foreground/50 text-sm">Versão 1.0 • Conteúdo Adulto</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}