import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).send(
      "Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title, thumbnail_url, created_at")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).send(`Supabase query failed: ${error.message}`);
    return;
  }

  const entries = (videos ?? [])
    .map((v) => {
      const loc = `https://suckorsex.com/video/${v.id}`;
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.status(200).send(xml);
}
