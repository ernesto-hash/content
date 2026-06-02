import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

  // Query directa — sem RPC que pode não existir ou ser lento
  const { data, error } = await supabase
    .from("videos")
    .select("tags")
    .eq("status", "published")
    .eq("visibility", "public")
    .not("tags", "is", null)
    .limit(5000);

  if (error) {
    res.status(500).send(`Supabase query failed: ${error.message}`);
    return;
  }

  // Deduplica tags no servidor
  const unique = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of (row.tags ?? []) as string[]) {
      if (tag && tag.trim()) unique.add(tag.trim());
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries = Array.from(unique)
    .sort()
    .map((tag) => {
      const loc = `https://suckorsex.com/tag/${escapeXml(encodeURIComponent(tag))}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(xml);
}
