// api/tag-seo.ts
// Serverless function: prerender SEO para páginas /tag/:slug
// Injeta H1, lista de vídeos e JSON-LD ItemList no index.html para Googlebot.
// O React hidrata normalmente no cliente — sem alteração à SPA.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const DOMAIN    = "https://suckorsex.com";
const SITE_NAME = "SuckOrSex";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let indexHtmlCache: string | null = null;

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

async function serveFallback(res: VercelResponse): Promise<void> {
  try {
    const html = await fetchIndexHtml();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  } catch {
    res.setHeader("Location", DOMAIN);
    res.status(302).send("");
  }
}

type VideoRow = {
  id:            string;
  slug:          string | null;
  title:         string | null;
  thumbnail_url: string | null;
  tags:          string[] | null;
};

async function buildEnrichedHtml(tag: string, videos: VideoRow[]): Promise<string> {
  const base = await fetchIndexHtml();

  const pageTitle = `Vídeos ${tag} Grátis — ${SITE_NAME}`;
  const metaDesc  = `Assiste aos melhores vídeos ${tag} grátis em HD. Conteúdo exclusivo actualizado diariamente no ${SITE_NAME}.`;
  const canonical = `${DOMAIN}/tag/${encodeURIComponent(tag)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Vídeos ${tag} — ${SITE_NAME}`,
    url: canonical,
    numberOfItems: videos.length,
    itemListElement: videos.slice(0, 20).map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${DOMAIN}/video/${v.slug || v.id}`,
      name: v.title ?? "",
    })),
  };

  // Tags relacionadas derivadas dos vídeos encontrados
  const relatedCounts = new Map<string, number>();
  videos.forEach((v) => {
    (v.tags ?? []).forEach((t) => {
      if (t.toLowerCase() !== tag.toLowerCase()) {
        relatedCounts.set(t, (relatedCounts.get(t) ?? 0) + 1);
      }
    });
  });
  const relatedTags = Array.from(relatedCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t);

  const headBlock = `
  <!-- tag-seo prerender -->
  <link rel="canonical"           href="${esc(canonical)}" />
  <meta property="og:type"        content="website" />
  <meta property="og:title"       content="${esc(pageTitle)}" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:url"         content="${esc(canonical)}" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  const videoLinks = videos
    .slice(0, 30)
    .map((v) => `<li><a href="/video/${esc(v.slug || v.id)}">${esc(v.title ?? "Vídeo")}</a></li>`)
    .join("");

  const relatedNav = relatedTags.length > 0
    ? `<nav aria-label="tags relacionadas">${relatedTags.map((t) => `<a href="/tag/${encodeURIComponent(t)}">${esc(t)}</a>`).join(" ")}</nav>`
    : "";

  const botContent = `<main>
  <h1>Vídeos ${esc(tag)} — ${SITE_NAME}</h1>
  <p>${esc(metaDesc)}</p>
  <ul>${videoLinks}</ul>
  ${relatedNav}
</main>`;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { tag } = req.query;
    const tagParam = Array.isArray(tag) ? tag[0] : (tag ?? "");

    const supabaseUrl    = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!tagParam || !supabaseUrl || !serviceRoleKey) {
      return await serveFallback(res);
    }

    const decoded = decodeURIComponent(tagParam);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url, tags")
      .contains("tags", [decoded])
      .eq("status", "published")
      .eq("visibility", "public")
      .order("views", { ascending: false })
      .limit(48);

    if (error || !videos || videos.length === 0) {
      return await serveFallback(res);
    }

    const enrichedHtml = await buildEnrichedHtml(decoded, videos as VideoRow[]);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(enrichedHtml);

  } catch {
    return await serveFallback(res);
  }
}
