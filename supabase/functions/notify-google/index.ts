import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITEMAPS = [
  "https://suckorsex.com/sitemap-videos.xml",
  "https://suckorsex.com/sitemap-tags.xml",
  "https://suckorsex.com/sitemap-shorts.xml",
];

serve(async (req) => {
  try {
    const body = await req.json();
    const record = body.record;

    if (record?.status === "published" && record?.slug) {
      await Promise.all([
        ...SITEMAPS.map((s) => fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(s)}`)),
        fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAPS[0])}`),
      ]);
      console.log(`Notificado Google + Bing: ${record.slug}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});
