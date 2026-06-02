import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[sitemaps] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta — a saltar geração de sitemaps.");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);

  // ── sitemap-shorts.xml ──────────────────────────────────────────────────────
  console.log("[sitemaps] A gerar sitemap-shorts.xml...");
  const { data: shorts, error: shortsErr } = await supabase
    .from("videos")
    .select("slug, updated_at")
    .eq("is_short", true)
    .eq("status", "published")
    .eq("visibility", "public")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (shortsErr) {
    console.error("[sitemaps] Erro shorts:", shortsErr.message);
  } else {
    const entries = (shorts ?? [])
      .map((v) => {
        const loc = `https://suckorsex.com/short/${escapeXml(v.slug)}`;
        const lastmod = v.updated_at ? v.updated_at.slice(0, 10) : today;
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
    writeFileSync(join(publicDir, "sitemap-shorts.xml"), xml, "utf-8");
    console.log(`[sitemaps] sitemap-shorts.xml gerado — ${shorts?.length ?? 0} URLs`);
  }

  // ── sitemap-tags.xml ────────────────────────────────────────────────────────
  console.log("[sitemaps] A gerar sitemap-tags.xml...");
  const { data: tagRows, error: tagsErr } = await supabase
    .from("videos")
    .select("tags")
    .eq("status", "published")
    .eq("visibility", "public")
    .not("tags", "is", null)
    .limit(5000);

  if (tagsErr) {
    console.error("[sitemaps] Erro tags:", tagsErr.message);
  } else {
    const unique = new Set<string>();
    for (const row of tagRows ?? []) {
      for (const tag of (row.tags ?? []) as string[]) {
        if (tag?.trim()) unique.add(tag.trim());
      }
    }

    const entries = Array.from(unique)
      .sort()
      .map((tag) => {
        const loc = `https://suckorsex.com/tag/${escapeXml(encodeURIComponent(tag))}`;
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
    writeFileSync(join(publicDir, "sitemap-tags.xml"), xml, "utf-8");
    console.log(`[sitemaps] sitemap-tags.xml gerado — ${unique.size} tags únicas`);
  }
}

main().catch((err) => {
  // Não quebrar o build por falha de sitemap
  console.error("[sitemaps] Erro (build continua):", err);
});
