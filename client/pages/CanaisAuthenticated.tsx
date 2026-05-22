// src/pages/CanaisAuthenticated.tsx
// Página de Canais — TV / Streaming — versão autenticada (com conta)
// Dados da tabela: public.canais (tabela independente — executa add_canais_table.sql)
// Subscriptions: public.canal_subscriptions
// Executar primeiro: add_canais_table.sql no Supabase SQL Editor

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Tv, Play, Eye, Heart, Users, Film, Search, X, Bell, BellOff,
  Crown, Sparkles, CheckCircle, TrendingUp, Radio, Wifi,
  Layers, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Canal = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  categoria: string | null;
  verificado: boolean;
  ativo: boolean;
  created_at: string;
  video_count: number;
  total_views: number;
  subscriber_count: number;
  preview_thumbs: string[];
  latest_title: string | null;
};

type CanalVideo = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  likes_count: number;
};

type SortOpt = "subscribers" | "videos" | "views" | "recentes";

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
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "agora";
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return `há ${Math.floor(d / 7)}sem`;
}

const GRADIENTS = [
  "from-rose-700/50 via-pink-900/30 to-[#0d0d12]",
  "from-violet-700/50 via-purple-900/30 to-[#0d0d12]",
  "from-blue-700/50 via-indigo-900/30 to-[#0d0d12]",
  "from-emerald-700/50 via-teal-900/30 to-[#0d0d12]",
  "from-amber-700/50 via-orange-900/30 to-[#0d0d12]",
  "from-cyan-700/50 via-sky-900/30 to-[#0d0d12]",
  "from-fuchsia-700/50 via-purple-900/30 to-[#0d0d12]",
  "from-red-700/50 via-rose-900/30 to-[#0d0d12]",
];

// ─────────────────────────────────────────────
// Auth Popup
// ─────────────────────────────────────────────
function AuthPopup({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative max-w-sm w-full rounded-2xl border border-neon-pink/20 overflow-hidden shadow-[0_0_80px_rgba(236,72,153,0.15)]"
        style={{ background: "linear-gradient(135deg,#1a0830 0%,#200a18 60%,#0d0820 100%)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/22 hover:text-white/60 transition-colors z-10">
          <X size={18} />
        </button>
        <div className="relative p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
            <Tv size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">{t("pages.canais.auth.subscribe")}</h3>
          <p className="text-white/42 text-sm mb-6">
            {t("pages.canais.auth.body")}
          </p>
          <div className="space-y-2.5">
            <Link to="/signup" onClick={onClose}
              className="block w-full py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all">
              {t("pages.canais.auth.createAccount")}
            </Link>
            <Link to="/login" onClick={onClose}
              className="block w-full py-3 bg-white/6 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">
              {t("pages.canais.auth.hasAccount")}
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
// Card de Canal
// ─────────────────────────────────────────────
function CanalCard({ canal, index, isSubscribed, onSubscribe, onOpen }: {
  canal: Canal; index: number; isSubscribed: boolean;
  onSubscribe: (id: string) => void; onOpen: (c: Canal) => void;
}) {
  const { t } = useTranslation();
  const grad = GRADIENTS[index % GRADIENTS.length];
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d12] hover:border-white/20 transition-all duration-300 cursor-pointer"
      onClick={() => onOpen(canal)}>

      {/* Banner */}
      <div className="relative h-36 overflow-hidden">
        {canal.preview_thumbs.length >= 3 ? (
          <div className="flex h-full gap-px">
            <div className="flex-[2] overflow-hidden">
              <img src={canal.preview_thumbs[0]} alt="" loading="lazy"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-600" />
            </div>
            <div className="flex-1 flex flex-col gap-px">
              {canal.preview_thumbs.slice(1, 3).map((url, i) => (
                <div key={i} className="flex-1 overflow-hidden">
                  <img src={url} alt="" loading="lazy"
                    className="w-full h-full object-cover opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-600" />
                </div>
              ))}
            </div>
          </div>
        ) : canal.banner_url ? (
          <img src={canal.banner_url} alt="" loading="lazy"
            className="w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-600" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/30 to-transparent" />

        {/* Badge NOVO — só para subscritos com vídeo recente */}
        {isSubscribed && canal.latest_title && (
          <div className="absolute top-3 right-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-pink/25 border border-neon-pink/40 text-neon-pink text-[9px] font-black">
            <Zap size={8} fill="currentColor" /> NOVO
          </div>
        )}

        {/* Badge estado */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/15 backdrop-blur-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${canal.video_count > 0 ? "bg-red-500 animate-pulse" : "bg-white/30"}`} />
          <span className="text-white/80 text-[10px] font-black tracking-widest uppercase">
            {canal.video_count > 0 ? t("pages.canais.card.active") : t("pages.canais.card.soon")}
          </span>
        </div>

        {/* Badge verificado */}
        {canal.verificado && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-neon-blue/90 border border-white/20 flex items-center justify-center shadow">
            <CheckCircle size={12} fill="white" className="text-white" />
          </div>
        )}

        {/* Play hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/25 flex items-center justify-center backdrop-blur-sm">
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="px-4 pb-4 -mt-5 relative z-10">
        <div className="flex items-end justify-between mb-3">
          <div className="w-12 h-12 rounded-xl border-2 border-[#0d0d12] overflow-hidden shadow-lg flex-shrink-0">
            {canal.avatar_url
              ? <img src={canal.avatar_url} alt={canal.nome} className="w-full h-full object-cover" />
              : <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}><Tv size={18} className="text-white/60" /></div>
            }
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSubscribe(canal.id); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
              isSubscribed
                ? "bg-white/6 border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400"
                : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink hover:bg-neon-pink/18 hover:scale-[1.03]"
            }`}>
            {isSubscribed ? <><BellOff size={10} />{t("pages.canais.card.subscribed")}</> : <><Bell size={10} />{t("pages.canais.card.subscribe")}</>}
          </button>
        </div>

        <div className="mb-3">
          <h3 className="font-black text-white text-sm group-hover:text-neon-pink transition-colors truncate">{canal.nome}</h3>
          {canal.categoria && <span className="text-[10px] text-neon-pink/60 font-semibold uppercase tracking-wider">{canal.categoria}</span>}
          {canal.latest_title && (
            <p className="text-[10px] text-white/25 truncate mt-0.5 flex items-center gap-1">
              <Play size={8} className="text-neon-pink/40 flex-shrink-0" />{canal.latest_title}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1">
          {[
            { label: t("pages.canais.card.videos"),      value: fmtNum(canal.video_count),      icon: Film  },
            { label: t("pages.canais.card.views"),       value: fmtNum(canal.total_views),      icon: Eye   },
            { label: t("pages.canais.card.subscribers"), value: fmtNum(canal.subscriber_count), icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/[0.04] border border-white/6 rounded-xl py-2 text-center">
              <Icon size={9} className="text-white/28 mx-auto mb-0.5" />
              <p className="text-[11px] font-black text-white/75">{value}</p>
              <p className="text-[9px] text-white/25">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Detalhe do canal
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Detalhe do canal — versão autenticada
// Vídeos com navegação para /app/video/:id
// ─────────────────────────────────────────────
function CanalDetalhe({ canal, isSubscribed, onSubscribe, onBack }: {
  canal: Canal; isSubscribed: boolean;
  onSubscribe: (id: string) => void; onBack: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const grad = GRADIENTS[0];
  const [videos, setVideos]         = useState<CanalVideo[]>([]);
  const [loadingVideos, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, views, duration, created_at")
      .eq("canal_id", canal.id)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(60);

    if (!data) { setLoading(false); return; }
    const withLikes: CanalVideo[] = await Promise.all(
      (data as any[]).map(async (v) => {
        const { count } = await supabase
          .from("interacoes").select("*", { count: "exact", head: true })
          .eq("video_id", v.id).eq("tipo", true);
        return { ...v, likes_count: count ?? 0 };
      })
    );
    setVideos(withLikes);
    setLoading(false);
  }, [canal.id]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  // Realtime — novo vídeo no canal aparece automaticamente
  useEffect(() => {
    const ch = supabase.channel(`canal-auth-detalhe-${canal.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "videos",
        filter: `canal_id=eq.${canal.id}`,
      }, () => fetchVideos())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [canal.id, fetchVideos]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative h-48 sm:h-60 rounded-2xl overflow-hidden">
        {canal.banner_url ? (
          <img src={canal.banner_url} alt="" className="w-full h-full object-cover opacity-55" />
        ) : videos[0]?.thumbnail_url ? (
          <img src={videos[0].thumbnail_url} alt="" className="w-full h-full object-cover opacity-30 blur-sm scale-105" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <button onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/12 text-white/70 text-xs hover:bg-black/80 transition-all backdrop-blur-sm">
          {t("pages.canais.detail.back")}
        </button>
      </div>

      <div className="-mt-16 relative z-10 px-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-background overflow-hidden shadow-xl flex-shrink-0">
              {canal.avatar_url
                ? <img src={canal.avatar_url} alt={canal.nome} className="w-full h-full object-cover" />
                : <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}><Tv size={28} className="text-white/60" /></div>
              }
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{canal.nome}</h1>
                {canal.verificado && (
                  <div className="w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center">
                    <CheckCircle size={11} fill="white" className="text-white" />
                  </div>
                )}
              </div>
              {canal.categoria && <p className="text-neon-pink/70 text-xs font-bold uppercase tracking-wider">{canal.categoria}</p>}
              {canal.descricao && <p className="text-white/45 text-sm mt-1 max-w-md leading-relaxed">{canal.descricao}</p>}
            </div>
          </div>
          <button onClick={() => onSubscribe(canal.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
              isSubscribed
                ? "bg-white/8 border border-white/12 text-white/50 hover:bg-white/12"
                : "bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:shadow-lg hover:shadow-neon-pink/25"
            }`}>
            {isSubscribed ? <><BellOff size={15} />{t("pages.canais.card.subscribed")}</> : <><Bell size={15} />{t("pages.canais.card.subscribe")}</>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: t("pages.canais.detail.videos"),      value: fmtNum(canal.video_count),      icon: Film,  color: "text-neon-pink"   },
            { label: t("pages.canais.detail.views"),       value: fmtNum(canal.total_views),      icon: Eye,   color: "text-neon-blue"   },
            { label: t("pages.canais.detail.subscribers"), value: fmtNum(canal.subscriber_count), icon: Users, color: "text-neon-purple" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 text-center">
              <Icon size={18} className={`mx-auto mb-1.5 ${color}`} />
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Film size={13} className="text-neon-pink" />
          {t("pages.canais.detail.channelVideos")}
          {!loadingVideos && <span className="text-neon-pink">({videos.length})</span>}
        </h2>

        {loadingVideos ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="aspect-video rounded-xl bg-white/5" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-2.5 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map((v) => (
              <Link key={v.id} to={`/app/video/${v.id}`} className="group/v block">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 mb-2">
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} alt={v.title ?? ""} loading="lazy"
                        className="w-full h-full object-cover opacity-80 group-hover/v:opacity-100 group-hover/v:scale-105 transition-all duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><Film size={20} className="text-white/15" /></div>
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover/v:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-neon-pink/90 scale-0 group-hover/v:scale-100 transition-transform duration-300 flex items-center justify-center">
                      <Play size={14} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {v.duration && (
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded">
                      {fmtDuration(v.duration)}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-white/80 line-clamp-2 group-hover/v:text-neon-pink transition-colors leading-snug">
                  {v.title || t("common.noTitle")}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/32">
                  <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(v.views)}</span>
                  <span className="flex items-center gap-0.5"><Heart size={9} className="text-neon-pink/45" />{fmtNum(v.likes_count)}</span>
                  <span className="ml-auto">{fmtRelative(v.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Film size={24} className="text-white/18" />
            </div>
            <p className="text-white/38 text-sm">{t("pages.canais.detail.noVideos.title")}</p>
            {!isSubscribed && (
              <button onClick={() => onSubscribe(canal.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-xs font-bold mt-1 hover:shadow-lg hover:shadow-neon-pink/20 transition-all">
                <Bell size={12} /> {t("pages.canais.detail.noVideos.subscribeBtn")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export default function CanaisAuthenticated() {
  const { t } = useTranslation();
  const [canais, setCanais]         = useState<Canal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState("");
  const [dQuery, setDQuery]         = useState("");
  const [sort, setSort]             = useState<SortOpt>("subscribers");
  const [catFiltro, setCat]         = useState<string | null>(null);
  const [tab, setTab]               = useState<"todos" | "meus">("todos");
  const [total, setTotal]           = useState(0);
  const [selected, setSelected]     = useState<Canal | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const debRef = useRef<ReturnType<typeof setTimeout>>();

// ── Auth guard ───────────────────────────
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

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDQuery(query), 380);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [query]);

  const fetchCanais = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("canais")
      .select("id, nome, slug, descricao, avatar_url, banner_url, categoria, verificado, ativo, created_at")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) { setCanais([]); setLoading(false); return; }

    const enriched: Canal[] = await Promise.all(
      (data as any[]).map(async (c) => {
        const [vcRes, vrRes, scRes, thRes, latestRes] = await Promise.all([
          supabase.from("videos").select("*", { count: "exact", head: true }).eq("canal_id", c.id),
          supabase.from("videos").select("views").eq("canal_id", c.id),
          supabase.from("canal_subscriptions").select("*", { count: "exact", head: true }).eq("canal_id", c.id),
          supabase.from("videos").select("thumbnail_url").eq("canal_id", c.id)
            .order("created_at", { ascending: false }).limit(3),
          supabase.from("videos").select("title").eq("canal_id", c.id)
            .order("created_at", { ascending: false }).limit(1),
        ]);
        const totalViews = ((vrRes.data ?? []) as any[]).reduce((a: number, v: any) => a + (v.views ?? 0), 0);
        const thumbs = ((thRes.data ?? []) as any[]).map((v: any) => v.thumbnail_url).filter(Boolean) as string[];
        return {
          ...c,
          video_count:      vcRes.count ?? 0,
          total_views:      totalViews,
          subscriber_count: scRes.count ?? 0,
          preview_thumbs:   thumbs,
          latest_title:     ((latestRes.data ?? []) as any[])[0]?.title ?? null,
        } as Canal;
      })
    );
    setTotal(enriched.length);
    setCanais(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCanais(); }, [fetchCanais]);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("canal_subscriptions").select("canal_id").eq("subscriber_id", currentUserId)
      .then(({ data }) => setSubscribedIds(new Set((data ?? []).map((r: any) => r.canal_id))));
  }, [currentUserId]);

  useEffect(() => {
    const ch = supabase.channel("canais-auth-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "canais" }, () => fetchCanais())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" }, () => fetchCanais())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchCanais]);

  const handleSubscribe = async (canalId: string) => {
    if (!currentUserId) return; // guard — utilizador está sempre autenticado
    if (subscribedIds.has(canalId)) {
      await supabase.from("canal_subscriptions").delete().eq("canal_id", canalId).eq("subscriber_id", currentUserId);
      setSubscribedIds((p) => { const s = new Set(p); s.delete(canalId); return s; });
      setCanais((p) => p.map((c) => c.id === canalId ? { ...c, subscriber_count: Math.max(0, c.subscriber_count - 1) } : c));
    } else {
      await supabase.from("canal_subscriptions").insert({ canal_id: canalId, subscriber_id: currentUserId });
      setSubscribedIds((p) => new Set(p).add(canalId));
      setCanais((p) => p.map((c) => c.id === canalId ? { ...c, subscriber_count: c.subscriber_count + 1 } : c));
    }
  };

  const categorias = [...new Set(canais.map((c) => c.categoria).filter(Boolean))] as string[];

  const displayed = (() => {
    let list = tab === "meus" ? canais.filter(c => subscribedIds.has(c.id)) : [...canais];
    if (catFiltro) list = list.filter((c) => c.categoria === catFiltro);
    if (dQuery.trim()) {
      const q = dQuery.toLowerCase();
      list = list.filter((c) => c.nome.toLowerCase().includes(q) || (c.descricao ?? "").toLowerCase().includes(q));
    }
    if (sort === "subscribers") list.sort((a, b) => b.subscriber_count - a.subscriber_count);
    if (sort === "videos")      list.sort((a, b) => b.video_count - a.video_count);
    if (sort === "views")       list.sort((a, b) => b.total_views - a.total_views);
    if (sort === "recentes")    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  })();

  if (selected) {
    return (
      <LayoutAuthenticated>
        <div className="max-container safe-area py-6">
          <CanalDetalhe canal={selected} isSubscribed={subscribedIds.has(selected.id)}
            onSubscribe={handleSubscribe} onBack={() => setSelected(null)} />
        </div>
      
      </LayoutAuthenticated>
    );
  }

  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-6 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/8 p-8"
          style={{ background: "linear-gradient(135deg,#0f0218 0%,#160824 40%,#0a0f1e 100%)" }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[11px] font-black tracking-widest uppercase mb-4">
                <Radio size={10} className="animate-pulse" /> TV & Streaming
              </div>
              <h1 className="text-4xl font-black text-white mb-2 leading-tight tracking-tight">
                {t("pages.canais.hero.title")}{" "}
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">{t("pages.canais.hero.titleHighlight")}</span>
              </h1>
              <p className="text-white/42 text-sm max-w-md">
                {t("pages.canais.hero.subtitle")}
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {[
                { label: t("pages.canais.hero.stats.channels"),   value: loading ? "—" : fmtNum(total),                                        icon: Tv,   color: "text-neon-pink" },
                { label: t("pages.canais.hero.stats.active"),     value: loading ? "—" : fmtNum(canais.filter(c => c.video_count > 0).length), icon: Wifi, color: "text-red-400"   },
                { label: t("pages.canais.hero.stats.subscribed"), value: loading ? "—" : fmtNum(subscribedIds.size), icon: Bell, color: "text-neon-purple" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center px-5 py-4 rounded-2xl bg-white/5 border border-white/8">
                  <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-white/30">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ── Tabs: Todos / Os Meus Canais ── */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-xl p-1 self-start">
          <button onClick={() => setTab("todos")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "todos" ? "bg-neon-pink text-white shadow-sm" : "text-white/42 hover:text-white/65"
            }`}>
            <Layers size={12} /> {t("pages.canais.filters.all")}
          </button>
          <button onClick={() => setTab("meus")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "meus" ? "bg-neon-purple text-white shadow-sm" : "text-white/42 hover:text-white/65"
            }`}>
            <Bell size={12} /> {t("pages.canais.filters.myChannels")}
            {subscribedIds.size > 0 && (
              <span className={`text-[9px] px-1.5 rounded-full font-black ${tab === "meus" ? "bg-white/20 text-white" : "bg-neon-purple/20 text-neon-purple"}`}>
                {subscribedIds.size}
              </span>
            )}
          </button>
        </div>

        {/* Filtro por categoria */}
        {categorias.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <button onClick={() => setCat(null)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                !catFiltro ? "bg-neon-pink text-white border-neon-pink" : "bg-white/5 border-white/10 text-white/45 hover:border-white/18"
              }`}>
              {t("pages.canais.filters.all")}
            </button>
            {categorias.map((cat) => (
              <button key={cat} onClick={() => setCat(catFiltro === cat ? null : cat)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  catFiltro === cat ? "bg-neon-purple/15 border-neon-purple/35 text-neon-purple" : "bg-white/5 border-white/10 text-white/45 hover:border-white/18"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Pesquisa + ordenação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-neon-pink/30 transition-all">
            <Search size={14} className="text-white/30 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pages.canais.filters.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/22" />
            {query && <button onClick={() => setQuery("")} className="text-white/22 hover:text-white/55 transition-colors"><X size={13} /></button>}
          </div>
          <div className="flex items-center gap-1.5">
            {([
              ["subscribers", t("pages.canais.filters.sort.subscribers"), Users],
              ["videos",      t("pages.canais.filters.sort.videos"),      Film],
              ["views",       t("pages.canais.filters.sort.views"),       Eye],
              ["recentes",    t("pages.canais.filters.sort.recent"),      Sparkles],
            ] as [SortOpt, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setSort(val)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  sort === val ? "bg-neon-pink/12 border-neon-pink/35 text-neon-pink" : "bg-white/5 border-white/10 text-white/42 hover:border-white/20"
                }`}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Grelha */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden animate-pulse">
                <div className="h-36 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-end"><div className="w-12 h-12 rounded-xl bg-white/8 -mt-5" /><div className="h-6 w-20 rounded-xl bg-white/5" /></div>
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="grid grid-cols-3 gap-1">{[0,1,2].map(j=><div key={j} className="h-10 rounded-xl bg-white/5"/>)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Tv size={28} className="text-white/18" />
            </div>
            <p className="text-white/45 font-semibold">
              {tab === "meus"
                ? t("pages.canais.empty.myChannels")
                : dQuery ? t("pages.canais.empty.withQuery", { query: dQuery }) : t("pages.canais.empty.noChannels")
              }
            </p>
            {tab === "meus" ? (
              <button onClick={() => setTab("todos")} className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors">
                {t("pages.canais.empty.exploreAll")}
              </button>
            ) : (
              <p className="text-white/28 text-sm text-center max-w-xs">
                {t("pages.canais.platformNote")}
              </p>
            )}
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Crown size={13} className="text-amber-400" /> {t("pages.canais.sections.featured")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {displayed.slice(0, 3).map((c, i) => (
                  <CanalCard key={c.id} canal={c} index={i} isSubscribed={subscribedIds.has(c.id)}
                    onSubscribe={handleSubscribe} onOpen={setSelected} />
                ))}
              </div>
            </section>
            {displayed.length > 3 && (
              <section>
                <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp size={13} className="text-neon-purple" /> {t("pages.canais.sections.all")}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayed.slice(3).map((c, i) => (
                    <CanalCard key={c.id} canal={c} index={i+3} isSubscribed={subscribedIds.has(c.id)}
                      onSubscribe={handleSubscribe} onOpen={setSelected} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}


      </div>
    
    </LayoutAuthenticated>
  );
}