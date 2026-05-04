// src/pages/modelos/ModelosAuthenticated.tsx
// Lista de criadores/modelos para utilizadores autenticados
// Rota: /app/modelos  (ou equivalente autenticada)
//
// Diferenças vs ModelosPage.tsx (versão pública):
//   • Usa LayoutAuthenticated em vez de Layout
//   • Redirect automático para /login se sessão inexistente
//   • Sem AuthPopup — subscrever funciona diretamente (utilizador já tem conta)
//   • Stats extra no hero: "Os teus subscritos" — quantos canais o utilizador segue
//   • Badge "A seguir" nos cards que o utilizador já subscreve

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Creator, fmtNum,
  GRADIENTS, ACCENT_COLORS,
} from "./modelos/types";
import {
  Search, X, Users, Film, Eye, Crown, Sparkles,
  ChevronRight, Bell, BellOff, CheckCircle,
  User, Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────
// Card de modelo (autenticado)
// — igual ao público mas sem necessidade de AuthPopup
// ─────────────────────────────────────────────
function CreatorCard({
  creator, index, isSubscribed, onSubscribe, onOpenChannel,
}: {
  creator: Creator;
  index: number;
  isSubscribed: boolean;
  onSubscribe: (id: string) => void;
  onOpenChannel: (id: string) => void;
}) {
  const grad   = GRADIENTS[index % GRADIENTS.length];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div className="group relative bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-white/16 hover:bg-white/[0.05] transition-all duration-300">

      {/* ── Faixa de preview ── */}
      <div
        className="relative h-32 cursor-pointer overflow-hidden"
        onClick={() => onOpenChannel(creator.id)}
      >
        {creator.preview_thumbs.length > 0 ? (
          <div className="flex h-full gap-0.5">
            {creator.preview_thumbs.slice(0, 3).map((url, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-black/40"
                style={{ flex: i === 0 ? "2 1 0%" : "1 1 0%" }}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad}`} />
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent pointer-events-none" />

        {/* Badge verificado */}
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-neon-blue/90 border border-white/20 flex items-center justify-center shadow">
          <CheckCircle size={12} fill="white" className="text-white" />
        </div>

        {/* Badge "A seguir" — só aparece se já subscreve */}
        {isSubscribed && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-neon-pink text-[9px] font-bold">
            <Bell size={8} fill="currentColor" /> A seguir
          </div>
        )}

        {/* Badge contagem de vídeos (quando não está a seguir) */}
        {!isSubscribed && creator.video_count > 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-[10px] text-white/70">
            <Film size={9} />
            {creator.video_count}
          </div>
        )}
      </div>

      {/* ── Corpo do card ── */}
      <div className="px-4 pb-4">
        {/* Avatar + botão subscrever */}
        <div className="-mt-7 mb-3 flex items-end justify-between">
          <button
            className="w-14 h-14 rounded-2xl border-[3px] border-[#0d0d0d] overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-neon-pink/40 transition-all"
            onClick={() => onOpenChannel(creator.id)}
          >
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.full_name ?? creator.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                <User size={20} className="text-white/40" />
              </div>
            )}
          </button>

          {/* Subscrever — sem popup, direto */}
          <button
            onClick={(e) => { e.stopPropagation(); onSubscribe(creator.id); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
              isSubscribed
                ? "bg-white/6 border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400"
                : `${accent} hover:scale-[1.03] shadow-sm`
            }`}
          >
            {isSubscribed
              ? <><BellOff size={10} />Subscrito</>
              : <><Bell size={10} />Subscrever</>
            }
          </button>
        </div>

        {/* Nome */}
        <button
          className="text-left w-full mb-3"
          onClick={() => onOpenChannel(creator.id)}
        >
          <h3 className="font-bold text-foreground/90 text-sm group-hover:text-white transition-colors truncate">
            {creator.full_name || creator.username}
          </h3>
          <p className="text-[11px] text-foreground/35 truncate">@{creator.username}</p>
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: "Vídeos", value: fmtNum(creator.video_count),      icon: Film  },
            { label: "Views",  value: fmtNum(creator.total_views),      icon: Eye   },
            { label: "Fãs",    value: fmtNum(creator.subscriber_count), icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/[0.03] border border-white/6 rounded-xl py-2 text-center">
              <Icon size={9} className="text-foreground/28 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-foreground/75">{value}</p>
              <p className="text-[9px] text-foreground/28">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => onOpenChannel(creator.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/8 text-[11px] text-foreground/40 hover:bg-white/10 hover:text-neon-pink hover:border-neon-pink/25 transition-all"
        >
          Ver canal completo <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
type SortOpt = "subscribers" | "videos" | "views" | "recentes";

export default function ModelosAuthenticated() {
  const navigate = useNavigate();

  const [creators, setCreators]           = useState<Creator[]>([]);
  const [loading, setLoading]             = useState(true);
  const [query, setQuery]                 = useState("");
  const [dQuery, setDQuery]               = useState("");
  const [sort, setSort]                   = useState<SortOpt>("subscribers");
  const [total, setTotal]                 = useState(0);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());

  const debRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Auth + redirect ───────────────────────
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

  // ── Debounce pesquisa ─────────────────────
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDQuery(query), 380);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [query]);

  // ── Fetch criadores ───────────────────────
  const fetchCreators = useCallback(async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("profiles_public")
      .select("id, username, full_name, avatar_url, created_at")
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

    // Mostrar todos os perfis — com ou sem vídeos publicados
    setTotal(enriched.length);
    setCreators(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);

  // ── Subscriptions do utilizador ───────────
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("subscriptions").select("creator_id")
      .eq("subscriber_id", currentUserId)
      .then(({ data }) =>
        setSubscribedIds(new Set((data ?? []).map((r: any) => r.creator_id)))
      );
  }, [currentUserId]);

  // ── Subscrever / dessubscrever ────────────
  const handleSubscribe = async (creatorId: string) => {
    if (!currentUserId) return; // nunca acontece — utilizador está logado
    if (subscribedIds.has(creatorId)) {
      await supabase.from("subscriptions").delete()
        .eq("creator_id", creatorId).eq("subscriber_id", currentUserId);
      setSubscribedIds((p) => { const s = new Set(p); s.delete(creatorId); return s; });
      setCreators((p) => p.map((c) =>
        c.id === creatorId ? { ...c, subscriber_count: Math.max(0, c.subscriber_count - 1) } : c
      ));
    } else {
      await supabase.from("subscriptions").insert({
        creator_id: creatorId, subscriber_id: currentUserId,
      });
      setSubscribedIds((p) => new Set(p).add(creatorId));
      setCreators((p) => p.map((c) =>
        c.id === creatorId ? { ...c, subscriber_count: c.subscriber_count + 1 } : c
      ));
    }
  };

  // ── Filtrar + ordenar ─────────────────────
  const displayed = (() => {
    let list = [...creators];
    if (dQuery.trim()) {
      const q = dQuery.toLowerCase();
      list = list.filter(
        (c) => (c.full_name ?? "").toLowerCase().includes(q) || c.username.toLowerCase().includes(q)
      );
    }
    if (sort === "subscribers") list.sort((a, b) => b.subscriber_count - a.subscriber_count);
    if (sort === "videos")      list.sort((a, b) => b.video_count - a.video_count);
    if (sort === "views")       list.sort((a, b) => b.total_views - a.total_views);
    if (sort === "recentes")    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  })();

  // Quantos canais o utilizador já segue
  const followingCount = subscribedIds.size;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-8 space-y-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/12 via-neon-pink/7 to-neon-blue/5 border border-white/8 p-7">
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-neon-purple/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-neon-pink/7 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[11px] font-bold tracking-wider uppercase mb-3">
                <Crown size={10} /> Criadores exclusivos
              </div>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                Descobre os{" "}
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
                  melhores modelos
                </span>
              </h1>
              <p className="text-foreground/48 text-sm leading-relaxed">
                Subscreve os teus favoritos, acompanha os seus canais e sê o primeiro a ver novos conteúdos.
              </p>
            </div>

            {/* Stats — incluindo "Os teus subscritos" */}
            <div className="flex gap-3 flex-shrink-0">
              {[
                { label: "Criadores",      value: loading ? "—" : fmtNum(total),                                              icon: Users, color: "text-neon-pink"   },
                { label: "Com vídeos",     value: loading ? "—" : fmtNum(creators.filter(c => c.video_count > 0).length),     icon: Film,  color: "text-neon-blue"   },
                { label: "A seguir",       value: loading ? "—" : fmtNum(followingCount),                                     icon: Bell,  color: "text-neon-purple" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center px-4 py-4 rounded-xl bg-white/5 border border-white/8">
                  <Icon size={15} className={`mx-auto mb-1 ${color}`} />
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-foreground/33">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pesquisa + ordenação ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-neon-purple/35 transition-all">
            <Search size={14} className="text-foreground/33 flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar modelos por nome ou username..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/26"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-foreground/28 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              ["subscribers", "Mais Fãs",    Users],
              ["videos",      "Mais Vídeos", Film],
              ["views",       "Mais Vistos", Eye],
              ["recentes",    "Recentes",    Sparkles],
            ] as [SortOpt, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => setSort(val)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  sort === val
                    ? "bg-neon-purple/12 border-neon-purple/35 text-neon-purple"
                    : "bg-white/5 border-white/10 text-foreground/45 hover:border-white/20"
                }`}
              >
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Label resultado de pesquisa ── */}
        {dQuery && !loading && (
          <p className="text-sm text-foreground/38 flex items-center gap-1.5">
            <Search size={12} />
            {displayed.length > 0
              ? <>{displayed.length} modelo{displayed.length !== 1 ? "s" : ""} para "{dQuery}"</>
              : <>Sem resultados para "{dQuery}"</>
            }
          </p>
        )}

        {/* ── Grelha ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden animate-pulse">
                <div className="h-32 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="w-14 h-14 rounded-2xl bg-white/8 -mt-7" />
                    <div className="h-7 w-20 rounded-xl bg-white/5" />
                  </div>
                  <div className="h-3.5 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-1.5">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-12 rounded-xl bg-white/5" />
                    ))}
                  </div>
                  <div className="h-8 bg-white/5 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Users size={28} className="text-foreground/18" />
            </div>
            <p className="text-foreground/50 font-medium">Nenhum modelo encontrado</p>
            <p className="text-foreground/28 text-sm">
              {dQuery ? "Tenta uma pesquisa diferente." : "Ainda não há criadores ativos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayed.map((creator, i) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                index={i}
                isSubscribed={subscribedIds.has(creator.id)}
                onSubscribe={handleSubscribe}
                onOpenChannel={(id) => navigate(`/app/modelo/${id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </LayoutAuthenticated>
  );
}