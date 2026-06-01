// src/pages/RecomendadosAuthenticated.tsx
// Página de recomendações para utilizadores COM conta
//
// Perfil construído a partir de (além do que o público usa):
//   • Likes dados (interacoes tipo=true → peso alto)
//   • Dislikes (interacoes tipo=false → penalização)
//   • Comentários em vídeos
//   • Partilhas de vídeos
//   • Canais subscritos
//
// Tab extra vs versão pública: "Subscricoes" — vídeos dos canais que segue
// Like/Save inline nos cards — sem popup
// Realtime: perfil atualiza ao dar like/dislike

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { useRecommendations, getSessionId, RecoTab } from "@/hooks/useRecommendations";
import { supabase } from "@/lib/supabaseClient";
import {
  Sparkles, Eye, Heart, MessageCircle, Play,
  Grid3x3, List, Search, ChevronDown, ThumbsUp,
  Users, Film, Loader2, X, TrendingUp, History,
  Zap, Star, RefreshCw, Bell, Bookmark,
} from "lucide-react";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────
// Card autenticado — Grid
// ─────────────────────────────────────────────
function VideoGridCardAuth({
  video, isLiked, isSaved, onLike, onSave,
}: {
  video: any;
  isLiked: boolean; isSaved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/8 hover:border-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/5 transition-all duration-300">

      {/* Thumbnail */}
      <Link to={`/video/${video.slug || video.id}`}>
        <div className="relative aspect-video overflow-hidden bg-black/20">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Film size={28} className="text-white/15" /></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-neon-pink/90 flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={24} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
          {video.duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {fmtDuration(video.duration)}
            </span>
          )}
          {video.relevance >= 70 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-neon-pink text-[9px] font-bold">
              <Star size={8} fill="currentColor" /> {video.relevance}%
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3.5 space-y-2.5">
        {/* Motivo */}
        <span className="text-[10px] px-2 py-0.5 bg-neon-pink/10 border border-neon-pink/18 text-neon-pink rounded-full inline-flex items-center gap-1">
          <Sparkles size={9} />{video.reason}
        </span>

        {/* Criador */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {video.creator_avatar
              ? <img src={video.creator_avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Users size={10} className="text-white/28" /></div>
            }
          </div>
          <span className="text-[11px] text-foreground/45 truncate">{video.creator_name ?? t("common.creator")}</span>
        </div>

        {/* Título */}
        <Link to={`/video/${video.slug || video.id}`}>
          <h3 className="font-semibold text-sm text-foreground/85 line-clamp-2 hover:text-neon-pink transition-colors leading-snug cursor-pointer">
            {video.title || t("common.noTitle")}
          </h3>
        </Link>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-foreground/38">
          <span className="flex items-center gap-1"><Eye size={11} />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><MessageCircle size={11} />{fmtNum(video.comments_count)}</span>
          <span className="flex items-center gap-1 text-foreground/30"><ThumbsUp size={9} />{video.relevance}%</span>
        </div>

        {/* Barra de compatibilidade */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-pink to-neon-purple rounded-full transition-all duration-700"
              style={{ width: `${video.relevance}%` }}
            />
          </div>
        </div>

        {/* Ações inline */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/6">
          <button
            onClick={() => onLike(video.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex-1 justify-center ${
              isLiked
                ? "bg-neon-pink/12 border-neon-pink/30 text-neon-pink"
                : "bg-white/5 border-white/8 text-foreground/40 hover:text-neon-pink hover:border-neon-pink/20"
            }`}
          >
            <Heart size={11} className={isLiked ? "fill-neon-pink" : ""} />
            {fmtNum(video.likes_count + (isLiked ? 1 : 0))}
          </button>
          <button
            onClick={() => onSave(video.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              isSaved
                ? "bg-neon-purple/12 border-neon-purple/30 text-neon-purple"
                : "bg-white/5 border-white/8 text-foreground/40 hover:text-neon-purple hover:border-neon-purple/20"
            }`}
          >
            <Bookmark size={11} className={isSaved ? "fill-neon-purple" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Card autenticado — List
// ─────────────────────────────────────────────
function VideoListCardAuth({
  video, isLiked, isSaved, onLike, onSave,
}: {
  video: any;
  isLiked: boolean; isSaved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="group flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-neon-pink/20 hover:bg-white/[0.05] transition-all">
      <Link to={`/video/${video.slug || video.id}`} className="relative w-44 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Film size={18} className="text-white/15" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-9 h-9 rounded-full bg-neon-pink/90 flex items-center justify-center">
            <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
            {fmtDuration(video.duration)}
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
        <div className="space-y-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-neon-pink/10 border border-neon-pink/15 text-neon-pink rounded-full inline-flex items-center gap-1">
            <Sparkles size={8} />{video.reason}
          </span>
          <Link to={`/video/${video.slug || video.id}`}>
            <h3 className="font-semibold text-sm text-foreground/85 line-clamp-2 hover:text-neon-pink transition-colors leading-snug">{video.title || t("common.noTitle")}</h3>
          </Link>
          <div className="flex items-center gap-3 text-[11px] text-foreground/35">
            <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(video.views)}</span>
            <span className="flex items-center gap-1"><MessageCircle size={10} />{fmtNum(video.comments_count)}</span>
            <span className="flex items-center gap-1 ml-auto"><ThumbsUp size={9} />{video.relevance}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onLike(video.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isLiked
                ? "bg-neon-pink/12 border-neon-pink/30 text-neon-pink"
                : "bg-white/5 border-white/8 text-foreground/40 hover:text-neon-pink hover:border-neon-pink/20"
            }`}
          >
            <Heart size={11} className={isLiked ? "fill-neon-pink" : ""} />
            {fmtNum(video.likes_count + (isLiked ? 1 : 0))}
          </button>
          <button
            onClick={() => onSave(video.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSaved
                ? "bg-neon-purple/12 border-neon-purple/30 text-neon-purple"
                : "bg-white/5 border-white/8 text-foreground/40 hover:text-neon-purple hover:border-neon-purple/20"
            }`}
          >
            <Bookmark size={11} className={isSaved ? "fill-neon-purple" : ""} />
            {isSaved ? t("pages.recomendados.card.saved") : t("pages.recomendados.card.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/8 overflow-hidden animate-pulse">
          <div className="aspect-video bg-white/5" />
          <div className="p-3.5 space-y-2.5">
            <div className="h-5 bg-white/8 rounded-full w-36" />
            <div className="flex gap-2 items-center"><div className="w-5 h-5 rounded-full bg-white/8" /><div className="h-2.5 bg-white/8 rounded w-20" /></div>
            <div className="h-3.5 bg-white/8 rounded" /><div className="h-3.5 bg-white/8 rounded w-2/3" />
            <div className="h-1 bg-white/8 rounded-full" />
            <div className="flex gap-1.5"><div className="h-7 bg-white/8 rounded-lg flex-1" /><div className="h-7 w-10 bg-white/8 rounded-lg" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function RecomendadosAuthenticatedPage() {
  const { t } = useTranslation();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Auth + redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/login"; return; }
      setCurrentUserId(data.session.user.id);
    });
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) { window.location.href = "/login"; return; }
      setCurrentUserId(s.user.id);
    });
    return () => l.subscription.unsubscribe();
  }, []);

  const { videos, loading, activeTab, setActiveTab, interestProfile,
          profileReady, trackSearch, refresh } = useRecommendations(currentUserId);

  const [searchTerm, setSearchTerm]   = useState("");
  const [dSearch, setDSearch]         = useState("");
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");
  const [likedIds, setLikedIds]       = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds]       = useState<Set<string>>(new Set());

  const debRef = useRef<ReturnType<typeof setTimeout>>();

  // Likes do utilizador
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("interacoes").select("video_id").eq("user_id", currentUserId).eq("tipo", true)
      .then(({ data }) => setLikedIds(new Set((data ?? []).map((r: any) => r.video_id))));
  }, [currentUserId]);

  // Debounce pesquisa
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setDSearch(searchTerm);
      if (searchTerm.trim().length >= 3) await trackSearch(searchTerm);
    }, 500);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [searchTerm, trackSearch]);

  // Like/dislike — atualiza perfil imediatamente
  const handleLike = async (videoId: string) => {
    if (!currentUserId) return;
    if (likedIds.has(videoId)) {
      await supabase.from("interacoes").delete().eq("video_id", videoId).eq("user_id", currentUserId).eq("tipo", true);
      setLikedIds((p) => { const s = new Set(p); s.delete(videoId); return s; });
    } else {
      await supabase.from("interacoes").insert({ video_id: videoId, user_id: currentUserId, tipo: true });
      setLikedIds((p) => new Set(p).add(videoId));
    }
    // O hook de recomendação vai re-calcular o perfil em background
    setTimeout(() => refresh(), 300);
  };

  const handleSave = (videoId: string) => {
    setSavedIds((p) => { const s = new Set(p); s.has(videoId) ? s.delete(videoId) : s.add(videoId); return s; });
  };

  const hasProfile  = Object.keys(interestProfile).length > 0;
  const topCats     = Object.entries(interestProfile).sort(([, a], [, b]) => b - a).slice(0, 4);
  const displayed   = dSearch.trim()
    ? videos.filter((v) => (v.title ?? "").toLowerCase().includes(dSearch.toLowerCase()))
    : videos;

  const TABS: { id: RecoTab; label: string; icon: React.ElementType }[] = [
    { id: "para_voce",    label: t("pages.recomendados.tabs.forYou"),       icon: Sparkles   },
    { id: "historico",    label: t("pages.recomendados.tabs.fromHistory"),  icon: History    },
    { id: "subscricoes",  label: t("pages.recomendados.tabs.subscriptions"), icon: Bell      },
    { id: "tendencias",   label: t("pages.recomendados.tabs.trending"),     icon: TrendingUp },
  ];

  // Importar History de lucide dentro do componente (já está importado acima)

  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-8 space-y-7">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/12 via-neon-pink/7 to-neon-blue/5 border border-white/8 p-7">
          <div className="absolute -top-14 -right-14 w-56 h-56 bg-neon-purple/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[11px] font-bold tracking-wider uppercase mb-3">
                <Zap size={10} /> {t("pages.recomendados.hero.badge")}
              </div>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                  {t("pages.recomendados.hero.titleHighlight")}
                </span>{" "}{t("pages.recomendados.hero.titleSuffix")}
              </h1>
              <p className="text-foreground/48 text-sm leading-relaxed">
                {hasProfile
                  ? t("pages.recomendados.hero.subtitleAuth")
                  : t("pages.recomendados.hero.subtitleNoProfileAuth")}
              </p>
            </div>

            {/* Perfil de interesses */}
            {hasProfile && (
              <div className="flex-shrink-0 bg-white/[0.03] border border-white/8 rounded-2xl p-4 min-w-[170px]">
                <p className="text-[10px] text-foreground/35 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                  <Star size={9} className="text-neon-pink" /> {t("pages.recomendados.interests")}
                </p>
                <div className="space-y-2">
                  {topCats.map(([cat, score]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-[11px] text-foreground/60 capitalize w-20 truncate">{cat}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-pink to-neon-purple rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground/30">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats personalizadas ── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("pages.recomendados.stats.suggestions"), value: String(videos.length),       icon: Sparkles, color: "text-neon-pink"   },
              { label: t("pages.recomendados.stats.likes"),        value: fmtNum(likedIds.size),       icon: Heart,    color: "text-rose-400"    },
              { label: t("pages.recomendados.stats.saved"),        value: fmtNum(savedIds.size),       icon: Bookmark, color: "text-neon-purple" },
              { label: t("pages.recomendados.stats.categories"),   value: String(Object.keys(interestProfile).length), icon: Star, color: "text-neon-blue" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/7 rounded-2xl p-3.5 text-center">
                <Icon size={15} className={`mx-auto mb-1 ${color}`} />
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-foreground/30 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs + Pesquisa ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-xl p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === id
                    ? "bg-neon-pink text-white shadow-sm"
                    : "text-foreground/45 hover:text-foreground/70"
                }`}
              >
                <Icon size={11} />{label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-neon-purple/35 transition-all">
            <Search size={14} className="text-foreground/33 flex-shrink-0" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("pages.recomendados.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/26"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-foreground/28 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-neon-pink"}`}><Grid3x3 size={14} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-neon-pink"}`}><List size={14} /></button>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground/40 hover:text-neon-pink hover:border-neon-pink/25 transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Conteúdo ── */}
        {loading ? (
          <SkeletonGrid />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Sparkles size={28} className="text-foreground/18" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground/55 font-semibold">
                {dSearch ? t("pages.recomendados.empty.noResultsFor", { query: dSearch }) : t("pages.recomendados.empty.noRecos")}
              </p>
              <p className="text-foreground/28 text-sm max-w-xs">
                {activeTab === "subscricoes"
                  ? t("pages.recomendados.empty.subscriptionHint")
                  : t("pages.recomendados.empty.generalHint")}
              </p>
            </div>
            {activeTab === "subscricoes" && (
              <Link to="/app/modelos" className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors">
                {t("pages.recomendados.empty.seeModels")}
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((v) => (
              <VideoGridCardAuth
                key={v.id} video={v}
                isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)}
                onLike={handleLike} onSave={handleSave}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((v) => (
              <VideoListCardAuth
                key={v.id} video={v}
                isLiked={likedIds.has(v.id)} isSaved={savedIds.has(v.id)}
                onLike={handleLike} onSave={handleSave}
              />
            ))}
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground/60 text-sm font-semibold hover:bg-white/8 hover:border-white/20 hover:text-foreground transition-all"
            >
              <RefreshCw size={14} /> {t("pages.recomendados.loadMore")}
            </button>
          </div>
        )}

      </div>
    </LayoutAuthenticated>
  );
}