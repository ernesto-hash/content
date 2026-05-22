// src/pages/VideosAuthenticated.tsx
// Página principal de vídeos — dados 100% reais do Supabase
// Estrutura:
//   • Hero com contador de vídeos publicados
//   • Barra de pesquisa + filtros (categoria, duração, ordenação)
//   • Grid de vídeos com paginação ("carregar mais")
//   • Realtime: novo vídeo publicado aparece sem refresh

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Play, Eye, Heart, Clock, Film, Loader2, Search,
  SlidersHorizontal, ChevronRight, Grid3x3, List,
  Flame, Sparkles, TrendingUp, Star, Filter, X,
  Camera, Users, User, Gamepad2, Tv, Headphones,
  Monitor, Zap, Crown, CheckCircle, MoreHorizontal,
  LayoutGrid, Hash, ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Video = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  category: string | null;
  likes_count: number;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  if (m >= 60) return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
  return `${m}:${sec}`;
}
function fmtRelative(iso: string, t: (key: string, opts?: object) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("pages.videos.time.minutesAgo", { count: Math.max(1, mins) });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("pages.videos.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 30) return t("pages.videos.time.daysAgo", { count: days });
  const months = Math.floor(days / 30);
  return t("pages.videos.time.monthsAgo", { count: months });
}

// ─────────────────────────────────────────────
// Configuração de categorias (ícone + label)
// ─────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  amador:       { label: "Amador",       icon: Camera,    color: "text-amber-400" },
  profissional: { label: "Profissional", icon: Film,      color: "text-violet-400" },
  casal:        { label: "Casal",        icon: Users,     color: "text-blue-400" },
  solo:         { label: "Solo",         icon: User,      color: "text-rose-400" },
  grupo:        { label: "Grupo",        icon: Users,     color: "text-emerald-400" },
  trans:        { label: "Trans",        icon: Sparkles,  color: "text-fuchsia-400" },
  gay:          { label: "Gay",          icon: Users,     color: "text-sky-400" },
  lésbica:      { label: "Lésbica",      icon: Heart,     color: "text-red-400" },
  lesbica:      { label: "Lésbica",      icon: Heart,     color: "text-red-400" },
  hentai:       { label: "Hentai",       icon: Gamepad2,  color: "text-pink-400" },
  anime:        { label: "Anime",        icon: Tv,        color: "text-cyan-400" },
  cosplay:      { label: "Cosplay",      icon: Star,      color: "text-yellow-400" },
  asmr:         { label: "ASMR",         icon: Headphones,color: "text-teal-400" },
  fetiche:      { label: "Fetiche",      icon: Flame,     color: "text-orange-400" },
  bdsm:         { label: "BDSM",         icon: Filter,    color: "text-zinc-400" },
  vintage:      { label: "Vintage",      icon: Film,      color: "text-yellow-600" },
  animação:     { label: "Animação",     icon: Monitor,   color: "text-lime-400" },
  pov:          { label: "POV",          icon: Eye,       color: "text-pink-400" },
  brasil:       { label: "Brasil",       icon: Hash,      color: "text-green-400" },
  eua:          { label: "EUA",          icon: Hash,      color: "text-blue-500" },
  japão:        { label: "Japão",        icon: Hash,      color: "text-red-400" },
  espanha:      { label: "Espanha",      icon: Hash,      color: "text-yellow-500" },
  frança:       { label: "França",       icon: Hash,      color: "text-blue-400" },
  itália:       { label: "Itália",       icon: Hash,      color: "text-green-400" },
  alemanha:     { label: "Alemanha",     icon: Hash,      color: "text-yellow-400" },
};

const getCategoryMeta = (cat: string | null) => {
  if (!cat) return null;
  return CATEGORY_META[cat.toLowerCase()] ?? { label: cat, icon: Film, color: "text-white/50" };
};

// ─────────────────────────────────────────────
// Card de vídeo — modo Grid
// ─────────────────────────────────────────────
function VideoGridCard({ video }: { video: Video }) {
  const { t } = useTranslation();
  const catMeta = getCategoryMeta(video.category);
  return (
    <Link to={`/video/${video.id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 mb-3">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title ?? ""}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={28} className="text-white/15" />
          </div>
        )}

        {/* Overlay com botão */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-neon-pink/90 flex items-center justify-center shadow-lg shadow-neon-pink/30">
                <Play size={18} fill="white" className="text-white ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded">
            {fmtDuration(video.duration)}
          </div>
        )}

        {/* Category badge */}
        {catMeta && (
          <div className="absolute top-2 left-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-black/70 font-medium ${catMeta.color}`}>
              {catMeta.label}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 px-0.5">
        <h3 className="text-sm font-semibold text-foreground/85 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
          {video.title || t("common.noTitle")}
        </h3>
        <div className="flex items-center gap-3 text-xs text-foreground/40">
          <span className="flex items-center gap-1">
            <Eye size={11} /> {fmtNum(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} className="text-neon-pink" /> {fmtNum(video.likes_count)}
          </span>
          <span>{fmtRelative(video.created_at, t)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Card de vídeo — modo List
// ─────────────────────────────────────────────
function VideoListCard({ video }: { video: Video }) {
  const { t } = useTranslation();
  const catMeta = getCategoryMeta(video.category);
  return (
    <Link to={`/video/${video.id}`} className="group flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-white/15 transition-all">
      {/* Thumbnail */}
      <div className="relative w-44 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title ?? ""}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={20} className="text-white/15" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-9 h-9 rounded-full bg-neon-pink/90 flex items-center justify-center">
            <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded">
            {fmtDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground/85 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug mb-2">
            {video.title || t("common.noTitle")}
          </h3>
          {catMeta && (
            <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 font-medium ${catMeta.color}`}>
              {catMeta.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-foreground/40 mt-2">
          <span className="flex items-center gap-1"><Eye size={11} /> {fmtNum(video.views)} {t("pages.videos.card.views")}</span>
          <span className="flex items-center gap-1"><Heart size={11} className="text-neon-pink" /> {fmtNum(video.likes_count)}</span>
          {video.duration && <span className="flex items-center gap-1"><Clock size={11} /> {fmtDuration(video.duration)}</span>}
          <span>{fmtRelative(video.created_at, t)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const PAGE_SIZE = 24;

type SortOption = "recentes" | "views" | "likes" | "antigos";
type DurationFilter = "todos" | "curto" | "medio" | "longo";

export default function VideosAuthenticatedPage() {
  const { t } = useTranslation();

  // ── Auth guard — redirect se sem sessão ─────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
    });
  }, []);

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filtros
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>("todos");
  const [selectedSort, setSelectedSort] = useState<SortOption>("recentes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Lista de categorias únicas da BD
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Debounce da pesquisa ─────────────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  // ── Fetch das categorias disponíveis ────────
  useEffect(() => {
    supabase
      .from("videos")
      .select("category")
      .eq("status", "published")
      .eq("visibility", "public")
      .not("category", "is", null)
      .then(({ data }) => {
        if (!data) return;
        const unique = [...new Set(data.map((v) => v.category).filter(Boolean))]
          .sort() as string[];
        setAvailableCategories(unique);
      });
  }, []);

  // ── Fetch de vídeos ─────────────────────────
  const fetchVideos = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setLoading(true); else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = supabase
      .from("videos")
      .select("id, title, thumbnail_url, views, duration, created_at, category", { count: "exact" })
      .eq("status", "published")
      .eq("visibility", "public")
      .range(from, to);

    // Pesquisa
    if (debouncedQuery.trim()) {
      q = q.ilike("title", `%${debouncedQuery.trim()}%`);
    }

    // Categoria
    if (selectedCategory !== "todas") {
      q = q.ilike("category", selectedCategory);
    }

    // Duração
    if (selectedDuration === "curto")  q = q.lte("duration", 300);          // até 5 min
    if (selectedDuration === "medio")  q = q.gt("duration", 300).lte("duration", 1200);  // 5-20 min
    if (selectedDuration === "longo")  q = q.gt("duration", 1200);          // +20 min

    // Ordenação
    if (selectedSort === "recentes") q = q.order("created_at", { ascending: false });
    if (selectedSort === "antigos")  q = q.order("created_at", { ascending: true });
    if (selectedSort === "views")    q = q.order("views", { ascending: false });
    // likes: ordenamos depois de buscar (não temos coluna likes na tabela videos)

    const { data, count, error } = await q;
    if (error) { setLoading(false); setLoadingMore(false); return; }

    const vids = (data ?? []) as Omit<Video, "likes_count">[];

    // Buscar likes em paralelo
    const withLikes: Video[] = await Promise.all(
      vids.map(async (v) => {
        const { count: lc } = await supabase
          .from("interacoes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", v.id)
          .eq("tipo", true);
        return { ...v, likes_count: lc ?? 0 };
      })
    );

    // Ordenar por likes se necessário (client-side)
    const sorted = selectedSort === "likes"
      ? [...withLikes].sort((a, b) => b.likes_count - a.likes_count)
      : withLikes;

    const total = count ?? 0;
    setTotalCount(total);
    setHasMore(from + sorted.length < total);
    setVideos(replace ? sorted : (prev) => [...prev, ...sorted]);
    setLoading(false);
    setLoadingMore(false);
  }, [debouncedQuery, selectedCategory, selectedDuration, selectedSort]);

  // Re-fetch quando filtros mudam
  useEffect(() => {
    setPage(0);
    fetchVideos(0, true);
  }, [fetchVideos]);

  // Carregar mais
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage, false);
  };

  // ── Realtime ─────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel("videos-auth-page-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" },
        () => {
          setPage(0);
          fetchVideos(0, true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchVideos]);

  // ── Filtros ativos (contagem para badge) ────
  const activeFiltersCount = [
    selectedCategory !== "todas",
    selectedDuration !== "todos",
    selectedSort !== "recentes",
  ].filter(Boolean).length;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-8 space-y-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-pink/10 via-neon-purple/8 to-neon-blue/5 border border-white/8 p-7">
          <div className="absolute -top-12 -right-12 w-52 h-52 bg-neon-pink/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-neon-blue/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-1.5">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                  {t("pages.videos.hero.title")}
                </span>
              </h1>
              <p className="text-foreground/50 text-sm">
                {t("pages.videos.hero.subtitle")}
              </p>
            </div>
            <div className="text-center px-5 py-3 rounded-xl bg-white/5 border border-white/8">
              <p className="text-2xl font-black text-foreground">{loading ? "—" : fmtNum(totalCount)}</p>
              <p className="text-xs text-foreground/40 mt-0.5">{t("pages.videos.published")}</p>
            </div>
          </div>
        </div>

        {/* ── Barra de pesquisa + controlos ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-neon-pink/30 focus-within:bg-white/8 transition-all">
            <Search size={15} className="text-foreground/35 flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pages.videos.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-foreground/30 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Ordenação rápida */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              ["recentes", t("pages.videos.sort.recent"),     Sparkles],
              ["views",    t("pages.videos.sort.mostViewed"), Eye],
              ["likes",    t("pages.videos.sort.mostLiked"),  Heart],
            ] as [SortOption, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => setSelectedSort(val)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedSort === val
                    ? "bg-neon-pink/12 border-neon-pink/35 text-neon-pink"
                    : "bg-white/5 border-white/10 text-foreground/50 hover:border-white/20 hover:text-foreground/70"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Filtros + view mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all relative ${
                showFilters || activeFiltersCount > 0
                  ? "bg-neon-purple/12 border-neon-purple/35 text-neon-purple"
                  : "bg-white/5 border-white/10 text-foreground/50 hover:border-white/20"
              }`}
            >
              <SlidersHorizontal size={13} />
              {t("pages.videos.filters.label")}
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neon-pink text-white text-[9px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View mode */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-foreground/70"}`}
              >
                <Grid3x3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-foreground/70"}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Painel de filtros avançados ── */}
        {showFilters && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-5">
            {/* Categorias */}
            <div>
              <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-neon-pink rounded-full" />
                {t("pages.videos.filters.category")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("todas")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedCategory === "todas"
                      ? "bg-neon-pink/12 border-neon-pink/35 text-neon-pink"
                      : "bg-white/5 border-white/10 text-foreground/50 hover:border-white/20"
                  }`}
                >
                  {t("pages.videos.filters.allCategories")}
                </button>
                {availableCategories.map((cat) => {
                  const meta = getCategoryMeta(cat);
                  const Icon = meta?.icon ?? Film;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedCategory === cat
                          ? "bg-neon-purple/12 border-neon-purple/35 text-neon-purple"
                          : "bg-white/5 border-white/10 text-foreground/50 hover:border-white/20"
                      }`}
                    >
                      <Icon size={11} />
                      {meta?.label ?? cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duração */}
            <div>
              <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-neon-blue rounded-full" />
                {t("pages.videos.filters.duration")}
              </p>
              <div className="flex flex-wrap gap-2">
                {([
                  ["todos",  t("pages.videos.filters.duration_any")],
                  ["curto",  t("pages.videos.filters.duration_short")],
                  ["medio",  t("pages.videos.filters.duration_medium")],
                  ["longo",  t("pages.videos.filters.duration_long")],
                ] as [DurationFilter, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSelectedDuration(val)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedDuration === val
                        ? "bg-neon-blue/12 border-neon-blue/35 text-neon-blue"
                        : "bg-white/5 border-white/10 text-foreground/50 hover:border-white/20"
                    }`}
                  >
                    <Clock size={11} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Limpar filtros */}
            {activeFiltersCount > 0 && (
              <div className="flex justify-end pt-2 border-t border-white/8">
                <button
                  onClick={() => {
                    setSelectedCategory("todas");
                    setSelectedDuration("todos");
                    setSelectedSort("recentes");
                  }}
                  className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-neon-pink transition-colors"
                >
                  <X size={12} />
                  {t("pages.videos.filters.clearFilters")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Resultado da pesquisa (label) ── */}
        {(debouncedQuery || selectedCategory !== "todas") && !loading && (
          <div className="flex items-center gap-2 text-sm text-foreground/50">
            <Search size={13} />
            <span>
              {totalCount > 0
                ? <>{fmtNum(totalCount)} resultado{totalCount !== 1 ? "s" : ""}{debouncedQuery ? ` para "${debouncedQuery}"` : ""}{selectedCategory !== "todas" ? ` em ${getCategoryMeta(selectedCategory)?.label ?? selectedCategory}` : ""}</>
                : <>{t("pages.videos.results.noResults")}{debouncedQuery ? ` para "${debouncedQuery}"` : ""}</>
              }
            </span>
          </div>
        )}

        {/* ── Conteúdo ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-neon-pink/50" />
            <p className="text-foreground/35 text-sm">{t("pages.videos.loading")}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Film size={28} className="text-foreground/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/60 font-medium">{t("pages.videos.empty.title")}</p>
              <p className="text-foreground/30 text-sm">
                {debouncedQuery ? t("pages.videos.empty.withSearch") : t("pages.videos.empty.noVideos")}
              </p>
            </div>
            {(debouncedQuery || selectedCategory !== "todas" || selectedDuration !== "todos") && (
              <button
                onClick={() => { setQuery(""); setSelectedCategory("todas"); setSelectedDuration("todos"); }}
                className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors"
              >
                {t("pages.videos.filters.clearFilters")}
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((v) => <VideoGridCard key={v.id} video={v} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((v) => <VideoListCard key={v.id} video={v} />)}
          </div>
        )}

        {/* ── Carregar mais ── */}
        {hasMore && !loading && videos.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-7 py-3 bg-white/5 border border-white/10 text-foreground/70 rounded-xl text-sm font-semibold hover:bg-white/8 hover:border-white/20 hover:text-foreground transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <><Loader2 size={15} className="animate-spin" /> {t("pages.videos.loadingMore")}</>
              ) : (
                <><ChevronDown size={15} /> {t("pages.videos.loadMore")}</>
              )}
            </button>
          </div>
        )}

        {/* ── Rodapé informativo ── */}
        {!loading && videos.length > 0 && (
          <p className="text-center text-xs text-foreground/25 pb-4">
            {t("pages.videos.results.showing", { shown: videos.length, total: fmtNum(totalCount) })}
          </p>
        )}

      </div>
    </LayoutAuthenticated>
  );
}