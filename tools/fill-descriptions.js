import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error("\n❌ Variáveis de ambiente em falta no .env:");
  if (!SUPABASE_URL) console.error("   SUPABASE_URL");
  if (!SUPABASE_KEY) console.error("   SUPABASE_SERVICE_ROLE_KEY");
  if (!ANTHROPIC_KEY) console.error("   ANTHROPIC_API_KEY");
  console.error("\nAdiciona-as e volta a correr.\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BATCH_SIZE = 50;
const LOG_FILE = resolve(__dirname, "fill-descriptions-log.json");
const DELAY_MS = 500;

function loadLog() {
  if (existsSync(LOG_FILE)) {
    try { return JSON.parse(readFileSync(LOG_FILE, "utf8")); } catch {}
  }
  return { processedIds: [], failedIds: [], totalUpdated: 0, startedAt: new Date().toISOString() };
}

function saveLog(log) {
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

async function generateDescriptions(videos) {
  const prompt = `Generate concise SEO-optimized descriptions for these adult videos. Each description must be 2-3 natural English sentences, varied in phrasing, never repetitive. Return ONLY a valid JSON array, no markdown, no extra text.

Format: [{"id": "uuid", "description": "text"}, ...]

Videos:
${videos.map(v => `{"id": "${v.id}", "title": ${JSON.stringify(v.title || "")}, "category": ${JSON.stringify(v.category || "general")}}`).join("\n")}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.content[0].text.trim();

  // Extract JSON even if there's surrounding text
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`JSON não encontrado na resposta: ${raw.slice(0, 200)}`);

  return JSON.parse(match[0]);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("\n🔍 A contar vídeos sem descrição...");

  const { count: total } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .or("description.is.null,description.eq.");

  if (!total || total === 0) {
    console.log("✅ Todos os vídeos já têm descrição. Nada a fazer.");
    return;
  }

  const totalBatches = Math.ceil(total / BATCH_SIZE);
  console.log(`📋 ${total} vídeos sem descrição → ${totalBatches} lotes de ${BATCH_SIZE}\n`);

  const log = loadLog();
  const alreadyProcessed = new Set(log.processedIds);

  let batchNum = 0;
  let offset = 0;
  let totalUpdated = log.totalUpdated;

  while (true) {
    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, title, category")
      .or("description.is.null,description.eq.")
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error(`❌ Erro ao buscar vídeos (offset ${offset}):`, error.message);
      break;
    }

    if (!videos || videos.length === 0) break;

    // Skip already processed
    const toProcess = videos.filter(v => !alreadyProcessed.has(v.id));

    if (toProcess.length === 0) {
      offset += BATCH_SIZE;
      continue;
    }

    batchNum++;
    process.stdout.write(`Lote ${batchNum}/${totalBatches} (${toProcess.length} vídeos)... `);

    let descriptions;
    try {
      descriptions = await generateDescriptions(toProcess);
    } catch (err) {
      console.error(`\n⚠️  Anthropic falhou no lote ${batchNum}: ${err.message}`);
      for (const v of toProcess) {
        if (!log.failedIds.includes(v.id)) log.failedIds.push(v.id);
      }
      saveLog(log);
      offset += BATCH_SIZE;
      await sleep(DELAY_MS);
      continue;
    }

    // Map by id for quick lookup
    const descMap = new Map(descriptions.map(d => [d.id, d.description]));

    let batchUpdated = 0;
    for (const video of toProcess) {
      const description = descMap.get(video.id);
      if (!description) {
        console.warn(`\n⚠️  Sem descrição gerada para ${video.id}`);
        if (!log.failedIds.includes(video.id)) log.failedIds.push(video.id);
        continue;
      }

      const { error: updateErr } = await supabase
        .from("videos")
        .update({ description })
        .eq("id", video.id);

      if (updateErr) {
        console.warn(`\n⚠️  Falha ao actualizar ${video.id}: ${updateErr.message}`);
        if (!log.failedIds.includes(video.id)) log.failedIds.push(video.id);
      } else {
        log.processedIds.push(video.id);
        alreadyProcessed.add(video.id);
        batchUpdated++;
        totalUpdated++;
      }
    }

    log.totalUpdated = totalUpdated;
    saveLog(log);

    console.log(`✅ ${batchUpdated} actualizados (total: ${totalUpdated})`);

    offset += BATCH_SIZE;
    await sleep(DELAY_MS);
  }

  log.finishedAt = new Date().toISOString();
  saveLog(log);

  console.log(`\n🏁 Concluído!`);
  console.log(`   ✅ Actualizados: ${totalUpdated}`);
  console.log(`   ❌ Falhados:     ${log.failedIds.length}`);
  console.log(`   📄 Log guardado: tools/fill-descriptions-log.json\n`);
}

main().catch(err => {
  console.error("\n💥 Erro fatal:", err.message);
  process.exit(1);
});
