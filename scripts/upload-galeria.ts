/**
 * Upload em massa de fotos para o Supabase Storage + galeria_fotos
 *
 * Estrutura de pastas esperada (relativa à raiz do projecto):
 *   images/
 *     normal/
 *       Nome do Pack/
 *         foto1.jpg
 *         foto2.png
 *     exclusivo/
 *       Pack Exclusivo X/
 *         ...
 *     raro/
 *       Pack Raro Y/
 *         ...
 *
 * Uso:
 *   pnpm upload:galeria
 *
 * Pré-requisitos:
 *   - Bucket "galeria-fotos" criado como PRIVADO no Supabase Dashboard
 *   - SQL do PASSO 1 executado (unique index em storage_path)
 *   - .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL       = process.env.SUPABASE_URL;
const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET             = "galeria-fotos";
const IMAGE_EXTS         = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const IMAGES_ROOT        = path.join(__dirname, "..", "images");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ETIQUETA_MAP: Record<string, string> = {
  normal:    "Normal",
  exclusivo: "Exclusivo",
  raro:      "Raro",
};

const errors: string[] = [];

// ── helpers ──────────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isDir(p: string) {
  return fs.statSync(p).isDirectory();
}

function listImages(dir: string) {
  return fs.readdirSync(dir)
    .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();
}

async function upsertPack(
  titulo: string,
  categoria: string,
  etiqueta: string,
  fotosCount: number,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("galeria_packs")
    .select("id")
    .eq("titulo", titulo)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("galeria_packs")
    .insert({
      titulo,
      categoria,
      etiqueta,
      fotos_count: fotosCount,
      is_premium:  true,
      views:       0,
    })
    .select("id")
    .single();

  if (error) {
    errors.push(`Pack insert error "${titulo}": ${error.message}`);
    return null;
  }
  return created.id as string;
}

async function uploadFoto(
  packId:      string,
  filePath:    string,
  storagePath: string,
  ordem:       number,
  isPreview:   boolean,
): Promise<boolean> {
  const buffer = fs.readFileSync(filePath);
  let contentType = "image/jpeg";

  try {
    const meta = await sharp(buffer).metadata();
    if (meta.format) contentType = `image/${meta.format}`;
  } catch {
    // sharp can't determine format — keep default
  }

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (uploadErr) {
    errors.push(`Storage upload "${storagePath}": ${uploadErr.message}`);
    return false;
  }

  // upsert using storage_path as conflict key
  const { error: dbErr } = await supabase
    .from("galeria_fotos")
    .upsert(
      { pack_id: packId, storage_path: storagePath, ordem, is_preview: isPreview, legenda: null },
      { onConflict: "storage_path" },
    );

  if (dbErr) {
    errors.push(`DB upsert "${storagePath}": ${dbErr.message}`);
    return false;
  }

  return true;
}

// ── main ─────────────────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(IMAGES_ROOT)) {
    console.error(`❌  Pasta de imagens não encontrada: ${IMAGES_ROOT}`);
    console.error(`   Cria a pasta e coloca as imagens com a estrutura documentada no script.`);
    process.exit(1);
  }

  const categories = fs.readdirSync(IMAGES_ROOT).filter(d => isDir(path.join(IMAGES_ROOT, d)));

  if (categories.length === 0) {
    console.error("❌  Nenhuma categoria encontrada em images/");
    process.exit(1);
  }

  let totalFotos = 0;
  let totalErros = 0;

  for (const category of categories) {
    const etiqueta   = ETIQUETA_MAP[category.toLowerCase()] ?? category;
    const categoryDir = path.join(IMAGES_ROOT, category);
    const packs       = fs.readdirSync(categoryDir).filter(d => isDir(path.join(categoryDir, d)));

    for (const packFolder of packs) {
      const packDir = path.join(categoryDir, packFolder);
      const files   = listImages(packDir);

      if (files.length === 0) {
        console.log(`⚠️   ${category}/${packFolder} — sem imagens, a saltar`);
        continue;
      }

      console.log(`\n📦  ${packFolder}  [${etiqueta}]  ${files.length} foto(s)`);

      const packId = await upsertPack(packFolder, category, etiqueta, files.length);
      if (!packId) {
        console.error(`    ❌  Não foi possível criar/encontrar o pack`);
        totalErros++;
        continue;
      }

      const slug = slugify(packFolder);

      for (let i = 0; i < files.length; i++) {
        const file        = files[i];
        const storagePath = `${slug}/${file}`;
        const filePath    = path.join(packDir, file);

        process.stdout.write(`    [${i + 1}/${files.length}] ${file} … `);

        const ok = await uploadFoto(packId, filePath, storagePath, i + 1, i === 0);
        if (ok) {
          process.stdout.write("✓\n");
          totalFotos++;
        } else {
          process.stdout.write("❌\n");
          totalErros++;
        }
      }

      // update fotos_count after upload
      await supabase
        .from("galeria_packs")
        .update({ fotos_count: files.length })
        .eq("id", packId);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅  ${totalFotos} foto(s) processada(s)   ❌  ${totalErros} erro(s)`);

  if (errors.length > 0) {
    const logPath = path.join(__dirname, "upload-errors.log");
    fs.writeFileSync(logPath, errors.join("\n") + "\n", "utf8");
    console.log(`📋  Erros guardados em scripts/upload-errors.log`);
  }
}

run().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
