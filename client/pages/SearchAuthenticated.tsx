import { memo, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Search, Film, Users, Eye, User, Play } from "lucide-react";

type VideoResult = {
  id: string;
  slug: string | null;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  user_id: string;
};

type ModelResult = {
  id: string;
  slug: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

function fmtViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

function fmtDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const VideoCard = memo(function VideoCard({ v, basePath }: { v: VideoResult; basePath: string }) {
  const path = `${basePath}/${v.slug || v.id}`;
  return (
    <Link to={path} className="group block">
      <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/8 aspect-video mb-2">
        {v.thumbnail_url ? (
          <img src={v.thumbnail_url} alt={v.title ?? ""} loading="lazy" width={320} height={180} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={28} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-neon-pink/80 flex items-center justify-center">
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
        {v.duration && (
          <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded">
            {fmtDuration(v.duration)}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/85 line-clamp-2 leading-snug group-hover:text-neon-pink transition-colors">
        {v.title}
      </p>
      <p className="text-[11px] text-foreground/40 mt-0.5 flex items-center gap-1">
        <Eye size={10} /> {fmtViews(v.views)} views
      </p>
    </Link>
  );
});

const ModelCard = memo(function ModelCard({ m, basePath }: { m: ModelResult; basePath: string }) {
  const path = `${basePath}/${m.slug || m.id}`;
  return (
    <Link to={path} className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-neon-pink/30 hover:bg-white/6 transition-all">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-neon-pink/20 to-neon-purple/10 flex items-center justify-center border-2 border-white/15 group-hover:border-neon-pink/50 transition-colors">
        {m.avatar_url ? (
          <img src={m.avatar_url} alt="" loading="lazy" width={64} height={64} className="w-full h-full object-cover" />
        ) : (
          <User size={22} className="text-white/30" />
        )}
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-semibold text-foreground/85 truncate group-hover:text-neon-pink transition-colors">
          {m.full_name || m.username}
        </p>
        <p className="text-[11px] text-foreground/40">@{m.username}</p>
      </div>
    </Link>
  );
});

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video rounded-xl bg-white/8 mb-2" />
          <div className="h-3 bg-white/8 rounded w-3/4 mb-1" />
          <div className="h-2.5 bg-white/5 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

type Tab = "tudo" | "videos" | "modelos";

export default function SearchAuthenticated() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [tab, setTab] = useState<Tab>("tudo");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [tagVideos, setTagVideos] = useState<VideoResult[]>([]);
  const [models, setModels] = useState<ModelResult[]>([]);
  const [loading, setLoading] = useState(false);

  useDocumentTitle({ title: query ? `"${query}" — Pesquisa | SuckOrSex` : "Pesquisa | SuckOrSex" });

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    setVideos([]);
    setModels([]);
    setTagVideos([]);

    const term = query.trim();

    Promise.all([
      supabase
        .from("videos")
        .select("id,slug,title,thumbnail_url,views,duration,created_at,user_id")
        .eq("status", "published")
        .eq("visibility", "public")
        .ilike("title", `%${term}%`)
        .order("views", { ascending: false })
        .limit(24),
      supabase
        .from("profiles_public")
        .select("id,slug,username,full_name,avatar_url")
        .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(8),
      supabase
        .from("videos")
        .select("id,slug,title,thumbnail_url,views,duration,created_at,user_id")
        .eq("status", "published")
        .eq("visibility", "public")
        .ilike("tags::text", `%${term}%`)
        .order("views", { ascending: false })
        .limit(12),
    ]).then(([vRes, mRes, tRes]) => {
      setVideos((vRes.data ?? []) as VideoResult[]);
      setModels((mRes.data ?? []) as ModelResult[]);
      setTagVideos((tRes.data ?? []) as VideoResult[]);
      setLoading(false);
    });
  }, [query]);

  const allVideos = [
    ...videos,
    ...tagVideos.filter(tv => !videos.some(v => v.id === tv.id)),
  ];

  const noResults = !loading && query.trim() && allVideos.length === 0 && models.length === 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "tudo",    label: t("search.tabs.all",    "Tudo") },
    { key: "videos",  label: t("search.tabs.videos", "Vídeos") },
    { key: "modelos", label: t("search.tabs.models", "Modelos") },
  ];

  return (
    <LayoutAuthenticated>
      <div className="max-container safe-area py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Search size={18} className="text-neon-pink" />
            <h1 className="text-xl font-bold text-foreground">
              {query
                ? <>{t("search.resultsFor", "Resultados para")} <span className="text-neon-pink">"{query}"</span></>
                : t("search.title", "Pesquisa")}
            </h1>
          </div>
          {!loading && query && (
            <p className="text-sm text-foreground/45 ml-6">
              {allVideos.length} {t("search.videos", "vídeos")} · {models.length} {t("search.models", "modelos")}
            </p>
          )}
        </div>

        {/* Tabs */}
        {query && (
          <div className="flex gap-1 mb-6 border-b border-white/10">
            {tabs.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === tb.key
                    ? "text-neon-pink border-neon-pink"
                    : "text-foreground/55 border-transparent hover:text-foreground/80"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-8">
            {(tab === "tudo" || tab === "modelos") && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5">
                    <div className="w-16 h-16 rounded-full bg-white/10" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}
            {(tab === "tudo" || tab === "videos") && <SkeletonGrid count={8} />}
          </div>
        )}

        {/* Empty state */}
        {noResults && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <Search size={48} className="text-white/10" />
            <p className="text-foreground/50 text-lg font-semibold">
              {t("search.noResults", "Sem resultados para")} "{query}"
            </p>
            <p className="text-foreground/35 text-sm">
              {t("search.tryOther", "Tenta um termo diferente ou navega pelas categorias.")}
            </p>
            <Link to="/videosauthenticated" className="mt-2 text-neon-pink text-sm hover:underline">
              {t("search.browseAll", "Ver todos os vídeos")}
            </Link>
          </div>
        )}

        {/* Empty query */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <Search size={48} className="text-white/10" />
            <p className="text-foreground/40">{t("search.emptyQuery", "Escreve algo para pesquisar.")}</p>
          </div>
        )}

        {/* Results */}
        {!loading && query && (
          <div className="space-y-10">

            {/* Modelos */}
            {(tab === "tudo" || tab === "modelos") && models.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users size={15} className="text-neon-purple" />
                  <h2 className="text-base font-bold text-foreground">{t("search.sections.models", "Modelos")}</h2>
                  <span className="text-xs text-foreground/35">({models.length})</span>
                </div>
                <div className={`grid gap-3 ${tab === "modelos" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"}`}>
                  {models.map(m => (
                    <ModelCard key={m.id} m={m} basePath="/app/modelo" />
                  ))}
                </div>
              </section>
            )}

            {/* Vídeos */}
            {(tab === "tudo" || tab === "videos") && allVideos.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Film size={15} className="text-neon-pink" />
                  <h2 className="text-base font-bold text-foreground">{t("search.sections.videos", "Vídeos")}</h2>
                  <span className="text-xs text-foreground/35">({allVideos.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {allVideos.map(v => (
                    <VideoCard key={v.id} v={v} basePath="/app/video" />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </LayoutAuthenticated>
  );
}
