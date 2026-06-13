// api/video-seo.ts
// Serverless function: injeta meta tags SEO + JSON-LD no index.html
// para páginas /video/:slug, permitindo que o Googlebot indexe conteúdo real.
// O React hidrata normalmente no cliente — sem alteração à SPA.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const DOMAIN    = "https://suckorsex.com";
const SITE_NAME = "SuckOrSex";
const FALLBACK_THUMB = `${DOMAIN}/favicon.jpg`;

// ─── Tipos ────────────────────────────────────────────────────────────────────
type VideoRow = {
  title:         string | null;
  description:   string | null;
  thumbnail_url: string | null;
  video_url:     string | null;
  duration:      number | null;
  created_at:    string;
  views:         number;
  slug:          string | null;
  profiles:      { full_name: string | null; username: string | null } | null;
};

// ─── Utilitários ──────────────────────────────────────────────────────────────
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidThumbnail(url: string | null | undefined): url is string {
  return (
    typeof url === "string" &&
    url.startsWith("https://") &&
    !url.includes("?token=")   // rejeita signed URLs expiráveis do Supabase Storage
  );
}

function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `PT${m}M${s}S`;
}

// ─── index.html cacheado por instância Lambda ──────────────────────────────
let cachedIndex: string | null = null;

function getIndexHtml(): string {
  if (cachedIndex) return cachedIndex;
  // dist/index.html é incluído na Lambda via "includeFiles" em vercel.json
  cachedIndex = readFileSync(join(process.cwd(), "dist", "index.html"), "utf-8");
  return cachedIndex;
}

// ─── Fallback: serve o index.html original sem enriquecimento ─────────────
function serveFallback(res: VercelResponse): void {
  try {
    const html = getIndexHtml();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  } catch {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(
      '<!doctype html><html lang="pt"><body><div id="root"></div></body></html>'
    );
  }
}

// ─── Construção do HTML enriquecido ──────────────────────────────────────────
function buildEnrichedHtml(video: VideoRow, slug: string): string {
  const base = getIndexHtml();

  const title       = (video.title ?? "").trim() || "Vídeo";
  const rawDesc     = (video.description ?? "").trim();
  const description = rawDesc || `Assiste a "${title}" em HD no ${SITE_NAME}. Novo conteúdo adulto todos os dias.`;
  const metaDesc    = description.length > 155 ? description.slice(0, 152) + "..." : description;
  const pageTitle   = `${title} — ${SITE_NAME}`;
  const canonical   = `${DOMAIN}/video/${slug}`;
  const thumbUrl    = isValidThumbnail(video.thumbnail_url) ? video.thumbnail_url : FALLBACK_THUMB;
  const creator     = video.profiles?.full_name || video.profiles?.username || null;

  // JSON-LD VideoObject — <script type="application/ld+json"> está fora
  // do âmbito do CSP script-src por spec (não é JavaScript executável)
  const jsonLd: Record<string, unknown> = {
    "@context":  "https://schema.org",
    "@type":     "VideoObject",
    name:         title,
    description:  description.slice(0, 300),
    thumbnailUrl: thumbUrl,
    uploadDate:   video.created_at.slice(0, 10),
    publisher:    { "@type": "Organization", name: SITE_NAME, url: DOMAIN },
  };
  if (video.video_url?.startsWith("https://")) jsonLd.contentUrl = video.video_url;
  if (video.duration) jsonLd.duration = isoDuration(video.duration);
  if (video.views)    jsonLd.interactionStatistic = {
    "@type":              "InteractionCounter",
    interactionType:      { "@type": "WatchAction" },
    userInteractionCount: video.views,
  };
  if (creator) jsonLd.author = { "@type": "Person", name: creator };

  // Bloco de tags a injetar antes de </head>
  const headBlock = `
  <!-- video-seo prerender -->
  <link rel="canonical"           href="${esc(canonical)}" />
  <meta property="og:type"        content="video.other" />
  <meta property="og:title"       content="${esc(pageTitle)}" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:url"         content="${esc(canonical)}" />
  <meta property="og:image"       content="${esc(thumbUrl)}" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(pageTitle)}" />
  <meta name="twitter:description" content="${esc(metaDesc)}" />
  <meta name="twitter:image"       content="${esc(thumbUrl)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  // Conteúdo semântico dentro de #root para o crawler.
  // O React substitui tudo em #root ao montar — utilizadores humanos nunca vêem isto.
  const creatorLine = creator
    ? `\n    <p>Por <span itemprop="author">${esc(creator)}</span></p>`
    : "";
  const botContent = `<article itemscope itemtype="https://schema.org/VideoObject">
    <h1 itemprop="name">${esc(title)}</h1>
    <p itemprop="description">${esc(metaDesc)}</p>${creatorLine}
  </article>`;

  let html = base;

  // 1. Substituir <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${esc(pageTitle)}</title>`
  );

  // 2. Substituir meta description (regex tolera variações de espaços)
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(metaDesc)}" />`
  );

  // 3. Injetar OG + JSON-LD antes de </head>
  html = html.replace("</head>", `${headBlock}\n  </head>`);

  // 4. Enriquecer #root com conteúdo para o crawler
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${botContent}</div>`
  );

  return html;
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  const slugParam = Array.isArray(slug) ? slug[0] : (slug ?? "");

  const supabaseUrl    = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!slugParam || !supabaseUrl || !serviceRoleKey) {
    return serveFallback(res);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: video, error } = await supabase
    .from("videos")
    .select(
      "title, description, thumbnail_url, video_url, duration, created_at, views, slug, profiles!user_id(full_name, username)"
    )
    .eq("slug", slugParam)
    .eq("status", "published")
    .eq("visibility", "public")
    .single<VideoRow>();

  if (error || !video) {
    // Slug desconhecido ou vídeo privado → React trata o 404 no cliente
    return serveFallback(res);
  }

  try {
    const enrichedHtml = buildEnrichedHtml(video, slugParam);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(enrichedHtml);
  } catch {
    return serveFallback(res);
  }
}
