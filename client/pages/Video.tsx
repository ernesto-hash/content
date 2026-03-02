import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Play, Heart, Share2, Bookmark, Sparkles, TrendingUp, Flame, 
  Eye, Clock, ChevronRight, X, ThumbsUp, ThumbsDown, MessageCircle, 
  Send, Flag, MoreHorizontal, User, Calendar, Users, Award,
  Download, Volume2, VolumeX, Maximize, Minimize, SkipForward,
  SkipBack, Pause, RotateCcw, RotateCw, List, Grid, ChevronUp
} from "lucide-react";
import Layout from "@/components/Layout";

// Mock video data (mesmo do index)
const mockVideos = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: i % 2 === 0 
    ? `🔥 ${["VIP Exclusive", "Premium Content", "Behind the Scenes", "Private Show"][Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 100)}`
    : `✨ ${["Suck Sessions", "Sexy Moments", "Intimate", "Passionate"][Math.floor(Math.random() * 4)]} ${String.fromCharCode(65 + (i % 5))}`,
  thumbnail: `https://images.unsplash.com/photo-${1611162617 + i * 1000}?w=400&h=225&fit=crop&blur=${i % 3}`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
  views: Math.floor(Math.random() * 500000) + 50000,
  likes: Math.floor(Math.random() * 50000) + 5000,
  dislikes: Math.floor(Math.random() * 5000) + 500,
  model: `Modelo ${String.fromCharCode(65 + (i % 8))}${String.fromCharCode(97 + (i % 5))}`,
  category: ["Suck", "Sex", "Premium", "Exclusive"][Math.floor(Math.random() * 4)],
  verified: Math.random() > 0.3,
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  comments: Math.floor(Math.random() * 1000) + 100,
  publishedAt: "2 dias atrás",
  subscribers: Math.floor(Math.random() * 100000) + 10000,
}));

// Mock comments
const mockComments = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  user: `Usuário ${String.fromCharCode(65 + i)}`,
  avatar: `https://images.unsplash.com/photo-${1611162617 + i * 100}?w=32&h=32&fit=crop`,
  comment: [
    "Excelente vídeo! Muito bom mesmo 👏",
    "Adorei o conteúdo, parabéns! 🔥",
    "Melhor vídeo que já vi nessa categoria",
    "Incrível, quero ver mais desse modelo",
    "Top demais! Compartilhei com meus amigos",
    "Qualidade 4K impressionante",
    "Merece mais views, conteúdo premium",
    "Já estou seguindo, muito bom!"
  ][i],
  timestamp: `${Math.floor(Math.random() * 23) + 1} horas atrás`,
  likes: Math.floor(Math.random() * 100),
  replies: Math.floor(Math.random() * 10),
}));

// Simular se o usuário está logado
const isUserLoggedIn = false;

export default function Video() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoId = parseInt(id || "1");
  
  const [video, setVideo] = useState<(typeof mockVideos)[0] | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<typeof mockVideos>([]);
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    // Encontrar o vídeo atual
    const currentVideo = mockVideos.find(v => v.id === videoId) || mockVideos[0];
    setVideo(currentVideo);
    
    // Filtrar vídeos recomendados (excluir o atual)
    const recommended = mockVideos.filter(v => v.id !== videoId).slice(0, 8);
    setRecommendedVideos(recommended);

    // Controlar botão de voltar ao topo
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [videoId]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!video) {
    return (
      <Layout hideHeader={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center animate-pulse">
              <Play size={32} className="text-white" />
            </div>
            <p className="text-white/70">Carregando vídeo...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleLike = () => {
    if (!isUserLoggedIn) {
      setPendingAction('like');
      setShowAuthPopup(true);
      return;
    }
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    if (!isUserLoggedIn) {
      setPendingAction('dislike');
      setShowAuthPopup(true);
      return;
    }
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  const handleSave = () => {
    if (!isUserLoggedIn) {
      setPendingAction('save');
      setShowAuthPopup(true);
      return;
    }
    setIsSaved(!isSaved);
  };

  const handleSubscribe = () => {
    if (!isUserLoggedIn) {
      setPendingAction('subscribe');
      setShowAuthPopup(true);
      return;
    }
    setIsSubscribed(!isSubscribed);
  };

  const handleShare = () => {
    const videoUrl = `https://suckorsex.com/video/${video.id}`;
    navigator.clipboard.writeText(videoUrl).then(() => {
      alert('Link do vídeo copiado!');
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserLoggedIn) {
      setPendingAction('comment');
      setShowAuthPopup(true);
      return;
    }
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        user: "Você",
        avatar: "",
        comment: newComment,
        timestamp: "Agora mesmo",
        likes: 0,
        replies: 0,
      };
      setComments([newCommentObj, ...comments]);
      setNewComment("");
    }
  };

  const RecommendedCard = ({ video }: { video: (typeof mockVideos)[0] }) => (
    <div
      className="group flex gap-2 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
      onClick={() => navigate(`/video/${video.id}`)}
    >
      <div className="relative w-40 h-24 flex-shrink-0">
        <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-purple-800/40 via-pink-800/40 to-blue-800/40 flex items-center justify-center">
            <Play size={24} className="text-white/40 group-hover:text-white/60" />
          </div>
        </div>
        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded">
          {video.duration}
        </span>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-pink-400 transition-colors">
          {video.title}
        </h4>
        <p className="text-xs text-white/50 mt-1">{video.model}</p>
        <div className="flex items-center gap-2 mt-1 text-white/40 text-[10px]">
          <span>{video.views.toLocaleString()} views</span>
          <span>•</span>
          <span>{video.publishedAt}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Layout hideHeader={true}>
      {/* Botão de voltar ao topo */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-110 transition-all"
        >
          <ChevronUp size={24} className="text-white" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal - Vídeo e comentários */}
          <div className="lg:col-span-2 space-y-4">
            {/* Player de Vídeo */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group">
              {/* Placeholder do vídeo */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                <Play size={80} className="text-white/30" />
              </div>
              
              {/* Controles do player */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                      <SkipBack size={16} className="text-white" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                      <SkipForward size={16} className="text-white" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
                    </button>
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      {isFullscreen ? <Minimize size={16} className="text-white" /> : <Maximize size={16} className="text-white" />}
                    </button>
                  </div>
                </div>
                
                {/* Barra de progresso */}
                <div className="mt-2 h-1 bg-white/20 rounded-full cursor-pointer">
                  <div className="w-1/3 h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                </div>
              </div>
              
              {/* Botão play central */}
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                <Play size={32} fill="white" className="text-white ml-1" />
              </button>
            </div>

            {/* Título e ações */}
            <div className="space-y-4">
              <h1 className="text-xl md:text-2xl font-bold text-white">{video.title}</h1>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{video.model}</p>
                        {video.verified && <Sparkles size={14} className="text-pink-400" />}
                      </div>
                      <p className="text-xs text-white/50">{video.subscribers.toLocaleString()} inscritos</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSubscribe}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isSubscribed 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                    }`}
                  >
                    {isSubscribed ? 'Inscrito' : 'Inscrever-se'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white/5 rounded-lg">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1 px-3 py-2 rounded-l-lg transition-colors ${
                        isLiked ? 'text-pink-500' : 'text-white/50 hover:text-pink-400'
                      }`}
                    >
                      <ThumbsUp size={18} className={isLiked ? 'fill-pink-500' : ''} />
                      <span className="text-sm">{video.likes.toLocaleString()}</span>
                    </button>
                    <div className="w-px h-5 bg-white/10"></div>
                    <button
                      onClick={handleDislike}
                      className={`flex items-center gap-1 px-3 py-2 rounded-r-lg transition-colors ${
                        isDisliked ? 'text-pink-500' : 'text-white/50 hover:text-pink-400'
                      }`}
                    >
                      <ThumbsDown size={18} className={isDisliked ? 'fill-pink-500' : ''} />
                      <span className="text-sm">{video.dislikes.toLocaleString()}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      isSaved ? 'text-purple-500 bg-purple-500/10' : 'text-white/50 hover:text-purple-400 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Bookmark size={18} className={isSaved ? 'fill-purple-500' : ''} />
                    <span className="text-sm">Salvar</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-white/50 hover:text-blue-400 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Share2 size={18} />
                    <span className="text-sm">Compartilhar</span>
                  </button>
                </div>
              </div>

              {/* Informações do vídeo */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{video.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{video.publishedAt}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award size={14} />
                    <span>{video.category}</span>
                  </div>
                </div>
                
                <p className="text-white/70 text-sm leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>

            {/* Seção de comentários */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageCircle size={18} className="text-pink-400" />
                  Comentários ({comments.length})
                </h3>
                <button className="text-sm text-white/50 hover:text-white flex items-center gap-1">
                  <List size={14} />
                  Ordenar por
                </button>
              </div>

              {/* Input de comentário */}
              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-white" />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-pink-400 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>

              {/* Lista de comentários */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500/50 to-purple-500/50 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{comment.user}</span>
                        <span className="text-[10px] text-white/30">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-white/80 mt-1">{comment.comment}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1 text-xs text-white/50 hover:text-pink-400">
                          <ThumbsUp size={12} />
                          <span>{comment.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs text-white/50 hover:text-pink-400">
                          <MessageCircle size={12} />
                          <span>{comment.replies} respostas</span>
                        </button>
                        <button className="text-xs text-white/30 hover:text-white">Responder</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ver mais comentários */}
              <button className="w-full py-2 text-center text-sm text-pink-400 hover:text-pink-300 transition-colors">
                Ver mais comentários
              </button>
            </div>
          </div>

          {/* Coluna lateral - Vídeos recomendados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-pink-400" />
                Recomendados
              </h3>
              <button className="text-sm text-white/50 hover:text-white flex items-center gap-1">
                <Grid size={14} />
                Ver todos
              </button>
            </div>

            <div className="space-y-2">
              {recommendedVideos.map((video) => (
                <RecommendedCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
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
                {pendingAction === 'like' && <ThumbsUp size={32} className="text-white" />}
                {pendingAction === 'dislike' && <ThumbsDown size={32} className="text-white" />}
                {pendingAction === 'save' && <Bookmark size={32} className="text-white" />}
                {pendingAction === 'subscribe' && <Users size={32} className="text-white" />}
                {pendingAction === 'comment' && <MessageCircle size={32} className="text-white" />}
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {pendingAction === 'like' && 'Curtir vídeo'}
                {pendingAction === 'dislike' && 'Não curtir vídeo'}
                {pendingAction === 'save' && 'Salvar vídeo'}
                {pendingAction === 'subscribe' && 'Inscrever-se'}
                {pendingAction === 'comment' && 'Comentar'}
              </h3>
              
              <p className="text-white/70 mb-8">
                Crie uma conta ou faça login para interagir com o conteúdo!
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
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}