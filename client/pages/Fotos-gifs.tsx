import { useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { 
  Image,
  Film,
  Heart,
  Eye,
  Star,
  Download,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  List,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle,
  Crown,
  Zap,
  Award,
  Camera,
  Video,
  Users,
  User,
  Clock,
  Calendar,
  MapPin,
  Globe,
  Flag,
  Tag,
  Hash,
  Sparkles,
  Flame,
  TrendingUp,
  Music,
  Mic,
  Headphones,
  Gamepad2,
  Drama,
  Smile,
  Gift,
  ShoppingBag,
  Lock,
  Unlock,
  Plus,
  Minus,
  Search,
  X,
  Menu,
  Home,
  Compass,
  BookOpen,
  Podcast,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Circle,
  CircleDot,
  CircleDotDashed,
  ThumbsUp,
  MessageCircle,
  MessageSquare,
  Info,
  HelpCircle,
  Shield
} from "lucide-react";

export default function FotosGifsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('recentes');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedType, setSelectedType] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Dados mockados para fotos
  const fotos = {
    populares: [
      {
        id: 1,
        title: "Ensaio Sensual - Luna Star",
        description: "Fotos exclusivas do ensaio mais quente do mês",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
        type: "photo",
        width: 800,
        height: 1200,
        views: "1.2M",
        likes: "85K",
        comments: "1.2K",
        shares: "5.4K",
        author: "Luna Star",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        category: "Ensaio",
        tags: ["sensual", "lingerie", "exclusivo"],
        date: "2 horas atrás",
        resolution: "4K",
        size: "4.2 MB"
      },
      {
        id: 2,
        title: "Momento Íntimo",
        description: "Flagra sensual nos bastidores",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1200&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
        type: "photo",
        width: 800,
        height: 1200,
        views: "890K",
        likes: "67K",
        comments: "892",
        shares: "3.2K",
        author: "Sofia Santos",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        category: "Bastidores",
        tags: ["intimo", "natural"],
        date: "5 horas atrás",
        resolution: "Full HD",
        size: "2.8 MB"
      },
      {
        id: 3,
        title: "Praia Privativa",
        description: "Dia de sol em praia paradisíaca",
        image: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=800&h=1200&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&h=600&fit=crop",
        type: "photo",
        width: 800,
        height: 1200,
        views: "2.1M",
        likes: "156K",
        comments: "2.3K",
        shares: "8.9K",
        author: "Isabella Rodriguez",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        category: "Praia",
        tags: ["praia", "biquini", "sol"],
        date: "1 hora atrás",
        resolution: "4K",
        size: "5.1 MB"
      },
      {
        id: 4,
        title: "Lingerie Vermelha",
        description: "Ensaio temático com lingerie vermelha",
        image: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=800&h=1200&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=600&fit=crop",
        type: "photo",
        width: 800,
        height: 1200,
        views: "560K",
        likes: "42K",
        comments: "567",
        shares: "2.1K",
        author: "Maya Rodriguez",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        category: "Lingerie",
        tags: ["lingerie", "vermelho"],
        date: "1 dia atrás",
        resolution: "HD",
        size: "1.9 MB"
      },
      {
        id: 5,
        title: "Casal Apaixonado",
        description: "Momento romântico a dois",
        image: "https://images.unsplash.com/photo-1548142813-c34835dfe326?w=800&h=1200&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1548142813-c34835dfe326?w=400&h=600&fit=crop",
        type: "photo",
        width: 800,
        height: 1200,
        views: "1.5M",
        likes: "98K",
        comments: "1.5K",
        shares: "4.7K",
        author: "Alice & Bia",
        authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        category: "Casal",
        tags: ["casal", "romantico"],
        date: "3 horas atrás",
        resolution: "Full HD",
        size: "3.2 MB"
      },
      {
        id: 6,
        title: "Fetiche - Pés",
        description: "Sessão de fotos focada em pés",
        image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
        type: "photo",
        width: 800,
        height: 1200,
        views: "980K",
        likes: "71K",
        comments: "1.1K",
        shares: "3.8K",
        author: "Carol Lima",
        authorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        category: "Fetiche",
        tags: ["pes", "fetiche"],
        date: "6 horas atrás",
        resolution: "HD",
        size: "2.1 MB"
      }
    ],
    gifs: [
      {
        id: 7,
        title: "Dança Sensual",
        description: "GIF animado com coreografia sensual",
        gif: "https://media.giphy.com/media/3o7abB06u9bNzA8LC8/giphy.gif",
        thumbnail: "https://media.giphy.com/media/3o7abB06u9bNzA8LC8/giphy.gif",
        type: "gif",
        width: 480,
        height: 480,
        views: "3.2M",
        likes: "245K",
        comments: "3.4K",
        shares: "12.5K",
        author: "Luna Star",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        category: "Dança",
        tags: ["danca", "gif", "sexy"],
        date: "30 minutos atrás",
        duration: "3s",
        frames: 45,
        size: "1.8 MB"
      },
      {
        id: 8,
        title: "Beijo Ardente",
        description: "GIF de casal se beijando",
        gif: "https://media.giphy.com/media/l0MYt5jH6gkTWm8qo/giphy.gif",
        thumbnail: "https://media.giphy.com/media/l0MYt5jH6gkTWm8qo/giphy.gif",
        type: "gif",
        width: 480,
        height: 360,
        views: "2.8M",
        likes: "189K",
        comments: "2.8K",
        shares: "7.2K",
        author: "Casal 69",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        category: "Casal",
        tags: ["beijo", "casal"],
        date: "2 horas atrás",
        duration: "2s",
        frames: 30,
        size: "1.2 MB"
      },
      {
        id: 9,
        title: "Strip Tease",
        description: "GIF de strip tease rápido",
        gif: "https://media.giphy.com/media/3o7abB06u9bNzA8LC8/giphy.gif",
        thumbnail: "https://media.giphy.com/media/3o7abB06u9bNzA8LC8/giphy.gif",
        type: "gif",
        width: 480,
        height: 480,
        views: "450K",
        likes: "34K",
        comments: "456",
        shares: "1.8K",
        author: "Isabella",
        authorAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        verified: false,
        vip: false,
        category: "Strip",
        tags: ["strip", "sexy"],
        date: "4 horas atrás",
        duration: "4s",
        frames: 60,
        size: "2.3 MB"
      },
      {
        id: 10,
        title: "Olhar Sedutor",
        description: "GIF com olhar penetrante",
        gif: "https://media.giphy.com/media/l0MYt5jH6gkTWm8qo/giphy.gif",
        thumbnail: "https://media.giphy.com/media/l0MYt5jH6gkTWm8qo/giphy.gif",
        type: "gif",
        width: 480,
        height: 480,
        views: "890K",
        likes: "67K",
        comments: "892",
        shares: "3.4K",
        author: "Maya",
        authorAvatar: "https://images.unsplash.com/photo-1494790108777-383d5602d5c2?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        category: "Expressão",
        tags: ["olhar", "sedutor"],
        date: "5 horas atrás",
        duration: "2s",
        frames: 25,
        size: "1.1 MB"
      }
    ],
    albums: [
      {
        id: 11,
        name: "Ensaio Completo - Luna Star",
        description: "Álbum com 50 fotos exclusivas",
        coverImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        type: "album",
        photoCount: 50,
        views: "890K",
        likes: "67K",
        author: "Luna Star",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        verified: true,
        vip: true,
        category: "Ensaio",
        tags: ["album", "completo"],
        date: "1 semana atrás"
      },
      {
        id: 12,
        name: "Férias na Praia",
        description: "Álbum com fotos da viagem",
        coverImage: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&h=400&fit=crop",
        type: "album",
        photoCount: 35,
        views: "560K",
        likes: "42K",
        author: "Sofia Santos",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        verified: true,
        vip: false,
        category: "Viagem",
        tags: ["praia", "ferias"],
        date: "3 dias atrás"
      }
    ]
  };

  const filters = [
    { id: 'recentes', label: 'Recentes', icon: Clock },
    { id: 'populares', label: 'Populares', icon: Flame },
    { id: 'maisVistos', label: 'Mais Vistos', icon: Eye },
    { id: 'maisCurtidos', label: 'Mais Curtidos', icon: Heart },
  ];

  const categories = [
    { id: 'todas', label: 'Todas', icon: Image },
    { id: 'ensaios', label: 'Ensaios', icon: Camera },
    { id: 'bastidores', label: 'Bastidores', icon: Film },
    { id: 'praia', label: 'Praia', icon: MapPin },
    { id: 'lingerie', label: 'Lingerie', icon: Gift },
    { id: 'casal', label: 'Casal', icon: Users },
    { id: 'solo', label: 'Solo', icon: User },
    { id: 'fetiche', label: 'Fetiche', icon: Zap },
    { id: 'artistico', label: 'Artístico', icon: Image },
    { id: 'cosplay', label: 'Cosplay', icon: Drama },
  ];

  const types = [
    { id: 'todos', label: 'Todos', icon: Image },
    { id: 'fotos', label: 'Fotos', icon: Camera },
    { id: 'gifs', label: 'GIFs', icon: Film },
    { id: 'albuns', label: 'Álbuns', icon: Grid3x3 },
  ];

  const PhotoCard = ({ photo }: { photo: any }) => (
    <div 
      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 cursor-pointer"
      onClick={() => {
        setSelectedMedia(photo);
        setShowMediaModal(true);
      }}
    >
      <img 
        src={photo.thumbnail} 
        alt={photo.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      
      {/* Overlay com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium text-white line-clamp-1 mb-1">
            {photo.title}
          </h3>
          <p className="text-xs text-white/60 line-clamp-1 mb-2">
            {photo.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {photo.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={10} className="text-neon-pink" />
              {photo.likes}
            </span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {photo.vip && (
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Crown size={10} />
            VIP
          </span>
        )}
        {photo.resolution === '4K' && (
          <span className="bg-neon-blue text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Maximize2 size={10} />
            4K
          </span>
        )}
      </div>

      {/* Type indicator */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
        <Camera size={10} />
        Foto
      </div>

      {/* Author avatar */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <img 
          src={photo.authorAvatar} 
          alt={photo.author}
          className="w-6 h-6 rounded-full border border-white/20"
        />
        <span className="text-xs text-white">{photo.author}</span>
        {photo.verified && (
          <CheckCircle size={10} className="text-neon-blue" />
        )}
      </div>
    </div>
  );

  const GifCard = ({ gif }: { gif: any }) => (
    <div 
      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 cursor-pointer"
      onClick={() => {
        setSelectedMedia(gif);
        setShowMediaModal(true);
      }}
    >
      <img 
        src={gif.thumbnail} 
        alt={gif.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      
      {/* Overlay com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium text-white line-clamp-1 mb-1">
            {gif.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {gif.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={10} className="text-neon-pink" />
              {gif.likes}
            </span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        {gif.vip && (
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Crown size={10} />
            VIP
          </span>
        )}
      </div>

      {/* Type indicator with duration */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
        <Film size={10} />
        GIF • {gif.duration}
      </div>

      {/* Play icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-neon-pink/80 flex items-center justify-center">
          <Play size={16} className="text-white ml-1" />
        </div>
      </div>
    </div>
  );

  const AlbumCard = ({ album }: { album: any }) => (
    <div 
      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 cursor-pointer"
      onClick={() => {
        setSelectedMedia(album);
        setShowMediaModal(true);
      }}
    >
      <img 
        src={album.coverImage} 
        alt={album.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      
      {/* Overlay com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium text-white line-clamp-1 mb-1">
            {album.name}
          </h3>
          <p className="text-xs text-white/60 line-clamp-1 mb-2">
            {album.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Image size={10} />
              {album.photoCount} fotos
            </span>
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {album.views}
            </span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2">
        {album.vip && (
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Crown size={10} />
            VIP
          </span>
        )}
      </div>

      {/* Type indicator */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
        <Grid3x3 size={10} />
        Álbum
      </div>
    </div>
  );

  const PhotoListItem = ({ photo }: { photo: any }) => (
    <div 
      className="flex gap-4 bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
      onClick={() => {
        setSelectedMedia(photo);
        setShowMediaModal(true);
      }}
    >
      <div className="relative w-24 aspect-[2/3]">
        <img 
          src={photo.thumbnail} 
          alt={photo.title}
          className="w-full h-full object-cover"
        />
        
        {/* Badges */}
        {photo.vip && (
          <div className="absolute top-1 left-1">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Crown size={8} />
              VIP
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 py-2 pr-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors">
              {photo.title}
            </h3>
            <p className="text-xs text-foreground/60 line-clamp-1">
              {photo.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <img 
            src={photo.authorAvatar} 
            alt={photo.author}
            className="w-5 h-5 rounded-full"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground/80">{photo.author}</span>
            {photo.verified && (
              <CheckCircle size={10} className="text-neon-blue" />
            )}
          </div>
          <span className="text-xs text-foreground/40">{photo.date}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-foreground/60">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {photo.views}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} className="text-neon-pink" />
            {photo.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} />
            {photo.comments}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={12} />
            {photo.resolution}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {photo.tags.slice(0, 3).map((tag: string, index: number) => (
            <span key={index} className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-foreground/40">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const GifListItem = ({ gif }: { gif: any }) => (
    <div 
      className="flex gap-4 bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
      onClick={() => {
        setSelectedMedia(gif);
        setShowMediaModal(true);
      }}
    >
      <div className="relative w-24 aspect-square">
        <img 
          src={gif.thumbnail} 
          alt={gif.title}
          className="w-full h-full object-cover"
        />
        
        {/* Duration */}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
          {gif.duration}
        </div>

        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-full bg-neon-pink/80 flex items-center justify-center">
            <Play size={10} className="text-white ml-0.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 py-2 pr-3">
        <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors mb-1">
          {gif.title}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <img 
            src={gif.authorAvatar} 
            alt={gif.author}
            className="w-5 h-5 rounded-full"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground/80">{gif.author}</span>
            {gif.verified && (
              <CheckCircle size={10} className="text-neon-blue" />
            )}
          </div>
          <span className="text-xs text-foreground/40">{gif.date}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-foreground/60">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {gif.views}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} className="text-neon-pink" />
            {gif.likes}
          </span>
          <span className="flex items-center gap-1">
            <Film size={12} />
            {gif.frames} frames
          </span>
        </div>
      </div>
    </div>
  );

  const AlbumListItem = ({ album }: { album: any }) => (
    <div 
      className="flex gap-4 bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
      onClick={() => {
        setSelectedMedia(album);
        setShowMediaModal(true);
      }}
    >
      <div className="relative w-24 aspect-square">
        <img 
          src={album.coverImage} 
          alt={album.name}
          className="w-full h-full object-cover"
        />
        
        {/* Photo count */}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
          {album.photoCount}
        </div>
      </div>

      <div className="flex-1 py-2 pr-3">
        <h3 className="font-medium text-foreground group-hover:text-neon-pink transition-colors mb-1">
          {album.name}
        </h3>
        <p className="text-xs text-foreground/60 line-clamp-1 mb-2">
          {album.description}
        </p>

        <div className="flex items-center gap-2 mb-2">
          <img 
            src={album.authorAvatar} 
            alt={album.author}
            className="w-5 h-5 rounded-full"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground/80">{album.author}</span>
            {album.verified && (
              <CheckCircle size={10} className="text-neon-blue" />
            )}
          </div>
          <span className="text-xs text-foreground/40">{album.date}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-foreground/60">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {album.views}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} className="text-neon-pink" />
            {album.likes}
          </span>
          <span className="flex items-center gap-1">
            <Image size={12} />
            {album.photoCount} fotos
          </span>
        </div>
      </div>
    </div>
  );

  const MediaModal = () => {
    if (!selectedMedia) return null;

    const isPhoto = selectedMedia.type === 'photo';
    const isGif = selectedMedia.type === 'gif';
    const isAlbum = selectedMedia.type === 'album';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-6xl h-[90vh] flex flex-col glass rounded-2xl border border-white/10 animate-slideUp">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPhoto && <Camera size={20} className="text-neon-pink" />}
              {isGif && <Film size={20} className="text-neon-purple" />}
              {isAlbum && <Grid3x3 size={20} className="text-neon-blue" />}
              <h2 className="text-lg font-semibold text-foreground">
                {selectedMedia.title || selectedMedia.name}
              </h2>
              {selectedMedia.vip && (
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Crown size={10} />
                  VIP
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowMediaModal(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} className="text-foreground/60" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Media display */}
              <div className="lg:w-2/3">
                {isPhoto && (
                  <img 
                    src={selectedMedia.image} 
                    alt={selectedMedia.title}
                    className="w-full rounded-xl"
                  />
                )}
                {isGif && (
                  <img 
                    src={selectedMedia.gif} 
                    alt={selectedMedia.title}
                    className="w-full rounded-xl"
                  />
                )}
                {isAlbum && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map((item) => (
                      <img 
                        key={item}
                        src={selectedMedia.coverImage}
                        alt={`Foto ${item}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="lg:w-1/3 space-y-4">
                {/* Author info */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground/60 mb-3">Sobre</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={selectedMedia.authorAvatar} 
                      alt={selectedMedia.author}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{selectedMedia.author}</span>
                        {selectedMedia.verified && (
                          <CheckCircle size={14} className="text-neon-blue" />
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">Publicado {selectedMedia.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80">
                    {selectedMedia.description || selectedMedia.longDescription}
                  </p>
                </div>

                {/* Stats */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground/60 mb-3">Estatísticas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <Eye size={16} className="mx-auto mb-1 text-neon-pink" />
                      <p className="text-lg font-bold text-foreground">{selectedMedia.views}</p>
                      <p className="text-xs text-foreground/40">Visualizações</p>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <Heart size={16} className="mx-auto mb-1 text-neon-pink" />
                      <p className="text-lg font-bold text-foreground">{selectedMedia.likes}</p>
                      <p className="text-xs text-foreground/40">Curtidas</p>
                    </div>
                    {selectedMedia.comments && (
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <MessageCircle size={16} className="mx-auto mb-1 text-neon-purple" />
                        <p className="text-lg font-bold text-foreground">{selectedMedia.comments}</p>
                        <p className="text-xs text-foreground/40">Comentários</p>
                      </div>
                    )}
                    {selectedMedia.shares && (
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <Share2 size={16} className="mx-auto mb-1 text-neon-blue" />
                        <p className="text-lg font-bold text-foreground">{selectedMedia.shares}</p>
                        <p className="text-xs text-foreground/40">Compart.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground/60 mb-3">Detalhes</h3>
                  <div className="space-y-2 text-sm">
                    {isPhoto && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Resolução</span>
                          <span className="text-foreground">{selectedMedia.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Dimensões</span>
                          <span className="text-foreground">{selectedMedia.width} x {selectedMedia.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Tamanho</span>
                          <span className="text-foreground">{selectedMedia.size}</span>
                        </div>
                      </>
                    )}
                    {isGif && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Duração</span>
                          <span className="text-foreground">{selectedMedia.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Frames</span>
                          <span className="text-foreground">{selectedMedia.frames}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Tamanho</span>
                          <span className="text-foreground">{selectedMedia.size}</span>
                        </div>
                      </>
                    )}
                    {isAlbum && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Total de fotos</span>
                          <span className="text-foreground">{selectedMedia.photoCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Categoria</span>
                          <span className="text-foreground">{selectedMedia.category}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Categoria</span>
                      <span className="text-foreground">{selectedMedia.category}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground/60 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedMedia.tags.map((tag: string, index: number) => (
                      <span key={index} className="text-xs px-2 py-1 bg-white/5 rounded-full text-foreground/60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-2">
                    <Download size={16} />
                    Download
                  </button>
                  <button className="flex-1 py-3 bg-white/5 text-foreground/80 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                    <Heart size={16} />
                    Curtir
                  </button>
                  <button className="p-3 bg-white/5 text-foreground/60 rounded-lg hover:text-neon-pink hover:bg-white/10 transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                Fotos e GIFs
              </span>
            </h1>
            <p className="text-foreground/60">
              Explore milhares de fotos e GIFs sensuais exclusivos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Type filter quick buttons */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setSelectedType('todos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === 'todos' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedType('fotos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === 'fotos' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Fotos
              </button>
              <button
                onClick={() => setSelectedType('gifs')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === 'gifs' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                GIFs
              </button>
              <button
                onClick={() => setSelectedType('albuns')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === 'albuns' 
                    ? 'bg-neon-pink text-white' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Álbuns
              </button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ordenar por */}
              <div>
                <h4 className="text-sm font-medium text-foreground/60 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-neon-pink rounded-full"></span>
                  Ordenar por
                </h4>
                <div className="flex flex-wrap gap-2">
                  {filters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        selectedFilter === filter.id
                          ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                          : 'bg-white/5 text-foreground/60 hover:text-foreground border border-white/10'
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
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                          : 'bg-white/5 text-foreground/60 hover:text-foreground border border-white/10'
                      }`}
                    >
                      <category.icon size={14} />
                      <span className="text-sm">{category.label}</span>
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
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-white/5 text-foreground/60 hover:text-foreground rounded-lg border border-white/10 text-sm">
                    Todas
                  </button>
                  <button className="px-4 py-2 bg-neon-blue/20 text-neon-blue rounded-lg border border-neon-blue/30 text-sm">
                    4K
                  </button>
                  <button className="px-4 py-2 bg-white/5 text-foreground/60 hover:text-foreground rounded-lg border border-white/10 text-sm">
                    Full HD
                  </button>
                  <button className="px-4 py-2 bg-white/5 text-foreground/60 hover:text-foreground rounded-lg border border-white/10 text-sm">
                    HD
                  </button>
                </div>
              </div>
            </div>

            {/* Apply filters */}
            <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
              <button className="px-6 py-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all">
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Categories quick navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.filter(c => c.id !== 'todas').map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                    : 'bg-white/5 text-foreground/60 hover:text-foreground border border-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fotos Populares */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="text-neon-pink" size={20} />
              <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                Fotos Populares
              </span>
            </h2>
            <Link to="/fotos/populares" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-pink transition-colors">
              Ver todas
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {fotos.populares.map(foto => (
                <PhotoCard key={foto.id} photo={foto} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {fotos.populares.map(foto => (
                <PhotoListItem key={foto.id} photo={foto} />
              ))}
            </div>
          )}
        </section>

        {/* GIFs em Alta */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Film className="text-neon-purple" size={20} />
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                GIFs em Alta
              </span>
            </h2>
            <Link to="/gifs/populares" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-purple transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {fotos.gifs.map(gif => (
                <GifCard key={gif.id} gif={gif} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {fotos.gifs.map(gif => (
                <GifListItem key={gif.id} gif={gif} />
              ))}
            </div>
          )}
        </section>

        {/* Álbuns em Destaque */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Grid3x3 className="text-neon-blue" size={20} />
              <span className="bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
                Álbuns em Destaque
              </span>
            </h2>
            <Link to="/albuns/destaque" className="flex items-center gap-1 text-sm text-foreground/60 hover:text-neon-blue transition-colors">
              Ver todos
              <ChevronRight size={14} />
            </Link>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {fotos.albums.map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {fotos.albums.map(album => (
                <AlbumListItem key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>

        {/* Categorias Rápidas */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link to="/fotos/ensaios" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <Camera size={24} className="mx-auto mb-2 text-neon-pink" />
            <span className="text-sm font-medium text-foreground/80">Ensaios</span>
            <span className="text-xs text-foreground/40 block mt-1">2.5K fotos</span>
          </Link>
          
          <Link to="/fotos/praia" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <MapPin size={24} className="mx-auto mb-2 text-neon-purple" />
            <span className="text-sm font-medium text-foreground/80">Praia</span>
            <span className="text-xs text-foreground/40 block mt-1">1.8K fotos</span>
          </Link>
          
          <Link to="/fotos/lingerie" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <Gift size={24} className="mx-auto mb-2 text-neon-blue" />
            <span className="text-sm font-medium text-foreground/80">Lingerie</span>
            <span className="text-xs text-foreground/40 block mt-1">3.2K fotos</span>
          </Link>
          
          <Link to="/fotos/casal" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <Users size={24} className="mx-auto mb-2 text-neon-pink" />
            <span className="text-sm font-medium text-foreground/80">Casal</span>
            <span className="text-xs text-foreground/40 block mt-1">2.1K fotos</span>
          </Link>
          
          <Link to="/gifs/animados" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <Film size={24} className="mx-auto mb-2 text-neon-purple" />
            <span className="text-sm font-medium text-foreground/80">GIFs</span>
            <span className="text-xs text-foreground/40 block mt-1">4.5K gifs</span>
          </Link>
          
          <Link to="/albuns/vip" className="glass rounded-xl p-4 text-center hover:border-neon-pink/30 transition-all border border-white/10">
            <Crown size={24} className="mx-auto mb-2 text-yellow-500" />
            <span className="text-sm font-medium text-foreground/80">VIP</span>
            <span className="text-xs text-foreground/40 block mt-1">890 álbuns</span>
          </Link>
        </section>

        {/* Trending Tags */}
        <section className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash size={18} className="text-neon-pink" />
            Tags em Alta
          </h3>
          <div className="flex flex-wrap gap-2">
            {['sensual', 'lingerie', 'praia', 'casal', 'solo', 'ensaios', 'bastidores', 'biquini', 'cosplay', 'fetiche', 'artistico', 'vip', '4k', 'exclusivo'].map((tag, index) => (
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

        {/* Upload CTA */}
        <section className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              Quer compartilhar suas fotos?
            </span>
          </h3>
          <p className="text-foreground/60 mb-6 max-w-2xl mx-auto">
            Faça upload de suas fotos e GIFs e compartilhe com a comunidade
          </p>
          <Link
            to="/upload"
            className="px-8 py-4 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-xl font-medium hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all inline-flex items-center gap-3 text-lg"
          >
            <Camera size={20} />
            Upload de Fotos/GIFs
          </Link>
        </section>
      </div>

      {/* Media Modal */}
      {showMediaModal && <MediaModal />}
    </Layout>
  );
}