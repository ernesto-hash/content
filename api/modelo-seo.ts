// api/modelo-seo.ts
// Serverless function: injeta meta tags SEO + JSON-LD no index.html
// para páginas /modelo/:slug (perfil de modelo/criador).
// O React hidrata normalmente no cliente — sem alteração à SPA.
// Clone robusto de video-seo.ts: usa a view profiles_public,
// resolve por UUID OU username, JSON-LD ProfilePage + Person,
// canonical sempre no username.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const DOMAIN         = "https://suckorsex.com";
const SITE_NAME      = "SuckOrSex";
const FALLBACK_THUMB = `${DOMAIN}/favicon.jpg`;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Colunas confirmadas da view profiles_public (ver CanalPage.tsx).
type ProfileRow = {
  id:          string;
  username:    string | null;
  full_name:   string | null;
  avatar_url:  string | null;
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
    !url.includes("?token=")
  );
}

// Cache do index.html obtido do CDN (por instância Lambda)
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

// ─── [A] Fallback ─────────────────────────────────────────────────────────────
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

// ─── HTML enriquecido ─────────────────────────────────────────────────────────
async function buildEnrichedHtml(profile: ProfileRow): Promise<string> {
  const base = await fetchIndexHtml();

  const name        = (profile.full_name ?? "").trim()
                      || (profile.username ?? "").trim()
                      || "Modelo";
  const usernameForUrl = (profile.username ?? profile.id).trim();
  const description = `Vê todos os vídeos de ${name} em HD no ${SITE_NAME}. Conteúdo exclusivo e atualizado.`;
  const metaDesc    = description.length > 155 ? description.slice(0, 152) + "..." : description;
  const pageTitle   = `${name} — ${SITE_NAME}`;
  // Canonical sempre no username (não no UUID)
  const canonical   = `${DOMAIN}/modelo/${usernameForUrl}`;
  const imageUrl    = isPublicUrl(profile.avatar_url) ? profile.avatar_url : FALLBACK_THUMB;

  // JSON-LD ProfilePage + Person
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":    "ProfilePage",
    mainEntity: {
      "@type":      "Person",
      name:          name,
      url:           canonical,
      image:         imageUrl,
    },
  };

  const headBlock = `
  <!-- modelo-seo prerender -->
  <link rel="canonical"           href="${esc(canonical)}" />
  <meta property="og:type"        content="profile" />
  <meta property="og:title"       content="${esc(pageTitle)}" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:url"         content="${esc(canonical)}" />
  <meta property="og:image"       content="${esc(imageUrl)}" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(pageTitle)}" />
  <meta name="twitter:description" content="${esc(metaDesc)}" />
  <meta name="twitter:image"       content="${esc(imageUrl)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  const botContent = `<article itemscope itemtype="https://schema.org/Person">
    <h1 itemprop="name">${esc(name)}</h1>
    <p itemprop="description">${esc(metaDesc)}</p>
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

// ─── [B] Handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { slug } = req.query;
    const slugParam = Array.isArray(slug) ? slug[0] : (slug ?? "");

    const supabaseUrl    = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!slugParam || !supabaseUrl || !serviceRoleKey) {
      return await serveFallback(res);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Resolve por UUID ou por username (igual ao CanalPage.tsx)
    const column = UUID_RE.test(slugParam) ? "id" : "username";

    const { data: profile, error: profileError } = await supabase
      .from("profiles_public")
      .select("id, username, full_name, avatar_url")
      .eq(column, slugParam)
      .single();

    if (profileError || !profile) {
      return await serveFallback(res);
    }

    const enrichedHtml = await buildEnrichedHtml(profile as ProfileRow);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(enrichedHtml);

  } catch {
    return await serveFallback(res);
  }
}