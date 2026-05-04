// src/hooks/useRecommendations.ts
// Hook central do sistema de recomendação
//
// Como funciona:
//   1. Gera/recupera session_id no localStorage (persiste durante a sessão browser)
//   2. Lê o histórico de categorias vistas (video_views) da sessão/user
//   3. Para autenticados: inclui também categorias das interacoes (likes) e subscriptions
//   4. Constrói um "perfil de interesse" — mapa categoria → peso
//   5. Busca vídeos ordenados por relevância para esse perfil
//   6. Fallback: se perfil vazio, devolve os mais vistos (recém chegado)

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
export type RecoVideo = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  category: string | null;
  likes_count: number;
  comments_count: number;
  creator_name: string | null;
  creator_avatar: string | null;
  reason: string;         // motivo legível da recomendação
  relevance: number;      // 0-100, score de relevância
};

export type RecoTab =
  | "para_voce"           // mix personalizado
  | "historico"           // mesmas categorias que viu
  | "subscricoes"         // vídeos de canais subscritos (auth only)
  | "tendencias";         // mais vistos globalmente

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function getSessionId(): string {
  const KEY = "reco_session_id";
  let sid = localStorage.getItem(KEY);
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(KEY, sid);
  }
  return sid;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

// Razões legíveis para mostrar no card
function buildReason(category: string | null, score: number, tab: RecoTab): string {
  if (tab === "subscricoes") return "Canal que subscreveste";
  if (tab === "tendencias")  return "Em alta na plataforma";
  if (!category) return "Popular na plataforma";
  if (score >= 80) return `Adoras conteúdo de ${category}`;
  if (score >= 50) return `Viste vídeos de ${category}`;
  return `Baseado no teu histórico`;
}

// ─────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────
export function useRecommendations(userId: string | null) {
  const sessionId = getSessionId();

  const [videos, setVideos]           = useState<RecoVideo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<RecoTab>("para_voce");
  const [profileReady, setProfileReady] = useState(false);

  // Perfil de interesse: mapa categoria → peso (0-100)
  const [interestProfile, setInterestProfile] = useState<Record<string, number>>({});

  // ── Construir perfil de interesse ────────────
  const buildProfile = useCallback(async () => {
    const weights: Record<string, number> = {};

    // 1. Views desta sessão/user (peso base 3 por view)
    const viewsQuery = supabase
      .from("video_views")
      .select("category, watch_pct")
      .eq("session_id", sessionId)
      .not("category", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: views } = await viewsQuery;
    (views ?? []).forEach((v: any) => {
      const cat = (v.category as string).toLowerCase();
      const watchBonus = Math.floor((v.watch_pct ?? 0) / 20); // 0-5 bonus
      weights[cat] = (weights[cat] ?? 0) + 3 + watchBonus;
    });

    // 2. Para autenticados: likes (peso 8), dislikes (-4), subscriptions (peso 10)
    if (userId) {
      // Likes
      const { data: likes } = await supabase
        .from("interacoes")
        .select("video_id, tipo")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (likes && likes.length > 0) {
        const videoIds = (likes as any[]).map((l: any) => l.video_id);
        const { data: likedVideos } = await supabase
          .from("videos")
          .select("id, category")
          .in("id", videoIds);

        const likedMap = new Map((likes as any[]).map((l: any) => [l.video_id, l.tipo]));
        (likedVideos ?? []).forEach((v: any) => {
          if (!v.category) return;
          const cat = v.category.toLowerCase();
          const isLike = likedMap.get(v.id);
          weights[cat] = (weights[cat] ?? 0) + (isLike ? 8 : -4);
        });
      }

      // Subscriptions → categorias dos canais subscritos
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("creator_id")
        .eq("subscriber_id", userId)
        .limit(30);

      if (subs && subs.length > 0) {
        const creatorIds = (subs as any[]).map((s: any) => s.creator_id);
        const { data: creatorVids } = await supabase
          .from("videos")
          .select("category")
          .in("user_id", creatorIds)
          .eq("status", "published")
          .limit(50);

        (creatorVids ?? []).forEach((v: any) => {
          if (!v.category) return;
          const cat = v.category.toLowerCase();
          weights[cat] = (weights[cat] ?? 0) + 5;
        });
      }

      // Comentários (peso 6)
      const { data: comments } = await supabase
        .from("comentarios")
        .select("video_id")
        .eq("user_id", userId)
        .limit(20);

      if (comments && comments.length > 0) {
        const cIds = (comments as any[]).map((c: any) => c.video_id);
        const { data: commentedVids } = await supabase
          .from("videos").select("category").in("id", cIds);
        (commentedVids ?? []).forEach((v: any) => {
          if (!v.category) return;
          const cat = v.category.toLowerCase();
          weights[cat] = (weights[cat] ?? 0) + 6;
        });
      }

      // Partilhas (peso 7)
      const { data: shares } = await supabase
        .from("partilhas")
        .select("video_id")
        .eq("user_id", userId)
        .limit(20);

      if (shares && shares.length > 0) {
        const sIds = (shares as any[]).map((s: any) => s.video_id);
        const { data: sharedVids } = await supabase
          .from("videos").select("category").in("id", sIds);
        (sharedVids ?? []).forEach((v: any) => {
          if (!v.category) return;
          const cat = v.category.toLowerCase();
          weights[cat] = (weights[cat] ?? 0) + 7;
        });
      }
    }

    // Normalizar: remover categorias com peso negativo, normalizar 0-100
    const positive = Object.fromEntries(
      Object.entries(weights).filter(([, v]) => v > 0)
    );
    const maxW = Math.max(...Object.values(positive), 1);
    const normalized = Object.fromEntries(
      Object.entries(positive).map(([k, v]) => [k, Math.round((v / maxW) * 100)])
    );

    setInterestProfile(normalized);
    setProfileReady(true);
    return normalized;
  }, [sessionId, userId]);

  // ── Fetch recomendações ───────────────────────
  const fetchRecommendations = useCallback(async (tab: RecoTab) => {
    setLoading(true);

    const profile = Object.keys(interestProfile).length > 0
      ? interestProfile
      : await buildProfile();

    const topCats = Object.entries(profile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat]) => cat);

    const hasProfile = topCats.length > 0;
    let candidateIds: string[] = [];
    let rawVideos: any[] = [];

    // ── Tab: subscricoes ──
    if (tab === "subscricoes" && userId) {
      const { data: subs } = await supabase
        .from("subscriptions").select("creator_id").eq("subscriber_id", userId).limit(30);
      const creatorIds = (subs ?? []).map((s: any) => s.creator_id);
      if (creatorIds.length > 0) {
        const { data } = await supabase
          .from("videos")
          .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
          .eq("status", "published").eq("visibility", "public")
          .in("user_id", creatorIds)
          .order("created_at", { ascending: false })
          .limit(40);
        rawVideos = data ?? [];
      }

    // ── Tab: tendencias ──
    } else if (tab === "tendencias") {
      const { data } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
        .eq("status", "published").eq("visibility", "public")
        .order("views", { ascending: false })
        .limit(40);
      rawVideos = data ?? [];

    // ── Tab: historico ──
    } else if (tab === "historico") {
      if (topCats.length > 0) {
        // Buscar vídeos das categorias mais vistas, em paralelo
        const results = await Promise.all(
          topCats.slice(0, 3).map((cat) =>
            supabase.from("videos")
              .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
              .eq("status", "published").eq("visibility", "public")
              .ilike("category", cat)
              .order("views", { ascending: false })
              .limit(15)
          )
        );
        rawVideos = results.flatMap((r) => r.data ?? []);
      } else {
        // Sem histórico — usar mais vistos como fallback
        const { data } = await supabase
          .from("videos")
          .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
          .eq("status", "published").eq("visibility", "public")
          .order("views", { ascending: false })
          .limit(40);
        rawVideos = data ?? [];
      }

    // ── Tab: para_voce (mix personalizado) ──
    } else {
      if (hasProfile) {
        // Buscar vídeos das top 3 categorias (garante variedade)
        const results = await Promise.all(
          topCats.slice(0, 3).map((cat) =>
            supabase.from("videos")
              .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
              .eq("status", "published").eq("visibility", "public")
              .ilike("category", cat)
              .order("views", { ascending: false })
              .limit(15)
          )
        );
        rawVideos = results.flatMap((r) => r.data ?? []);
        // Complementar com mais vistos gerais se < 20 resultados
        if (rawVideos.length < 20) {
          const existingIds = new Set(rawVideos.map((v) => v.id));
          const { data: extra } = await supabase
            .from("videos")
            .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
            .eq("status", "published").eq("visibility", "public")
            .order("views", { ascending: false })
            .limit(20);
          (extra ?? []).forEach((v) => { if (!existingIds.has(v.id)) rawVideos.push(v); });
        }
      } else {
        // Novo utilizador — mais vistos
        const { data } = await supabase
          .from("videos")
          .select("id, title, thumbnail_url, views, duration, created_at, category, user_id")
          .eq("status", "published").eq("visibility", "public")
          .order("views", { ascending: false })
          .limit(40);
        rawVideos = data ?? [];
      }
    }

    // Remover duplicados
    const seen = new Set<string>();
    rawVideos = rawVideos.filter((v) => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });

    // Enriquecer com likes, comentários e criador
    const enriched: RecoVideo[] = await Promise.all(
      rawVideos.slice(0, 32).map(async (v: any) => {
        const [lkRes, cmRes, profRes] = await Promise.all([
          supabase.from("interacoes").select("*", { count: "exact", head: true })
            .eq("video_id", v.id).eq("tipo", true),
          supabase.from("comentarios").select("*", { count: "exact", head: true })
            .eq("video_id", v.id),
          supabase.from("profiles_public").select("username, full_name, avatar_url")
            .eq("id", v.user_id).maybeSingle(),
        ]);
        const prof = profRes.data as any;
        const catKey = (v.category ?? "").toLowerCase();
        const relevance = profile[catKey] ?? (tab === "tendencias" ? 60 : 30);

        return {
          id:             v.id,
          title:          v.title,
          thumbnail_url:  v.thumbnail_url,
          views:          v.views ?? 0,
          duration:       v.duration ?? null,
          created_at:     v.created_at,
          category:       v.category,
          likes_count:    lkRes.count ?? 0,
          comments_count: cmRes.count ?? 0,
          creator_name:   prof?.full_name ?? prof?.username ?? null,
          creator_avatar: prof?.avatar_url ?? null,
          reason:         buildReason(v.category, relevance, tab),
          relevance,
        };
      })
    );

    // Ordenar por relevância desc
    enriched.sort((a, b) => b.relevance - a.relevance);

    setVideos(enriched);
    setLoading(false);
  }, [interestProfile, buildProfile, userId]);

  // ── Efeitos ───────────────────────────────────
  useEffect(() => {
    buildProfile();
  }, [buildProfile]);

  useEffect(() => {
    if (profileReady) fetchRecommendations(activeTab);
    // eslint-disable-next-line
  }, [profileReady, activeTab]);

  // ── Registar uma visualização ─────────────────
  const trackView = useCallback(async (videoId: string, category: string | null, watchPct = 0) => {
    await supabase.from("video_views").insert({
      video_id:   videoId,
      user_id:    userId ?? null,
      session_id: sessionId,
      category:   category ?? null,
      watch_pct:  watchPct,
    });
    // Atualizar perfil imediatamente para reflectir nova preferência
    buildProfile().then(() => fetchRecommendations(activeTab));
  }, [userId, sessionId, buildProfile, fetchRecommendations, activeTab]);

  // ── Registar pesquisa ─────────────────────────
  const trackSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;
    await supabase.from("search_history").insert({
      user_id:    userId ?? null,
      session_id: sessionId,
      term:       term.trim().toLowerCase(),
    });
  }, [userId, sessionId]);

  return {
    videos,
    loading,
    activeTab,
    setActiveTab,
    interestProfile,
    profileReady,
    trackView,
    trackSearch,
    refresh: () => fetchRecommendations(activeTab),
  };
}