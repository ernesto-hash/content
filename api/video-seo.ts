// api/video-seo.ts
// Serverless function: injeta meta tags SEO + JSON-LD no index.html
// para páginas /video/:slug, permitindo que o Googlebot indexe conteúdo real.
// O React hidrata normalmente no cliente — sem alteração à SPA.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const DOMAIN         = "https://suckorsex.com";
const SITE_NAME      = "SuckOrSex";
const FALLBACK_THUMB = `${DOMAIN}/favicon.jpg`;

// ─── Tipos ────────────────────────────────────────────────────────────────────
type VideoRow = {
  id:            string;
  title:         string | null;
  description:   string | null;
  thumbnail_url: string | null;
  video_url:     string | null;
  duration:      number | null;
  created_at:    string;
  views:         number;
  slug:          string | null;
  user_id:       string;
};

// ─── Utilitários ──────────────────────────────────────────────────────────────
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPublicUrl(url: string | null | undefined): url is string {
  return (
    typeof url === "string" &&
    url.startsWith("https://") &&
    !url.includes("?token=")  // rejeita signed URLs expiráveis do Supabase Storage
  );
}

function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `PT${m}M${s}S`;
}

// Cache do index.html obtido do CDN (por instância Lambda — invalidado a cada deploy)
let indexHtmlCache: string | null = null;

// Obtém o index.html do CDN próprio, com cache por instância Lambda.
// Lança se o CDN não responder — o try/catch do handler apanha e faz 302.
async function fetchIndexHtml(): Promise<string> {
  if (indexHtmlCache) return indexHtmlCache;
  const r = await fetch(`${DOMAIN}/index.html`, {
    signal: AbortSignal.timeout(4000),
    headers: { "User-Agent": "SuckOrSex-SEO/1.0" },
  });
  if (!r.ok) throw new Error(`CDN index.html devolveu HTTP ${r.status}`);
  indexHtmlCache = await r.text();
  return indexHtmlCache;
}

// ─── [A] Fallback: devolve o index.html do CDN sem enriquecimento ────────────
// Chamado em QUALQUER erro. O utilizador nunca vê uma página sem scripts.
async function serveFallback(res: VercelResponse): Promise<void> {
  try {
    const html = await fetchIndexHtml();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  } catch {
    // CDN também inacessível (site em baixo, DNS, timeout) — último recurso
    res.setHeader("Location", DOMAIN);
    res.status(302).send("");
  }
}

// ─── Constrói o HTML enriquecido (caminho feliz) ──────────────────────────────
// Obtém o index.html do CDN (com cache) e injeta title, meta tags e JSON-LD.
// Os <script> e <link> do React já estão no HTML do CDN — a injeção apenas
// acrescenta tags antes de </head> e conteúdo dentro de #root.
async function buildEnrichedHtml(
  video:       VideoRow,
  slug:        string,
  creatorName: string | null,
): Promise<string> {
  const base = await fetchIndexHtml();

  const title       = (video.title ?? "").trim() || "Vídeo";
  const rawDesc     = (video.description ?? "").trim();
  const description = rawDesc
    || `Assiste a "${title}" em HD no ${SITE_NAME}. Novo conteúdo adulto todos os dias.`;
  const metaDesc    = description.length > 155 ? description.slice(0, 152) + "..." : description;
  const pageTitle   = `${title} — ${SITE_NAME}`;
  const canonical   = `${DOMAIN}/video/${slug}`;
  const thumbUrl    = isPublicUrl(video.thumbnail_url) ? video.thumbnail_url : FALLBACK_THUMB;

  // JSON-LD VideoObject
  const jsonLd: Record<string, unknown> = {
    "@context":   "https://schema.org",
    "@type":      "VideoObject",
    name:          title,
    description:   description.slice(0, 300),
    thumbnailUrl:  thumbUrl,
    uploadDate:    video.created_at.slice(0, 10),
    publisher:     { "@type": "Organization", name: SITE_NAME, url: DOMAIN },
  };
  if (isPublicUrl(video.video_url)) jsonLd.contentUrl = video.video_url;
  if (video.duration) jsonLd.duration = isoDuration(video.duration);
  if (video.views)    jsonLd.interactionStatistic = {
    "@type":              "InteractionCounter",
    interactionType:      { "@type": "WatchAction" },
    userInteractionCount: video.views,
  };
  if (creatorName) jsonLd.author = { "@type": "Person", name: creatorName };

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

  const creatorLine = creatorName
    ? `\n    <p>Por <span itemprop="author">${esc(creatorName)}</span></p>`
    : "";
  const botContent = `<article itemscope itemtype="https://schema.org/VideoObject">
    <h1 itemprop="name">${esc(title)}</h1>
    <p itemprop="description">${esc(metaDesc)}</p>${creatorLine}
  </article>`;

  let html = base;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(pageTitle)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(metaDesc)}" />`,
  );
  html = html.replace("</head>", `${headBlock}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${botContent}</div>`);

  return html;
}

// ─── [B] Handler principal — TODO dentro de um único try/catch ───────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { slug } = req.query;
    const slugParam = Array.isArray(slug) ? slug[0] : (slug ?? "");

    const supabaseUrl    = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!slugParam || !supabaseUrl || !serviceRoleKey) {
      return await serveFallback(res);
    }

    // createClient está dentro do try/catch — se lançar, vai para serveFallback
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // [C] Query sem profiles!user_id — apenas colunas escalares
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select(
        "id, title, description, thumbnail_url, video_url, duration, created_at, views, slug, user_id",
      )
      .eq("slug", slugParam)
      .eq("status", "published")
      .eq("visibility", "public")
      .single();

    if (videoError || !video) {
      // Slug inválido ou vídeo privado — SPA trata o 404 no cliente
      return await serveFallback(res);
    }

    // [C] Query separada ao criador — igual a Video.tsx linha 520
    // Erro ignorado intencionalmente: autor é campo opcional no JSON-LD
    let creatorName: string | null = null;
    if (video.user_id) {
      const { data: profile } = await supabase
        .from("profiles_public")
        .select("full_name, username")
        .eq("id", video.user_id)
        .single();
      creatorName = profile?.full_name || profile?.username || null;
    }

    const enrichedHtml = await buildEnrichedHtml(video as VideoRow, slugParam, creatorName);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(enrichedHtml);

  } catch {
    // Apanha TUDO o que não foi tratado acima:
    // createClient, readFileSync (ENOENT), qualquer await que lance,
    // erros de string replace, etc.
    // O utilizador recebe SEMPRE a página real do CDN.
    return await serveFallback(res);
  }
}
