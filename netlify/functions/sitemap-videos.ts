import { createClient } from "@supabase/supabase-js";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toYMD(iso: string): string {
  return iso.slice(0, 10);
}

export const handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 500,
      body: "Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const [videosRes, profilesRes] = await Promise.all([
    supabase
      .from("videos")
      .select("id, slug, title, thumbnail_url, created_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, slug, updated_at")
      .not("username", "is", null)
      .not("full_name", "is", null),
  ]);

  if (videosRes.error) {
    return {
      statusCode: 500,
      body: `Supabase videos query failed: ${videosRes.error.message}`,
    };
  }

  const videoEntries = (videosRes.data ?? [])
    .map((v) => {
      const slugOrId = v.slug || v.id;
      const loc = `https://suckorsex.com/video/${escapeXml(slugOrId)}`;
      const lastmod = toYMD(v.created_at);
      const title = escapeXml(v.title ?? "");
      const thumbnailLine = v.thumbnail_url
        ? `\n      <video:thumbnail_loc>${escapeXml(v.thumbnail_url)}</video:thumbnail_loc>`
        : "";
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <video:video>${thumbnailLine}
      <video:title>${title}</video:title>
      <video:content_loc>${loc}</video:content_loc>
    </video:video>
  </url>`;
    })
    .join("\n");

  const profileEntries = (profilesRes.data ?? [])
    .map((p) => {
      const slugOrId = p.slug || p.id;
      const loc = `https://suckorsex.com/modelo/${escapeXml(slugOrId)}`;
      const lastmod = p.updated_at ? toYMD(p.updated_at) : new Date().toISOString().slice(0, 10);
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("\n");

  const allEntries = [videoEntries, profileEntries].filter(Boolean).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allEntries}
</urlset>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: xml,
  };
};
