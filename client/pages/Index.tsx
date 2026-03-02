import { useState } from "react";
import { Play, Heart, Share2, Bookmark, Sparkles, TrendingUp, Flame, Eye, Clock, ChevronRight, X } from "lucide-react";
import Layout from "@/components/Layout";
import { Link, useNavigate } from "react-router-dom";

// Mock video data
const mockVideos = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: i % 2 === 0 
    ? `🔥 ${["VIP Exclusive", "Premium Content", "Behind the Scenes", "Private Show"][Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 100)}`
    : `✨ ${["Suck Sessions", "Sexy Moments", "Intimate", "Passionate"][Math.floor(Math.random() * 4)]} ${String.fromCharCode(65 + (i % 5))}`,
  thumbnail: `https://images.unsplash.com/photo-${1611162617 + i * 1000}?w=400&h=225&fit=crop&blur=${i % 3}`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
  views: Math.floor(Math.random() * 500000) + 50000,
  likes: Math.floor(Math.random() * 50000) + 5000,
  model: `Modelo ${String.fromCharCode(65 + (i % 8))}${String.fromCharCode(97 + (i % 5))}`,
  category: ["Suck", "Sex", "Premium", "Exclusive"][Math.floor(Math.random() * 4)],
  verified: Math.random() > 0.3,
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  comments: Math.floor(Math.random() * 1000) + 100,
  publishedAt: "2 dias atrás",
}));

// Simular se o usuário está logado
const isUserLoggedIn = false;

export default function Index() {
  const navigate = useNavigate();
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null);
  const [likedVideos, setLikedVideos] = useState<number[]>([]);
  const [savedVideos, setSavedVideos] = useState<number[]>([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleVideoClick = (videoId: number) => {
    navigate(`/video/${videoId}`);
  };

  const handleLike = (videoId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isUserLoggedIn) {
      setPendingAction('like');
      setShowAuthPopup(true);
      return;
    }
    
    setLikedVideos(prev => 
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const handleSave = (videoId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isUserLoggedIn) {
      setPendingAction('save');
      setShowAuthPopup(true);
      return;
    }
    
    setSavedVideos(prev => 
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const handleShare = (videoId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const videoUrl = `https://suckorsex.com/video/${videoId}`;
    
    navigator.clipboard.writeText(videoUrl).then(() => {
      alert('Link do vídeo copiado para a área de transferência!');
    }).catch(() => {
      prompt('Copie o link do vídeo:', videoUrl);
    });
  };

  const VideoCard = ({ video }: { video: (typeof mockVideos)[0] }) => {
    const isLiked = likedVideos.includes(video.id);
    const isSaved = savedVideos.includes(video.id);
    const isHovered = hoveredVideo === video.id;

    return (
      <div
        className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300 cursor-pointer"
        onMouseEnter={() => setHoveredVideo(video.id)}
        onMouseLeave={() => setHoveredVideo(null)}
        onClick={() => handleVideoClick(video.id)}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30">
          {/* Video Placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-purple-800/40 via-pink-800/40 to-blue-800/40 flex items-center justify-center">
            <Play size={48} className="text-white/40 group-hover:text-white/60 transition-colors" />
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-black/80 text-pink-400 text-xs font-semibold rounded border border-pink-500/30">
              {video.category}
            </span>
          </div>

          {/* Verified Badge */}
          {video.verified && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
          )}

          {/* Hover Play Button */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center animate-pulse">
                <Play size={24} fill="white" className="text-white ml-1" />
              </div>
            </div>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{video.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{(video.views / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-pink-400 transition-colors mb-1">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs">{video.model}</p>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Heart size={12} className={isLiked ? "text-pink-500 fill-pink-500" : ""} />
              <span>{(video.likes / 1000).toFixed(0)}K</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/10">
            <button
              onClick={(e) => handleLike(video.id, e)}
              className={`flex items-center justify-center gap-1 text-xs py-1.5 rounded transition-colors ${
                isLiked ? 'text-pink-500' : 'text-white/50 hover:text-pink-400'
              }`}
            >
              <Heart size={14} className={isLiked ? "fill-pink-500" : ""} />
              <span>Curtir</span>
            </button>
            
            <button
              onClick={(e) => handleSave(video.id, e)}
              className={`flex items-center justify-center gap-1 text-xs py-1.5 rounded transition-colors ${
                isSaved ? 'text-purple-500' : 'text-white/50 hover:text-purple-400'
              }`}
            >
              <Bookmark size={14} className={isSaved ? "fill-purple-500" : ""} />
              <span>Salvar</span>
            </button>
            
            <button
              onClick={(e) => handleShare(video.id, e)}
              className="flex items-center justify-center gap-1 text-xs py-1.5 rounded text-white/50 hover:text-blue-400 transition-colors"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const VideoSection = ({ title, videos, icon }: { 
    title: string; 
    videos: (typeof mockVideos)[0][]; 
    icon?: React.ReactNode;
  }) => (
    <section className="py-6 first:pt-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-pink-400">{icon}</span>}
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <span className="text-xs text-white/30">{videos.length} vídeos</span>
        </div>
        <Link to="#" className="text-sm text-white/50 hover:text-pink-400 transition-colors flex items-center gap-1">
          Ver Todos <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );

  const categories = [
    { name: "Todos", path: "/categoria/todos" },
    { name: "Suck", path: "/categoria/suck" },
    { name: "Sex", path: "/categoria/sex" },
    { name: "Premium", path: "/categoria/premium" },
    { name: "Exclusive", path: "/categoria/exclusive" },
    { name: "Novos", path: "/categoria/novos" },
    { name: "Em Alta", path: "/categoria/em-alta" }
  ];

  return (
    <Layout hideHeader={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.path}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                cat.name === "Todos" 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Video Sections */}
        <div className="space-y-8">
          <VideoSection 
            title="Em Alta Agora" 
            icon={<Flame size={18} />}
            videos={mockVideos.slice(0, 4)} 
          />
          
          <VideoSection 
            title="Suck Collection" 
            icon={<span>👄</span>}
            videos={mockVideos.slice(2, 6)} 
          />
          
          <VideoSection 
            title="Sexy Premium" 
            icon={<Heart size={18} />}
            videos={mockVideos.slice(4, 8)} 
          />
          
          <VideoSection 
            title="Novos Lançamentos" 
            icon={<Sparkles size={18} />}
            videos={mockVideos.slice(6, 10)} 
          />
        </div>

        {/* Load More */}
        <div className="py-8 text-center">
          <button className="px-6 py-3 bg-white/5 rounded-lg border border-white/10 hover:border-pink-500/30 transition-all">
            <span className="text-white/70 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Carregar mais vídeos
            </span>
          </button>
        </div>

        {/* Pop-up de Autenticação */}
        {showAuthPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative max-w-md w-full bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl border border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
              
              <button
                onClick={() => setShowAuthPopup(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                  {pendingAction === 'like' && <Heart size={32} className="text-white fill-white" />}
                  {pendingAction === 'save' && <Bookmark size={32} className="text-white fill-white" />}
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  {pendingAction === 'like' ? 'Curtir vídeo' : 'Salvar vídeo'}
                </h3>
                
                <p className="text-white/70 mb-8">
                  Crie uma conta ou faça login para {pendingAction === 'like' ? 'curtir' : 'salvar'} vídeos e muito mais!
                </p>

                <div className="space-y-3">
                  <Link
                    to="/signup"
                    className="block w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all"
                    onClick={() => setShowAuthPopup(false)}
                  >
                    Criar Conta Grátis
                  </Link>
                  
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20"
                    onClick={() => setShowAuthPopup(false)}
                  >
                    Já tenho uma conta
                  </Link>

                  <button
                    onClick={() => setShowAuthPopup(false)}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    Continuar navegando
                  </button>
                </div>

                <p className="mt-6 text-xs text-white/30">
                  Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}