import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const SITE_URL = "https://suckorsex.com";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sendTelegram(message: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    })
  });
}

async function checkUptime() {
  const start = Date.now();
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(5000) });
    const ms = Date.now() - start;
    if (!res.ok) {
      await sendTelegram(`⛔ SITE COM ERRO\nStatus: ${res.status}\nTempo: ${ms}ms`);
    } else if (ms > 3000) {
      await sendTelegram(`⚠️ SITE LENTO\nTempo de resposta: ${ms}ms`);
    }
  } catch {
    await sendTelegram(`🔴 SITE OFFLINE\nhttps://suckorsex.com não responde`);
  }
}

async function checkSitemaps() {
  const sitemaps = [
    "sitemap-videos.xml",
    "sitemap-tags.xml",
    "sitemap-shorts.xml",
    "sitemap-index.xml"
  ];
  for (const sitemap of sitemaps) {
    try {
      const res = await fetch(`${SITE_URL}/${sitemap}`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        await sendTelegram(`⚠️ SITEMAP COM ERRO\n${sitemap}\nStatus: ${res.status}`);
      }
    } catch {
      await sendTelegram(`⛔ SITEMAP INACESSÍVEL\n${sitemap}`);
    }
  }
}

async function checkContent() {
  const { count: semSlug } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("slug.is.null,slug.eq.");

  const { count: semTags } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("tags.is.null,tags.eq.{}");

  const { count: semDesc } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("description.is.null,description.eq.");

  if (semSlug && semSlug > 0)
    await sendTelegram(`⚠️ VÍDEOS SEM SLUG\n${semSlug} vídeos sem slug detectados`);

  if (semTags && semTags > 0)
    await sendTelegram(`⚠️ VÍDEOS SEM TAGS\n${semTags} vídeos sem tags`);

  if (semDesc && semDesc > 0)
    await sendTelegram(`⚠️ VÍDEOS SEM DESCRIÇÃO\n${semDesc} vídeos sem descrição`);
}

async function dailyReport() {
  const { count: totalVideos } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: semSlug } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("slug.is.null,slug.eq.");

  const { count: semTags } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("tags.is.null,tags.eq.{}");

  const { count: semDesc } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("description.is.null,description.eq.");

  const siteOk = await fetch(SITE_URL, { signal: AbortSignal.timeout(5000) })
    .then(r => r.ok)
    .catch(() => false);

  const report = `📊 RELATÓRIO DIÁRIO — SuckOrSex
Data: ${new Date().toLocaleDateString("pt-PT")}

🌐 Site: ${siteOk ? "✅ Online" : "🔴 OFFLINE"}
🎬 Total vídeos publicados: ${totalVideos || 0}
🔗 Vídeos sem slug: ${semSlug || 0}
🏷️ Vídeos sem tags: ${semTags || 0}
📝 Vídeos sem descrição: ${semDesc || 0}`;

  await sendTelegram(report);
}

function generateTagsForModel(title: string): string[] {
  const titleLower = title.toLowerCase();
  const baseTags = ["portuguese", "brazilian", "homemade", "amateur"];
  const modelTags: Record<string, string[]> = {
    "mc mirella": ["mc mirella", "mc mirela", "mirella", "funk", "brasileira", "brazilian"],
    "melissa tx": ["melissa tx", "melissa", "brasileira", "brazilian", "latina"],
    "bia trois": ["bia trois", "biatrois", "brasileira", "brazilian"],
    "sarah estanislau": ["sarah estanislau", "sarah", "estanislau", "brasileira"],
    "la camila cruzz": ["la camila cruzz", "camila cruzz", "latina", "brasileira"],
    "jade canhao": ["jade canhao", "jade", "brasileira", "brazilian"],
    "martina oliveira": ["martina oliveira", "martina", "brasileira"],
    "larissa sumpani": ["larissa sumpani", "larissa", "brasileira"],
    "ester muniz": ["ester muniz", "ester", "brasileira", "brazilian"],
    "karolrosalin": ["karolrosalin", "karol", "brasileira", "brazilian", "onlyfans"],
    "bufalika": ["bufalika", "latina", "busty latina", "big tits"],
    "gina wap": ["gina wap", "ebony", "black girl", "american ebony"],
    "lela sohna": ["lela sohna", "busty", "american", "big tits"],
    "alina rose": ["alina rose", "alinarose", "american", "onlyfans"],
    "mally lune": ["mally lune", "mallylune", "brasileira", "brazilian"],
  };
  for (const [model, tags] of Object.entries(modelTags)) {
    if (titleLower.includes(model)) {
      return [...new Set([...tags, ...baseTags])];
    }
  }
  return [...baseTags, "latina", "hot", "onlyfans"];
}

function generateDescriptionForModel(title: string): string {
  const titleLower = title.toLowerCase();
  const descriptions: Record<string, string> = {
    "mc mirella": "MC Mirella conteúdo exclusivo grátis no SuckOrSex. A rainha do funk brasileira em cenas únicas e exclusivas.",
    "melissa tx": "Melissa TX vídeos exclusivos grátis no SuckOrSex. Brasileira gostosa com conteúdo premium diário.",
    "bia trois": "Bia Trois conteúdo exclusivo grátis no SuckOrSex. Brasileira com vídeos únicos actualizados diariamente.",
    "sarah estanislau": "Sarah Estanislau vídeos exclusivos grátis no SuckOrSex. Conteúdo premium brasileiro actualizado diariamente.",
    "la camila cruzz": "La Camila Cruzz conteúdo exclusivo grátis no SuckOrSex. Latina gostosa com vídeos premium diários.",
    "jade canhao": "Jade Canhão vídeos exclusivos grátis no SuckOrSex. Brasileira com conteúdo único e exclusivo.",
    "martina oliveira": "Martina Oliveira conteúdo exclusivo grátis no SuckOrSex. Brasileira com vídeos premium actualizados.",
    "larissa sumpani": "Larissa Sumpani vídeos exclusivos grátis no SuckOrSex. Conteúdo premium brasileiro diário.",
    "ester muniz": "Ester Muniz conteúdo exclusivo grátis no SuckOrSex. Brasileira famosa com vídeos únicos.",
    "karolrosalin": "Karolrosalin conteúdo exclusivo grátis no SuckOrSex. Brasileira do OnlyFans com vídeos premium actualizados diariamente.",
    "bufalika": "Bufalika exclusive OnlyFans content free on SuckOrSex. Busty Latina with perfect curves updated daily.",
    "gina wap": "Gina WAP exclusive uncensored content free on SuckOrSex. American ebony model with premium videos daily.",
    "lela sohna": "Lela Sohna exclusive OnlyFans content free on SuckOrSex. Busty American with big tits updated daily.",
    "alina rose": "Alina Rose exclusive OnlyFans content free on SuckOrSex. American model with premium videos updated daily.",
    "mally lune": "Mally Lune conteúdo exclusivo grátis no SuckOrSex. Brasileira com vídeos premium actualizados diariamente.",
  };
  for (const [model, desc] of Object.entries(descriptions)) {
    if (titleLower.includes(model)) {
      return desc;
    }
  }
  return "Conteúdo adulto exclusivo grátis no SuckOrSex. Vídeos premium actualizados diariamente.";
}

async function autoFixContent() {
  let fixedTags = 0;
  let fixedDesc = 0;
  let fixedSlugs = 0;

  const { data: semTags } = await supabase
    .from("videos")
    .select("id, title")
    .or("tags.is.null,tags.eq.{}")
    .eq("status", "published")
    .eq("visibility", "public")
    .limit(50);

  for (const video of semTags || []) {
    const tags = generateTagsForModel(video.title);
    await supabase.from("videos").update({ tags }).eq("id", video.id);
    fixedTags++;
  }

  const { data: semDesc } = await supabase
    .from("videos")
    .select("id, title")
    .or("description.is.null,description.eq.")
    .eq("status", "published")
    .eq("visibility", "public")
    .limit(50);

  for (const video of semDesc || []) {
    const description = generateDescriptionForModel(video.title);
    await supabase.from("videos").update({ description }).eq("id", video.id);
    fixedDesc++;
  }

  const { data: semSlug } = await supabase
    .from("videos")
    .select("id, title")
    .or("slug.is.null,slug.eq.")
    .eq("status", "published")
    .eq("visibility", "public")
    .limit(50);

  for (const video of semSlug || []) {
    const slug = video.title
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 80) + "-" + video.id.substring(0, 8);
    await supabase.from("videos").update({ slug }).eq("id", video.id);
    fixedSlugs++;
  }

  if (fixedTags > 0 || fixedDesc > 0 || fixedSlugs > 0) {
    await sendTelegram(
      `🔧 AUTO-RESOLUÇÃO CONCLUÍDA\n` +
      `🏷️ Tags adicionadas: ${fixedTags} vídeos\n` +
      `📝 Descrições geradas: ${fixedDesc} vídeos\n` +
      `🔗 Slugs criados: ${fixedSlugs} vídeos\n` +
      `✅ Tudo resolvido automaticamente.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT INTELIGENTE — interpreta mensagens em linguagem natural
// ─────────────────────────────────────────────────────────────────────────────

const SITE_ROUTES: Record<string, string> = {
  "homepage": "/",
  "inicio": "/",
  "home": "/",
  "videos": "/videos",
  "galeria": "/videos",
  "lista de videos": "/videos",
  "video": "/videos",
  "shorts": "/shorts",
  "short": "/shorts",
  "curtos": "/shorts",
  "modelos": "/modelos",
  "modelo": "/modelos",
  "categorias": "/categorias",
  "categoria": "/categorias",
  "canais": "/canais",
  "canal": "/canais",
  "fotos": "/fotos-gifs",
  "gifs": "/fotos-gifs",
  "fotos e gifs": "/fotos-gifs",
  "populares": "/populares",
  "recomendados": "/recomendados",
  "pesquisa": "/search",
  "search": "/search",
  "busca": "/search",
  "tags": "/videos",
  "galeria premium": "/galeria",
  "premium": "/galeria",
};

async function checkRoute(path: string): Promise<{
  ok: boolean;
  status: number;
  ms: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "SuckOrSex-Monitor/1.0" }
    });
    const ms = Date.now() - start;
    return { ok: res.ok, status: res.status, ms };
  } catch (err) {
    const ms = Date.now() - start;
    return { ok: false, status: 0, ms, error: String(err) };
  }
}

async function handleIntelligentMessage(text: string): Promise<void> {
  const lower = text.toLowerCase();

  // Detectar se menciona uma rota específica (mais longa primeiro para evitar match errado)
  let detectedRoute: string | null = null;
  let detectedRouteName: string | null = null;

  const sortedRoutes = Object.entries(SITE_ROUTES).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [keyword, path] of sortedRoutes) {
    if (lower.includes(keyword)) {
      detectedRoute = path;
      detectedRouteName = keyword;
      break;
    }
  }

  // Detectar intenção da pergunta
  const isRouteQuestion =
    lower.includes("consegue") ||
    lower.includes("aceder") ||
    lower.includes("abre") ||
    lower.includes("funciona") ||
    lower.includes("erro") ||
    lower.includes("problema") ||
    lower.includes("carrega") ||
    lower.includes("lento") ||
    lower.includes("offline") ||
    lower.includes("down") ||
    lower.includes("acessar") ||
    lower.includes("entrar");

  const isStatsQuestion =
    lower.includes("quantos") ||
    lower.includes("total") ||
    lower.includes("contador") ||
    lower.includes("numero") ||
    lower.includes("número");

  const isStatusQuestion =
    lower.includes("estado") ||
    lower.includes("status") ||
    lower.includes("como está") ||
    lower.includes("tudo bem") ||
    lower.includes("relatorio") ||
    lower.includes("relatório");

  // Pergunta sobre rota específica
  if (detectedRoute && (isRouteQuestion || detectedRoute !== "/")) {
    await sendTelegram(`🔍 A verificar a página "${detectedRouteName}"...`);

    const result = await checkRoute(detectedRoute);
    const url = `${SITE_URL}${detectedRoute}`;

    if (result.ok && result.ms < 3000) {
      await sendTelegram(
        `✅ Página "${detectedRouteName}" está acessível\n` +
        `🌐 URL: ${url}\n` +
        `⚡ Tempo de resposta: ${result.ms}ms\n` +
        `📋 Status HTTP: ${result.status}\n\n` +
        `Conclusão: A página está a funcionar correctamente. ` +
        `Se algum utilizador não consegue aceder, o problema ` +
        `é do lado do utilizador (cache, VPN, browser).`
      );
    } else if (result.ok && result.ms >= 3000) {
      await sendTelegram(
        `⚠️ Página "${detectedRouteName}" está lenta\n` +
        `🌐 URL: ${url}\n` +
        `⏱️ Tempo de resposta: ${result.ms}ms (acima do normal)\n` +
        `📋 Status HTTP: ${result.status}\n\n` +
        `Conclusão: A página responde mas está mais lenta que o habitual. ` +
        `Recomendo verificar a query Supabase desta rota.`
      );
    } else if (!result.ok && result.status > 0) {
      await sendTelegram(
        `❌ Página "${detectedRouteName}" com ERRO\n` +
        `🌐 URL: ${url}\n` +
        `🔴 Status HTTP: ${result.status}\n` +
        `⏱️ Tempo: ${result.ms}ms\n\n` +
        `Conclusão: Erro de servidor. Verifica os logs do ` +
        `Supabase e o servidor Express imediatamente.`
      );
    } else {
      await sendTelegram(
        `🔴 Página "${detectedRouteName}" INACESSÍVEL\n` +
        `🌐 URL: ${url}\n` +
        `⏱️ Timeout após: ${result.ms}ms\n\n` +
        `Conclusão: A página não responde. ` +
        `O servidor pode estar offline. Verifica o deploy.`
      );
    }
    return;
  }

  // Pergunta sobre estatísticas
  if (isStatsQuestion) {
    if (lower.includes("tag")) {
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .not("tags", "is", null)
        .neq("tags", "{}");
      await sendTelegram(`🏷️ Vídeos com tags: ${count}`);
    } else if (lower.includes("descri")) {
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .not("description", "is", null)
        .neq("description", "");
      await sendTelegram(`📝 Vídeos com descrição: ${count}`);
    } else if (lower.includes("slug")) {
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .not("slug", "is", null)
        .neq("slug", "");
      await sendTelegram(`🔗 Vídeos com slug: ${count}`);
    } else {
      const { count: total } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");
      const { count: modelos } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "creator");
      await sendTelegram(
        `📊 CONTADORES\n` +
        `🎬 Vídeos publicados: ${total}\n` +
        `👤 Criadores: ${modelos}`
      );
    }
    return;
  }

  // Pergunta sobre estado geral
  if (isStatusQuestion) {
    await sendTelegram(`🔍 A verificar todas as páginas principais...`);

    const routes = [
      { nome: "Homepage", path: "/" },
      { nome: "Vídeos", path: "/videos" },
      { nome: "Shorts", path: "/shorts" },
      { nome: "Modelos", path: "/modelos" },
      { nome: "Categorias", path: "/categorias" },
      { nome: "Pesquisa", path: "/search" },
      { nome: "Galeria Premium", path: "/galeria" },
    ];

    const results = await Promise.all(
      routes.map(async (r) => {
        const result = await checkRoute(r.path);
        return { ...r, ...result };
      })
    );

    const { count: total } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    const { count: semDesc } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .or("description.is.null,description.eq.");

    const { count: semTags } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .or("tags.is.null,tags.eq.{}");

    const routeLines = results
      .map(r => {
        const icon = r.ok && r.ms < 3000 ? "✅" : r.ok ? "⚠️" : "❌";
        const info = r.ok ? `${r.status} — ${r.ms}ms` : `ERRO ${r.status || "timeout"}`;
        return `${icon} ${r.nome}: ${info}`;
      })
      .join("\n");

    await sendTelegram(
      `📊 ESTADO COMPLETO DO SITE\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `PÁGINAS:\n${routeLines}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `BASE DE DADOS:\n` +
      `🎬 Vídeos publicados: ${total}\n` +
      `📝 Sem descrição: ${semDesc}\n` +
      `🏷️ Sem tags: ${semTags}`
    );
    return;
  }

  // Mensagem não reconhecida — mostrar ajuda
  await sendTelegram(
    `🤖 Monitor SuckOrSex — Comandos disponíveis:\n\n` +
    `📄 PÁGINAS (escreve o nome + problema):\n` +
    `"A galeria não abre"\n` +
    `"Problema nos shorts"\n` +
    `"Os vídeos estão a carregar?"\n\n` +
    `📊 ESTATÍSTICAS:\n` +
    `"Quantos vídeos temos?"\n` +
    `"Quantas tags temos?"\n\n` +
    `🔍 ESTADO GERAL:\n` +
    `"Estado do site"\n` +
    `"Como está tudo?"`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Webhook do Telegram — mensagem enviada no grupo
    if (body.message) {
      const text = (body.message.text || "");
      await handleIntelligentMessage(text);
      return new Response("OK", { status: 200 });
    }

    // Cron jobs normais — chamados pelo pg_cron / scheduler
    const type = body.type || "uptime";

    if (type === "uptime") await checkUptime();
    else if (type === "sitemaps") await checkSitemaps();
    else if (type === "content") {
      await checkUptime();
      await checkSitemaps();
      await checkContent();
    }
    else if (type === "daily_report") await dailyReport();
    else if (type === "autofix") await autoFixContent();
    else if (type === "test") {
      await sendTelegram(
        "✅ Monitor activo e a funcionar correctamente!\n" +
        "🤖 Bot inteligente online — respondo a perguntas sobre o site."
      );
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
});
