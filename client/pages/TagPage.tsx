// src/pages/TagPage.tsx
// Página pública de tag — SEO programático
// Rota: /tag/:tag

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/lib/supabaseClient";
import { Play, Eye, Film, Loader2, Tag, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type TagVideo = {
  id: string;
  slug: string | null;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
};

function fmtDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

const RELATED_TAGS: Record<string, string[]> = {
  amador:        ["solo", "casal", "pt", "brasil"],
  profissional:  ["hd", "estudio", "grupo", "pov"],
  solo:          ["amador", "brinquedos", "mulher"],
  casal:         ["amador", "pov", "lesbica"],
  gay:           ["solo", "grupo", "bareback"],
  lesbica:       ["casal", "solo", "brinquedos"],
  bdsm:          ["fetiche", "dominacao", "hardcore"],
  fetiche:       ["bdsm", "pés", "meias"],
  vintage:       ["retro", "classic", "80s"],
  animacao:      ["hentai", "cartoon", "anime"],
  pov:           ["amador", "casal", "solo"],
  grupo:         ["profissional", "casal", "gangbang"],
  trans:         ["solo", "casal"],
  brasil:        ["amador", "pt", "latina"],
  portugal:      ["amador", "pt", "europa"],
};

function getRelatedTags(tag: string): string[] {
  const lower = tag.toLowerCase();
  return RELATED_TAGS[lower] ?? [];
}

export default function TagPage() {
  const { t } = useTranslation();
  const { tag } = useParams<{ tag: string }>();
  const [videos, setVideos] = useState<TagVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const tagDisplay = tag ? decodeURIComponent(tag) : "";
  const relatedTags = useMemo(() => getRelatedTags(tagDisplay), [tagDisplay]);

  useDocumentTitle({
    title: `Vídeos ${tagDisplay} — Grátis no SuckOrSex`,
    description: `Assiste aos melhores vídeos ${tagDisplay} grátis. Conteúdo actualizado diariamente no SuckOrSex.`,
  });

  useEffect(() => {
    if (!tag) return;
    setLoading(true);

    const decoded = decodeURIComponent(tag);
    supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url, views, duration, created_at")
      .ilike("category", `%${decoded}%`)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("views", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setVideos((data ?? []) as TagVideo[]);
        setLoading(false);
      });
  }, [tag]);

  useEffect(() => {
    if (videos.length === 0) return;
    const tagDisplay = tag ? decodeURIComponent(tag) : "";
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "tag-itemlist-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Vídeos ${tagDisplay} — SuckOrSex`,
      "description": `Os melhores vídeos ${tagDisplay} grátis no SuckOrSex`,
      "url": `https://suckorsex.com/tag/${tag}`,
      "numberOfItems": videos.length,
      "itemListElement": videos.slice(0, 20).map((v, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://suckorsex.com/video/${v.slug || v.id}`,
        "name": v.title ?? "",
      })),
    });
    document.head.appendChild(script);
    return () => { document.getElementById("tag-itemlist-schema")?.remove(); };
  }, [videos, tag]);

  return (
    <Layout>
      <div className="max-container safe-area py-8 space-y-8">

        {/* Hero da tag */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-pink/10 via-neon-purple/7 to-neon-blue/5 border border-neon-pink/16 p-7">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-neon-pink/7 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-neon-purple/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-pink/25 to-neon-purple/20 border border-neon-pink/25 flex items-center justify-center flex-shrink-0">
              <Tag size={20} className="text-neon-pink" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white capitalize">
                {tagDisplay}
              </h1>
              <p className="text-foreground/45 text-sm mt-0.5">
                {loading ? "…" : `${fmtNum(videos.length)} vídeos`} · Actualizado diariamente
              </p>
            </div>
          </div>
        </div>

        {/* Tags relacionadas */}
        {relatedTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-foreground/35 mr-1">Relacionadas:</span>
            {relatedTags.map((rt) => (
              <Link
                key={rt}
                to={`/tag/${encodeURIComponent(rt)}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-foreground/50 text-xs font-medium hover:border-neon-pink/30 hover:text-neon-pink hover:bg-neon-pink/5 transition-all"
              >
                <Tag size={9} /> {rt}
              </Link>
            ))}
          </div>
        )}

        {/* Grelha de vídeos */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-neon-pink/50" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Film size={28} className="text-foreground/18" />
            </div>
            <div className="text-center">
              <p className="text-foreground/60 font-semibold">Nenhum vídeo encontrado</p>
              <p className="text-foreground/30 text-sm mt-1">
                Sem resultados para "{tagDisplay}"
              </p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-neon-pink hover:text-neon-pink/80 transition-colors"
            >
              Explorar todos os vídeos <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {videos.map((v) => (
              <Link
                key={v.id}
                to={`/video/${v.slug || v.id}`}
                className="group block"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-2">
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt={v.title ?? ""}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Film size={22} className="text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-neon-pink scale-0 group-hover:scale-100 transition-transform duration-300 flex items-center justify-center shadow-lg shadow-neon-pink/40">
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {v.duration && (
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono rounded">
                      {fmtDuration(v.duration)}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
                  {v.title || "Sem título"}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-foreground/32 pt-0.5">
                  <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(v.views)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA para explorar mais */}
        {!loading && videos.length > 0 && (
          <div className="text-center py-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground/55 text-sm font-semibold hover:bg-white/8 hover:border-white/16 hover:text-foreground transition-all"
            >
              Explorar todos os vídeos <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
