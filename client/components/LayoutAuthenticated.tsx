import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, Search, Video, Grid, Users, Star, ChevronDown, User, LogIn, Heart,
  TrendingUp, Flame, Sparkles, Camera, MessageCircle, Globe, Flag, Image, Mic,
  Compass, Home, Film, Music, Gamepad2, BookOpen, Gift, ShoppingBag, Shield,
  Zap, Eye, ThumbsUp, PlayCircle, Radio, Tv, Monitor, Smartphone, Clock, Calendar,
  Award, Crown, Gem, Rocket, Wind, Sun, Moon, MapPin, Languages, Drama, Smile,
  Podcast, Headphones, Volume2, VolumeX, Maximize2, Minimize2, SkipForward,
  SkipBack, Pause, Circle, CircleDot, CircleDotDashed, LogOut, Bell, Upload,
  BarChart3, Settings, Bookmark as BookmarkIcon, Loader2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "../services/auth";
import AdBanner from "@/components/AdBanner";
import { useSecureLogout } from "./SecureLogout";
import { supabase } from "@/lib/supabaseClient";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

// ─────────────────────────────────────────────
// Tipos para sugestões de pesquisa
// ─────────────────────────────────────────────
type SuggestionVideo = {
  kind: "video";
  id: string;
  slug?: string | null;
  title: string;
  thumbnail_url: string | null;
  views: number;
};

type SuggestionModel = {
  kind: "model";
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

type SuggestionCategory = {
  kind: "category";
  value: string;
  label: string;
};

type Suggestion = SuggestionVideo | SuggestionModel | SuggestionCategory;

// ─────────────────────────────────────────────
// Categorias conhecidas
// ─────────────────────────────────────────────
const KNOWN_CATEGORIES = [
  { value: "amador",       label: "🎥 Amador" },
  { value: "profissional", label: "🎬 Profissional" },
  { value: "casal",        label: "💑 Casal" },
  { value: "solo",         label: "👤 Solo" },
  { value: "grupo",        label: "👥 Grupo" },
  { value: "gay",          label: "👬 Gay" },
  { value: "trans",        label: "⚧ Trans" },
  { value: "lésbica",      label: "👭 Lésbica" },
  { value: "hentai",       label: "🎮 Hentai" },
  { value: "anime",        label: "📺 Anime" },
  { value: "cosplay",      label: "⭐ Cosplay" },
  { value: "fetiche",      label: "🔥 Fetiche" },
  { value: "bdsm",         label: "⛓ BDSM" },
  { value: "pov",          label: "👁 POV" },
  { value: "brasil",       label: "🇧🇷 Brasil" },
  { value: "eua",          label: "🇺🇸 EUA" },
];

function fmtViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

// ─────────────────────────────────────────────
// Selector de idioma
// ─────────────────────────────────────────────
function LanguageSelector() {
  const { i18n } = useTranslation();
  const langs = [
    { code: "pt", label: "PT" },
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];
  return (
    <div className="flex items-center gap-0.5 bg-white/10 border border-white/20 rounded-lg p-0.5">
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            i18n.language === code
              ? "bg-white/25 text-white"
              : "text-foreground/60 hover:text-foreground/90"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Dropdown de sugestões (partilhado)
// ─────────────────────────────────────────────
function SearchDropdown({
  suggestions, open, query, onSelect,
}: {
  suggestions: Suggestion[];
  open: boolean;
  query: string;
  onSelect: (path: string) => void;
}) {
  const { t } = useTranslation();

  if (!open || suggestions.length === 0) return null;

  const videos = suggestions.filter((s): s is SuggestionVideo    => s.kind === "video");
  const models = suggestions.filter((s): s is SuggestionModel    => s.kind === "model");
  const cats   = suggestions.filter((s): s is SuggestionCategory => s.kind === "category");

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-[999] rounded-2xl border border-white/12 bg-[#0e0e14]/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">

      {/* Vídeos */}
      {videos.length > 0 && (
        <div>
          <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[10px] font-bold text-foreground/35 uppercase tracking-widest">
            <Film size={10} /> {t("nav.search.sections.videos")}
          </div>
          {videos.map(v => (
            <button
              key={v.id}
              onMouseDown={() => onSelect(`/app/video/${v.slug || v.id}`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors text-left group"
            >
              <div className="w-14 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Film size={12} className="text-white/20" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/85 truncate group-hover:text-neon-pink transition-colors">{v.title}</p>
                <p className="text-[10px] text-foreground/35 flex items-center gap-1 mt-0.5"><Eye size={8} />{fmtViews(v.views)} views</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modelos */}
      {models.length > 0 && (
        <div className={videos.length > 0 ? "border-t border-white/8" : ""}>
          <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[10px] font-bold text-foreground/35 uppercase tracking-widest">
            <Users size={10} /> {t("nav.search.sections.models")}
          </div>
          {models.map(m => (
            <button
              key={m.id}
              onMouseDown={() => onSelect(`/app/modelo/${m.username}`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-neon-pink/30 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User size={13} className="text-white/40" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/85 truncate group-hover:text-neon-pink transition-colors">{m.full_name || m.username}</p>
                <p className="text-[10px] text-foreground/35">@{m.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Categorias */}
      {cats.length > 0 && (
        <div className={(videos.length > 0 || models.length > 0) ? "border-t border-white/8" : ""}>
          <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[10px] font-bold text-foreground/35 uppercase tracking-widest">
            <Grid size={10} /> {t("nav.search.sections.categories")}
          </div>
          <div className="px-3 pb-3 flex flex-wrap gap-2">
            {cats.map(c => (
              <button
                key={c.value}
                onMouseDown={() => onSelect(`/categoria/${c.value}`)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-foreground/70 hover:bg-neon-pink/10 hover:border-neon-pink/30 hover:text-neon-pink transition-all"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ver todos */}
      <div className="border-t border-white/8 px-4 py-2.5">
        <button
          onMouseDown={() => onSelect(`/app/search?q=${encodeURIComponent(query.trim())}`)}
          className="w-full flex items-center gap-2 text-sm text-neon-pink hover:text-neon-pink/80 transition-colors font-medium"
        >
          <Search size={13} />
          {t("nav.search.viewAll", { query })}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Barra de pesquisa com sugestões (autenticada)
// ─────────────────────────────────────────────
function SearchBar({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);

    const term = q.trim();

    const [videosRes, modelsRes] = await Promise.all([
      supabase
        .from("videos")
        .select("id, slug, title, thumbnail_url, views")
        .eq("status", "published")
        .eq("visibility", "public")
        .ilike("title", `%${term}%`)
        .order("views", { ascending: false })
        .limit(5),
      supabase
        .from("profiles_public")
        .select("id, username, full_name, avatar_url")
        .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(4),
    ]);

    const videoSuggestions: SuggestionVideo[] = (videosRes.data ?? []).map((v: any) => ({
      kind: "video",
      id: v.id,
      title: v.title ?? "",
      thumbnail_url: v.thumbnail_url,
      views: v.views ?? 0,
    }));

    const modelSuggestions: SuggestionModel[] = (modelsRes.data ?? []).map((p: any) => ({
      kind: "model",
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
    }));

    const categorySuggestions: SuggestionCategory[] = KNOWN_CATEGORIES
      .filter(c =>
        c.label.toLowerCase().includes(term.toLowerCase()) ||
        c.value.toLowerCase().includes(term.toLowerCase())
      )
      .slice(0, 3)
      .map(c => ({ kind: "category", value: c.value, label: c.label }));

    const all: Suggestion[] = [...videoSuggestions, ...modelSuggestions, ...categorySuggestions];
    setSuggestions(all);
    setOpen(all.length > 0);
    setLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
  };

  const goTo = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  if (mobile) {
    return (
      <div ref={wrapperRef} className="relative mt-3 md:hidden">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus-within:border-neon-pink/40 transition-all">
            <Search size={16} className="text-foreground/40 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => handleChange(e.target.value)}
              onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true); }}
              onBlur={() => setFocused(false)}
              placeholder={t("nav.search.placeholderMobile")}
              className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground/30 outline-none"
            />
            {loading && <Loader2 size={14} className="text-foreground/30 animate-spin flex-shrink-0" />}
            {query && !loading && (
              <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); }} className="text-foreground/30 hover:text-foreground/60">
                <X size={14} />
              </button>
            )}
          </div>
        </form>
        <SearchDropdown suggestions={suggestions} open={open} query={query} onSelect={goTo} />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="hidden md:block flex-1 max-w-2xl relative">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-neon-pink/20 via-neon-purple/20 to-neon-blue/20 rounded-full blur-md transition-opacity ${focused ? "opacity-100" : "opacity-0"}`} />
          <div className={`relative flex items-center gap-2 bg-white/5 border ${focused ? "border-neon-purple/50 bg-white/10" : "border-white/10"} rounded-full px-4 py-2.5 transition-all`}>
            <Search size={18} className={`${focused ? "text-neon-pink" : "text-foreground/40"} transition-colors flex-shrink-0`} />
            <input
              type="text"
              value={query}
              onChange={e => handleChange(e.target.value)}
              onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true); }}
              onBlur={() => setFocused(false)}
              placeholder={t("nav.search.placeholderDesktop")}
              className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground/30 outline-none"
            />
            {loading && <Loader2 size={15} className="text-foreground/30 animate-spin flex-shrink-0" />}
            {query && !loading && (
              <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); }} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </form>
      <SearchDropdown suggestions={suggestions} open={open} query={query} onSelect={goTo} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Layout Authenticated principal
// ─────────────────────────────────────────────
interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface LayoutAuthenticatedProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export default function LayoutAuthenticated({ children, hideHeader = false }: LayoutAuthenticatedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout } = useSecureLogout();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Timeout de sessão — redireciona para /login após inatividade ou sessão expirada
  useSessionTimeout({
    enabled: true,
    onExpire: () => { window.location.replace("/login?reason=timeout"); },
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await getCurrentUser();
        const userId = user.id;

        const { data, error } = await supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url,role,created_at")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.warn("Profile not found, continuing without profile data");
          const fullName = (user.user_metadata?.full_name as string) || "";
          setProfile({
            id: user.id,
            username: fullName.split(" ")[0].toLowerCase() || user.email?.split("@")[0] || "user",
            full_name: fullName,
            avatar_url: "",
          });
          return;
        }

        if (data) {
          setProfile(data as Profile);
        } else {
          const fullName = (user.user_metadata?.full_name as string) || "";
          setProfile({
            id: user.id,
            username: fullName.split(" ")[0].toLowerCase() || user.email?.split("@")[0] || "user",
            full_name: fullName,
            avatar_url: "",
          });
        }
      } catch {
        // Sessão inválida — o ProtectedRoute pai já fez redirect
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (hideHeader) { setIsHeaderVisible(true); return; }
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
  }, [lastScrollY, hideHeader]);

  const toggleCategory = (category: string) => setOpenCategory(openCategory === category ? null : category);
  const closeMenu = () => { setIsMenuOpen(false); setOpenCategory(null); };

  const displayName = profile?.username
    ?? profile?.full_name
    ?? "Utilizador";
  const avatarInitial = displayName[0].toUpperCase();

  const headerClasses = `sticky top-0 z-50 glass border-b border-white/10 transition-transform duration-300 ${
    hideHeader ? "translate-y-0" : isHeaderVisible ? "translate-y-0" : "-translate-y-full"
  }`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className={headerClasses}>
        {/* Top Header */}
        <div className="max-container safe-area py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + hamburger */}
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-all">
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <Link to="/dashboard" className="flex items-center gap-1 group" onClick={closeMenu}>
                <h1 className="text-2xl font-black">
                  <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">suck</span>
                  <span className="text-foreground/40 mx-1">or</span>
                  <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">sex</span>
                </h1>
              </Link>
            </div>

            {/* Search desktop */}
            <SearchBar />

            {/* User menu + Language selector */}
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center text-xs font-bold text-white">
                    {avatarInitial}
                  </div>
                  <span className="text-sm font-medium text-foreground/80 hidden sm:block">{displayName}</span>
                  <ChevronDown size={14} className="text-foreground/40" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-dark border border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-foreground/40">{t("nav.user.verifiedMember")}</p>
                    </div>
                    <div className="p-2">
                      <Link to="/studio" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground/70 hover:text-neon-pink transition-colors" onClick={() => setShowUserMenu(false)}>
                        <Film size={16} /><span className="text-sm">{t("nav.user.creatorStudio")}</span>
                      </Link>
                      <Link to="/studio/upload" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground/70 hover:text-neon-pink transition-colors" onClick={() => setShowUserMenu(false)}>
                        <Upload size={16} /><span className="text-sm">{t("nav.user.uploadVideo")}</span>
                      </Link>
                      <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground/70 hover:text-neon-pink transition-colors" onClick={() => setShowUserMenu(false)}>
                        <User size={16} /><span className="text-sm">{t("nav.user.yourChannel")}</span>
                      </Link>
                      <div className="h-px bg-white/10 my-2" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground/70 hover:text-neon-pink transition-colors">
                        <LogOut size={16} /><span className="text-sm">{t("nav.user.logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button className="md:hidden w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-all">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Search mobile */}
          <SearchBar mobile />
        </div>

        {/* Main Navigation */}
        <nav className="border-t border-white/10 bg-black/20">
          <div className="max-container safe-area">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              <Link to="/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${location.pathname === "/dashboard" ? "text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30" : "text-foreground/80 hover:text-neon-pink hover:bg-white/5"}`}>
                {t("nav.links.home")}
              </Link>
              <Link to="/videosauthenticated" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${location.pathname === "/videosauthenticated" ? "text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30" : "text-foreground/80 hover:text-neon-pink hover:bg-white/5"}`}>
                {t("nav.links.videos")}
              </Link>
              <Link to="/app/galeria" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${location.pathname.startsWith("/app/galeria") ? "text-foreground bg-gradient-to-r from-yellow-500/20 to-neon-pink/20 border border-yellow-500/30" : "text-foreground/80 hover:text-yellow-400 hover:bg-white/5"}`}>
                <Crown size={13} className="text-yellow-400" /> {t("nav.links.gallery")}
              </Link>
              <Link to="/modelosauthenticated" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${location.pathname === "/modelosauthenticated" ? "text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30" : "text-foreground/80 hover:text-neon-pink hover:bg-white/5"}`}>
                {t("nav.links.models")}
              </Link>
              <Link to="/app/shorts" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${location.pathname === "/app/shorts" ? "text-foreground bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30" : "text-foreground/80 hover:text-neon-pink hover:bg-white/5"}`}>
                <Zap size={13} /> Shorts
              </Link>
            </div>
          </div>
        </nav>

        {/* Sub Navigation */}
        <nav className="border-t border-white/5 bg-black/10">
          <div className="max-container safe-area">
            <div className="flex items-center gap-4 overflow-x-auto py-2 scrollbar-hide">
              <Link to="/popularesauthenticated" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${location.pathname === "/popularesauthenticated" ? "text-neon-pink" : "text-foreground/80 hover:text-neon-pink"}`}>
                <Flame size={12} /> {t("nav.links.popular")}
              </Link>
              <Link to="/recomendadosauthenticated" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${location.pathname === "/recomendadosauthenticated" ? "text-neon-pink" : "text-foreground/80 hover:text-neon-pink"}`}>
                <Star size={12} /> {t("nav.links.recommended")}
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[120px] bottom-0 glass-dark border-t border-white/10 overflow-y-auto z-40 animate-slideDown">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <span className="text-xs text-foreground/40 mr-1">Idioma:</span>
                {["pt", "en", "es"].map((code) => (
                  <button key={code} onClick={() => i18n.changeLanguage(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      i18n.language === code
                        ? "bg-neon-pink/20 border border-neon-pink/40 text-neon-pink"
                        : "bg-white/5 border border-white/10 text-foreground/50 hover:text-foreground"
                    }`}>
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === "/dashboard" ? "bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-foreground border border-neon-pink/30" : "hover:bg-white/5 text-foreground/80"}`} onClick={closeMenu}>
                  <Home size={18} className="text-neon-pink" /><span>{t("nav.links.home")}</span>
                </Link>
                <Link to="/videosauthenticated" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-foreground/80 transition-colors" onClick={closeMenu}>
                  <Video size={18} className="text-neon-purple" /><span>{t("nav.links.videos")}</span>
                </Link>
                <Link to="/app/galeria" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.startsWith("/app/galeria") ? "bg-gradient-to-r from-yellow-500/20 to-neon-pink/20 text-foreground border border-yellow-500/30" : "hover:bg-white/5 text-foreground/80"}`} onClick={closeMenu}>
                  <Crown size={18} className="text-yellow-400" /><span>{t("nav.mobile.galleryPremium")}</span>
                </Link>
              </div>

              {/* Países */}
              <div className="border-t border-white/10 pt-4">
                <button onClick={() => toggleCategory("paises")} className="flex items-center justify-between w-full px-4 py-2 text-neon-pink font-semibold hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2"><Globe size={18} /><span>{t("nav.mobile.countries")}</span></div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === "paises" ? "rotate-180" : ""}`} />
                </button>
                {openCategory === "paises" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/categoria/brasil" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}><Flag size={14} className="inline mr-1" /> {t("nav.mobile.countries_list.brazil")}</Link>
                    <Link to="/categoria/eua" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}><Flag size={14} className="inline mr-1" /> {t("nav.mobile.countries_list.usa")}</Link>
                    <Link to="/categoria/colombia" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-colors" onClick={closeMenu}><Flag size={14} className="inline mr-1" /> {t("nav.mobile.countries_list.colombia")}</Link>
                  </div>
                )}
              </div>

              {/* Modelos */}
              <div className="border-t border-white/10 pt-4">
                <button onClick={() => toggleCategory("modelos")} className="flex items-center justify-between w-full px-4 py-2 text-neon-purple font-semibold hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2"><Users size={18} /><span>{t("nav.mobile.models")}</span></div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === "modelos" ? "rotate-180" : ""}`} />
                </button>
                {openCategory === "modelos" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/modelos?filtro=populares" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🔥 {t("nav.mobile.models_list.popular")}</Link>
                    <Link to="/modelos?filtro=novos" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>✨ {t("nav.mobile.models_list.new")}</Link>
                    <Link to="/modelos?filtro=vip" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>👑 {t("nav.mobile.models_list.vip")}</Link>
                    <Link to="/modelos?filtro=verificados" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>✅ {t("nav.mobile.models_list.verified")}</Link>
                    <Link to="/modelos?filtro=plus" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>💎 {t("nav.mobile.models_list.premium")}</Link>
                    <Link to="/modelos?filtro=estreantes" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-purple hover:bg-white/10 transition-colors" onClick={closeMenu}>🌟 {t("nav.mobile.models_list.newcomers")}</Link>
                  </div>
                )}
              </div>

              {/* Categorias */}
              <div className="border-t border-white/10 pt-4">
                <button onClick={() => toggleCategory("categorias")} className="flex items-center justify-between w-full px-4 py-2 text-neon-blue font-semibold hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2"><Grid size={18} /><span>{t("nav.mobile.categories")}</span></div>
                  <ChevronDown size={16} className={`transition-transform ${openCategory === "categorias" ? "rotate-180" : ""}`} />
                </button>
                {openCategory === "categorias" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/categoria/amador" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎥 {t("nav.mobile.categories_list.amateur")}</Link>
                    <Link to="/categoria/profissional" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>🎬 {t("nav.mobile.categories_list.professional")}</Link>
                    <Link to="/categoria/casal" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>💑 {t("nav.mobile.categories_list.couple")}</Link>
                    <Link to="/categoria/solo" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👤 {t("nav.mobile.categories_list.solo")}</Link>
                    <Link to="/categoria/grupo" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👥 {t("nav.mobile.categories_list.group")}</Link>
                    <Link to="/categoria/gay" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👬 {t("nav.mobile.categories_list.gay")}</Link>
                    <Link to="/categoria/trans" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>⚧ {t("nav.mobile.categories_list.trans")}</Link>
                    <Link to="/categoria/lesbica" className="px-4 py-2 bg-white/5 rounded-lg text-sm text-foreground/80 hover:text-neon-blue hover:bg-white/10 transition-colors" onClick={closeMenu}>👭 {t("nav.mobile.categories_list.lesbian")}</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AdBanner placement="all_pages" />
      <main className="flex-1 w-full">{children}</main>

      <footer className="border-t border-white/10 glass mt-20">
        <div className="max-container safe-area py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-black">
                  <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">suck</span>
                  <span className="text-foreground/40 mx-1">or</span>
                  <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">sex</span>
                </h2>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-pink to-neon-purple rounded-full" />{t("nav.footer.navigation")}
              </h4>
              <ul className="space-y-2 text-foreground/60 text-sm">
                <li><Link to="/dashboard" className="hover:text-neon-pink transition-colors">{t("nav.footer.links.home")}</Link></li>
                <li><Link to="/categoriasauthenticated" className="hover:text-neon-pink transition-colors">{t("nav.footer.links.categories")}</Link></li>
                <li><Link to="/modelosauthenticated" className="hover:text-neon-pink transition-colors">{t("nav.footer.links.models")}</Link></li>
                <li><Link to="/app/galeria" className="hover:text-yellow-400 transition-colors">{t("nav.footer.links.galleryPremium")}</Link></li>
                <li><Link to="/anunciar" className="hover:text-neon-pink transition-colors">{t("nav.footer.links.advertising")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-purple to-neon-blue rounded-full" />{t("nav.footer.creatorStudio")}
              </h4>
              <ul className="space-y-2 text-foreground/60 text-sm">
                <li><Link to="/studio/upload" className="hover:text-neon-purple transition-colors">{t("nav.footer.links.uploadVideo")}</Link></li>
                <li><Link to="/studio/videos" className="hover:text-neon-purple transition-colors">{t("nav.footer.links.myVideos")}</Link></li>
                <li><Link to="/studio/analytics" className="hover:text-neon-purple transition-colors">{t("nav.footer.links.analytics")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-blue to-neon-pink rounded-full" />{t("nav.footer.policy")}
              </h4>
              <ul className="space-y-2 text-foreground/60 text-sm">
                <li><a href="/terms" className="hover:text-neon-purple transition-colors">{t("nav.footer.links.terms")}</a></li>
                <li><a href="/privacycookies" className="hover:text-neon-purple transition-colors">{t("nav.footer.links.cookies")}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-foreground/50 text-sm">{t("nav.footer.copyright")}</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-foreground/30 text-xs">18+</span>
              <span className="w-1 h-1 bg-foreground/30 rounded-full" />
              <p className="text-foreground/50 text-sm">{t("nav.footer.adultContent")}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
