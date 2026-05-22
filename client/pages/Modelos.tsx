// src/pages/Modelos.tsx
// Página de modelos/criadores — dados 100% reais do Supabase
//
// CORRECÇÕES APLICADAS:
//   ✅ Removido filtro "video_count > 0" — TODOS os perfis aparecem
//   ✅ Banner do canal usa avatar quando não há vídeos
//   ✅ Badge "Novo" para modelos sem vídeos publicados
//   ✅ AuthPopup definido no mesmo ficheiro

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/lib/supabaseClient";
import {
  Play, Eye, Heart, Film, Loader2, Search, X,
  Users, Crown, Sparkles, ChevronRight, CheckCircle,
  User, Calendar, ArrowLeft, MessageCircle, Bell, BellOff,
  Grid3x3, List, Bookmark,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Creator = {
  id: string;
  slug: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  video_count: number;
  total_views: number;
  subscriber_count: number;
  preview_thumbs: string[];
};

type VideoItem = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  likes_count: number;
};

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
function fmtRelative(iso: string, t: (key: string, opts?: Record<string, number>) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return t("home.time.now");
  if (days < 7)   return t("home.time.daysAgo", { count: days });
  if (days < 30)  return t("home.time.weeksAgo", { count: Math.floor(days / 7) });
  return t("home.time.monthsAgo", { count: Math.floor(days / 30) });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { month: "short", year: "numeric" });
}

const GRADIENTS = [
  "from-neon-pink/20 to-neon-purple/10",
  "from-blue-500/20 to-cyan-500/10",
  "from-violet-500/20 to-fuchsia-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-rose-500/20 to-pink-500/10",
];
const ACCENT_COLORS = [
  "text-neon-pink border-neon-pink/30 bg-neon-pink/10",
  "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "text-violet-400 border-violet-400/30 bg-violet-400/10",
  "text-amber-400 border-amber-400/30 bg-amber-400/10",
  "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  "text-rose-400 border-rose-400/30 bg-rose-400/10",
];

// ─────────────────────────────────────────────
// Auth Popup
// ─────────────────────────────────────────────
function AuthPopup({ action, onClose }: { action: string; onClose: () => void }) {
  const { t } = useTranslation();
  const titles: Record<string, string> = {
    subscribe: t("models.authPopup.subscribe"),
    message:   t("models.authPopup.message"),
    like:      t("models.authPopup.like"),
    save:      t("models.authPopup.save"),
  };
  const icons: Record<string, React.ElementType> = {
    subscribe: Bell,
    message:   MessageCircle,
    like:      Heart,
    save:      Bookmark,
  };
  const Icon = icons[action] ?? Users;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-sm w-full bg-gradient-to-br from-[#1a0a2e] to-[#2a0a1e] rounded-2xl border border-neon-pink/22 shadow-[0_0_50px_rgba(236,72,153,0.18)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/25 hover:text-white transition-colors">
          <X size={18} />
        </button>
        <div className="p-7 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center">
            <Icon size={22} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{titles[action] ?? t("models.authPopup.generic")}</h3>
          <p className="text-white/45 text-sm mb-6">
            {t("models.authPopup.body")}
          </p>
          <div className="space-y-2.5">
            <Link to="/signup" onClick={onClose}
              className="block w-full py-2.5 bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all">
              {t("common.createAccount")}
            </Link>
            <Link to="/login" onClick={onClose}
              className="block w-full py-2.5 bg-white/7 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">
              {t("common.alreadyHaveAccount")}
            </Link>
            <button onClick={onClose} className="text-xs text-white/22 hover:text-white/50 transition-colors">
              {t("common.continueNavigation")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Card de modelo
// ─────────────────────────────────────────────
function CreatorCard({
  creator, index, isSubscribed, onSubscribe,
}: {
  creator: Creator;
  index: number;
  isSubscribed: boolean;
  onSubscribe: (id: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const grad   = GRADIENTS[index % GRADIENTS.length];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div
      className="group relative bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-white/18 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/modelo/${creator.slug || creator.id}`)}
    >
      {/* Faixa de preview */}
      <div className="relative h-28 flex gap-0.5 overflow-hidden">
        {creator.preview_thumbs.length > 0 ? (
          creator.preview_thumbs.slice(0, 3).map((url, i) => (
            <div key={i} className="relative flex-1 bg-black/40 overflow-hidden"
              style={{ flex: i === 0 ? "2 1 0%" : "1 1 0%" }}>
              <img src={url} alt=""
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
            </div>
          ))
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center relative overflow-hidden`}>
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt="" className="w-full h-full object-cover opacity-25" />
              : <Film size={28} className="text-white/15" />
            }
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />

        {/* Badge verificado */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neon-blue/90 flex items-center justify-center shadow-md">
          <CheckCircle size={12} fill="white" className="text-white" />
        </div>

        {/* Badge "Novo" — sem vídeos ainda */}
        {creator.video_count === 0 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-[9px] font-bold tracking-wide">
            {t("models.card.new")}
          </div>
        )}
      </div>

      {/* Corpo */}
      <div className="relative px-4 pb-4">
        <div className="-mt-7 mb-3 flex items-end justify-between">
          <div className={`w-14 h-14 rounded-2xl border-2 border-[#0d0d0d] bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0`}>
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt={creator.full_name ?? creator.username} className="w-full h-full object-cover" />
              : <User size={22} className="text-white/40" />
            }
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSubscribe(creator.id); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isSubscribed
                ? "bg-white/8 border-white/12 text-white/50 hover:bg-white/12"
                : `${accent} hover:scale-[1.03]`
            }`}
          >
            {isSubscribed ? <><BellOff size={11} /> {t("models.card.subscribed")}</> : <><Bell size={11} /> {t("models.card.subscribe")}</>}
          </button>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-foreground/90 text-sm group-hover:text-white transition-colors truncate">
            {creator.full_name || creator.username}
          </h3>
          <p className="text-[11px] text-foreground/38">@{creator.username}</p>
        </div>

        <div className="grid grid-cols-3 gap-1 text-center">
          {[
            { label: t("models.stats.videos"), value: fmtNum(creator.video_count),      icon: Film  },
            { label: t("models.stats.views"),  value: fmtNum(creator.total_views),      icon: Eye   },
            { label: t("models.stats.fans"),   value: fmtNum(creator.subscriber_count), icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/[0.03] border border-white/6 rounded-xl py-1.5 px-1">
              <Icon size={10} className="text-foreground/30 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-foreground/80">{value}</p>
              <p className="text-[9px] text-foreground/30">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-foreground/30 group-hover:text-neon-pink transition-colors">
          <span>{t("models.card.viewChannel")}</span>
          <ChevronRight size={11} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL — Lista de modelos
// ─────────────────────────────────────────────
type SortOption = "subscribers" | "videos" | "views" | "recentes";

export function ModelosPage() {
  const { t } = useTranslation();
  useDocumentTitle({ title: "Modelos - SuckOrSex" });
  const [creators, setCreators]   = useState<Creator[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState("");
  const [dQuery, setDQuery]       = useState("");
  const [sort, setSort]           = useState<SortOption>("subscribers");
  const [total, setTotal]         = useState(0);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const debRef = useRef<ReturnType<typeof setTimeout>>();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setCurrentUserId(s?.user?.id ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  // Debounce
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDQuery(query), 400);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [query]);

  // ── Fetch criadores ──────────────────────────────────────────────
  const fetchCreators = useCallback(async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("profiles_public")
      .select("id, slug, username, full_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(120);

    if (!profs || profs.length === 0) { setCreators([]); setLoading(false); return; }

    const enriched: Creator[] = await Promise.all(
      (profs as any[]).map(async (p) => {
        const [vcRes, vrRes, scRes, thRes] = await Promise.all([
          supabase.from("videos").select("*", { count: "exact", head: true })
            .eq("user_id", p.id).eq("status", "published").eq("visibility", "public"),
          supabase.from("videos").select("views")
            .eq("user_id", p.id).eq("status", "published").eq("visibility", "public"),
          supabase.from("subscriptions").select("*", { count: "exact", head: true })
            .eq("creator_id", p.id),
          supabase.from("videos").select("thumbnail_url")
            .eq("user_id", p.id).eq("status", "published").eq("visibility", "public")
            .order("created_at", { ascending: false }).limit(3),
        ]);
        const totalViews = ((vrRes.data ?? []) as any[])
          .reduce((a: number, v: any) => a + (v.views ?? 0), 0);
        const thumbs = ((thRes.data ?? []) as any[])
          .map((v: any) => v.thumbnail_url).filter(Boolean) as string[];
        return {
          ...p,
          video_count:      vcRes.count ?? 0,
          total_views:      totalViews,
          subscriber_count: scRes.count ?? 0,
          preview_thumbs:   thumbs,
        } as Creator;
      })
    );

    // ✅ SEM FILTRO — todos os perfis aparecem, com ou sem vídeos
    setTotal(enriched.length);
    setCreators(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);

  // Subscriptions
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("subscriptions").select("creator_id").eq("subscriber_id", currentUserId)
      .then(({ data }) => setSubscribedIds(new Set((data ?? []).map((r: any) => r.creator_id))));
  }, [currentUserId]);

  const handleSubscribe = async (creatorId: string) => {
    if (!currentUserId) { setShowAuthPopup(true); return; }
    if (subscribedIds.has(creatorId)) {
      await supabase.from("subscriptions").delete()
        .eq("creator_id", creatorId).eq("subscriber_id", currentUserId);
      setSubscribedIds((p) => { const s = new Set(p); s.delete(creatorId); return s; });
      setCreators((p) => p.map((c) => c.id === creatorId ? { ...c, subscriber_count: Math.max(0, c.subscriber_count - 1) } : c));
    } else {
      await supabase.from("subscriptions").insert({ creator_id: creatorId, subscriber_id: currentUserId });
      setSubscribedIds((p) => new Set(p).add(creatorId));
      setCreators((p) => p.map((c) => c.id === creatorId ? { ...c, subscriber_count: c.subscriber_count + 1 } : c));
    }
  };

  const displayed = (() => {
    let list = [...creators];
    if (dQuery.trim()) {
      const q = dQuery.toLowerCase();
      list = list.filter((c) => (c.full_name ?? "").toLowerCase().includes(q) || c.username.toLowerCase().includes(q));
    }
    if (sort === "subscribers") list.sort((a, b) => b.subscriber_count - a.subscriber_count);
    if (sort === "videos")      list.sort((a, b) => b.video_count - a.video_count);
    if (sort === "views")       list.sort((a, b) => b.total_views - a.total_views);
    if (sort === "recentes")    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  })();

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/12 via-neon-pink/8 to-neon-blue/5 border border-white/8 p-7">
          <div className="absolute -top-14 -right-14 w-56 h-56 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-neon-pink/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-pink/12 border border-neon-pink/22 text-neon-pink text-[11px] font-bold tracking-wider uppercase mb-3">
                <Crown size={11} /> {t("models.hero.badge")}
              </div>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                {t("models.hero.title")}{" "}
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                  {t("models.hero.titleHighlight")}
                </span>
              </h1>
              <p className="text-foreground/50 text-sm leading-relaxed">
                {t("models.hero.subtitle")}
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: t("models.stats.creators"), value: loading ? "—" : fmtNum(total),                                            icon: Users, color: "text-neon-pink" },
                { label: t("models.stats.videos"),   value: loading ? "—" : fmtNum(creators.reduce((sum, c) => sum + c.video_count, 0)), icon: Film,  color: "text-neon-blue" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center px-5 py-4 rounded-xl bg-white/5 border border-white/8 flex-shrink-0">
                  <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-foreground/35">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pesquisa + ordenação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-neon-purple/35 transition-all">
            <Search size={15} className="text-foreground/35 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t("models.search.placeholder")}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/28" />
            {query && <button onClick={() => setQuery("")} className="text-foreground/30 hover:text-foreground/60"><X size={13} /></button>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              ["subscribers", t("models.sort.mostFans"),    Users],
              ["videos",      t("models.sort.mostVideos"),  Film],
              ["views",       t("models.sort.mostViewed"),  Eye],
              ["recentes",    t("models.sort.recent"),      Sparkles],
            ] as [SortOption, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setSort(val)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  sort === val
                    ? "bg-neon-purple/12 border-neon-purple/35 text-neon-purple"
                    : "bg-white/5 border-white/10 text-foreground/50 hover:border-white/20 hover:text-foreground/70"
                }`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Label pesquisa */}
        {dQuery && !loading && (
          <p className="text-sm text-foreground/40 flex items-center gap-1.5">
            <Search size={13} />
            {displayed.length > 0
              ? <>{t("models.results.count", { count: displayed.length, query: dQuery })}</>
              : <>{t("models.results.empty", { query: dQuery })}</>
            }
          </p>
        )}

        {/* Grelha */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden animate-pulse">
                <div className="h-28 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="w-14 h-14 rounded-2xl bg-white/8 -mt-7" />
                    <div className="h-7 w-20 rounded-xl bg-white/5" />
                  </div>
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(3)].map((_, j) => <div key={j} className="h-10 rounded-xl bg-white/5" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Users size={28} className="text-foreground/20" />
            </div>
            <div className="text-center">
              <p className="text-foreground/60 font-medium">{t("models.empty.title")}</p>
              <p className="text-foreground/30 text-sm mt-1">
                {dQuery ? t("models.empty.trySearch") : t("models.empty.noCreators")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayed.map((creator, i) => (
              <CreatorCard key={creator.id} creator={creator} index={i}
                isSubscribed={subscribedIds.has(creator.id)}
                onSubscribe={handleSubscribe} />
            ))}
          </div>
        )}
      </div>

      {showAuthPopup && <AuthPopup action="subscribe" onClose={() => setShowAuthPopup(false)} />}
    </Layout>
  );
}

// ─────────────────────────────────────────────
// PÁGINA DO CANAL
// ─────────────────────────────────────────────
export function ModeloCanal() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [creator, setCreator]             = useState<Creator | null>(null);
  const [videos, setVideos]               = useState<VideoItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [viewMode, setViewMode]           = useState<"grid" | "list">("grid");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed]   = useState(false);
  const [subCount, setSubCount]           = useState(0);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState("subscribe");
  const [msgSent, setMsgSent]             = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setCurrentUserId(s?.user?.id ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from("profiles_public").select("id, slug, username, full_name, avatar_url, created_at").eq("id", id).single(),
      supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", id).eq("status", "published").eq("visibility", "public"),
      supabase.from("videos").select("views").eq("user_id", id).eq("status", "published").eq("visibility", "public"),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("creator_id", id),
    ]).then(([profRes, vidCountRes, viewsRes, subsRes]) => {
      if (!profRes.data) { setLoading(false); return; }
      const totalViews = ((viewsRes.data ?? []) as any[]).reduce((a: number, v: any) => a + (v.views ?? 0), 0);
      setCreator({
        ...(profRes.data as any),
        video_count: vidCountRes.count ?? 0, total_views: totalViews,
        subscriber_count: subsRes.count ?? 0, preview_thumbs: [],
      });
      setSubCount(subsRes.count ?? 0);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!currentUserId || !id) return;
    supabase.from("subscriptions").select("id").eq("creator_id", id).eq("subscriber_id", currentUserId).maybeSingle()
      .then(({ data }) => setIsSubscribed(!!data));
  }, [currentUserId, id]);

  const fetchVideos = useCallback(async () => {
    if (!id) return;
    setLoadingVideos(true);
    const { data } = await supabase.from("videos")
      .select("id, title, thumbnail_url, views, duration, created_at")
      .eq("user_id", id).eq("status", "published").eq("visibility", "public")
      .order("created_at", { ascending: false }).limit(60);
    const vids = (data ?? []) as Omit<VideoItem, "likes_count">[];
    const withLikes = await Promise.all(vids.map(async (v) => {
      const { count } = await supabase.from("interacoes").select("*", { count: "exact", head: true })
        .eq("video_id", v.id).eq("tipo", true);
      return { ...v, likes_count: count ?? 0 };
    }));
    setVideos(withLikes);
    setLoadingVideos(false);
  }, [id]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`canal-${id}-rt`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" },
        (payload) => { if ((payload.new as any)?.user_id === id) fetchVideos(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, fetchVideos]);

  const handleSubscribe = async () => {
    if (!currentUserId) { setPendingAction("subscribe"); setShowAuthPopup(true); return; }
    if (!id) return;
    if (isSubscribed) {
      await supabase.from("subscriptions").delete().eq("creator_id", id).eq("subscriber_id", currentUserId);
      setIsSubscribed(false); setSubCount((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("subscriptions").insert({ creator_id: id, subscriber_id: currentUserId });
      setIsSubscribed(true); setSubCount((n) => n + 1);
    }
  };

  const handleMessage = () => {
    if (!currentUserId) { setPendingAction("message"); setShowAuthPopup(true); return; }
    setMsgSent(true); setTimeout(() => setMsgSent(false), 2500);
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-neon-purple/50" />
      </div>
    </Layout>
  );

  if (!creator) return (
    <Layout>
      <div className="max-container safe-area py-20 text-center space-y-4">
        <Users size={40} className="mx-auto text-white/15" />
        <p className="text-foreground/50">{t("models.channel.notFound")}</p>
        <button onClick={() => navigate("/modelos")} className="text-sm text-neon-pink hover:text-neon-pink/80">{t("models.channel.backToModels")}</button>
      </div>
    </Layout>
  );

  const creatorName = creator.full_name || creator.username;

  return (
    <Layout>
      <div className="max-container safe-area pb-12 space-y-0">

        {/* Banner — usa avatar como fallback quando sem vídeos */}
        <div className="relative h-44 sm:h-56 rounded-b-3xl overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
          {creator.preview_thumbs[0] ? (
            <img src={creator.preview_thumbs[0]} alt="" className="w-full h-full object-cover opacity-40" />
          ) : creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" className="w-full h-full object-cover opacity-20 scale-110 blur-sm" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-purple/25 via-neon-pink/15 to-neon-blue/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <button onClick={() => navigate("/modelos")}
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/12 text-white/70 text-xs hover:bg-black/70 transition-colors backdrop-blur-sm">
            <ArrowLeft size={13} /> {t("nav.links.models")}
          </button>
        </div>

        {/* Perfil */}
        <div className="px-4 sm:px-6 lg:px-8 -mt-14 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-background bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 overflow-hidden shadow-xl flex-shrink-0">
                {creator.avatar_url
                  ? <img src={creator.avatar_url} alt={creatorName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><User size={36} className="text-white/30" /></div>
                }
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{creatorName}</h1>
                  <div className="w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center">
                    <CheckCircle size={11} fill="white" className="text-white" />
                  </div>
                </div>
                <p className="text-foreground/40 text-sm">@{creator.username}</p>
                <p className="text-foreground/30 text-xs mt-0.5 flex items-center gap-1">
                  <Calendar size={10} /> {t("models.channel.memberSince", { date: fmtDate(creator.created_at) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleMessage}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  msgSent ? "bg-emerald-500/12 border-emerald-500/25 text-emerald-400"
                  : "bg-white/5 border-white/12 text-foreground/60 hover:bg-white/10 hover:text-white"
                }`}>
                <MessageCircle size={15} /> {msgSent ? t("models.channel.sent") : t("models.channel.message")}
              </button>
              <button onClick={handleSubscribe}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isSubscribed
                    ? "bg-white/8 border border-white/12 text-white/50 hover:bg-white/12"
                    : "bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:shadow-lg hover:shadow-neon-pink/25"
                }`}>
                {isSubscribed ? <><BellOff size={15} /> {t("common.subscribed")}</> : <><Bell size={15} /> {t("common.subscribe")}</>}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: t("models.channel.videosPublished"), value: fmtNum(creator.video_count), icon: Film,  color: "text-neon-pink"   },
              { label: t("models.channel.totalViews"),      value: fmtNum(creator.total_views),  icon: Eye,   color: "text-neon-blue"   },
              { label: t("models.channel.subscribers"),     value: fmtNum(subCount),             icon: Users, color: "text-neon-purple" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-center">
                <Icon size={18} className={`mx-auto mb-1.5 ${color}`} />
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[11px] text-foreground/35 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Vídeos */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-foreground/80 flex items-center gap-2">
              <Film size={16} className="text-neon-pink" />
              {t("models.channel.channelVideos")}
              {!loadingVideos && <span className="text-foreground/30 text-sm font-normal">({videos.length})</span>}
            </h2>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-foreground/70"}`}>
                <Grid3x3 size={13} />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-neon-pink text-white" : "text-foreground/40 hover:text-foreground/70"}`}>
                <List size={13} />
              </button>
            </div>
          </div>

          {loadingVideos ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="aspect-video rounded-xl bg-white/5" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Film size={28} className="text-foreground/20" />
              </div>
              <div className="text-center">
                <p className="text-foreground/55 font-medium">{t("models.channel.noVideos.title")}</p>
                <p className="text-foreground/30 text-sm mt-1">{t("models.channel.noVideos.subtitle")}</p>
              </div>
              {!isSubscribed && (
                <button onClick={handleSubscribe}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:shadow-lg hover:shadow-neon-pink/25 transition-all">
                  <Bell size={14} /> {t("models.channel.noVideos.subscribeBtn")}
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((v) => (
                <Link key={v.id} to={`/video/${v.id}`} className="group block">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 mb-2">
                    {v.thumbnail_url
                      ? <img src={v.thumbnail_url} alt={v.title ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Film size={22} className="text-white/15" /></div>
                    }
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-neon-pink scale-0 group-hover:scale-100 transition-transform flex items-center justify-center">
                        <Play size={16} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                    {v.duration && (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded">
                        {fmtDuration(v.duration)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">{v.title || t("common.noTitle")}</p>
                  <div className="flex items-center gap-2.5 mt-1 text-[10px] text-foreground/35">
                    <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(v.views)}</span>
                    <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/50" />{fmtNum(v.likes_count)}</span>
                    <span>{fmtRelative(v.created_at, t)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <Link key={v.id} to={`/video/${v.id}`}
                  className="group flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] hover:border-white/14 transition-all">
                  <div className="relative w-36 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                    {v.thumbnail_url
                      ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Film size={16} className="text-white/15" /></div>
                    }
                    {v.duration && (
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[8px] font-mono rounded">
                        {fmtDuration(v.duration)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-xs font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors">{v.title || t("common.noTitle")}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-foreground/35">
                      <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(v.views)}</span>
                      <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/50" />{fmtNum(v.likes_count)}</span>
                      <span>{fmtRelative(v.created_at, t)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAuthPopup && <AuthPopup action={pendingAction} onClose={() => setShowAuthPopup(false)} />}
    </Layout>
  );
}

export default ModelosPage;