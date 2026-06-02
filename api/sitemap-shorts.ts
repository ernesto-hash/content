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
    res.status(500).send("Missing environment variables.");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("videos")
    .select("slug, updated_at, title")
    .eq("is_short", true)
    .eq("status", "published")
    .eq("visibility", "public")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    res.status(500).send(`Supabase query failed: ${error.message}`);
    return;
  }

  const entries = (data ?? [])
    .map((v) => {
      const loc = `https://suckorsex.com/short/${escapeXml(v.slug)}`;
      const lastmod = v.updated_at ? toYMD(v.updated_at) : new Date().toISOString().slice(0, 10);
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(200).send(xml);
}
