import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const THUMB_BUCKET = "thumbnails";
const PAGE_SIZE = 100;

async function listAllFiles(bucket, folder = "") {
  let page = 0;
  const allFiles = [];

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (!item.id) continue;

      const path = folder ? `${folder}/${item.name}` : item.name;

      // se for "pasta", tenta entrar nela
      if (!item.metadata) {
        const nested = await listAllFiles(bucket, path);
        allFiles.push(...nested);
      } else {
        allFiles.push({
          name: item.name,
          path,
          metadata: item.metadata,
        });
      }
    }

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return allFiles;
}

function extractVideoIdFromThumbPath(path) {
  // esperado: thumbs/<videoId>/<ficheiro>
  const parts = path.split("/");
  if (parts.length < 3) return null;
  if (parts[0] !== "thumbs") return null;
  return parts[1];
}

async function downloadFile(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function migrateOneThumbnail(file) {
  const videoId = extractVideoIdFromThumbPath(file.path);

  if (!videoId) {
    console.log(`Ignorado (path fora do padrão): ${file.path}`);
    return;
  }

  console.log(`A migrar thumbnail: ${file.path} -> video ${videoId}`);

  const buffer = await downloadFile(THUMB_BUCKET, file.path);

  const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const publicId = `monument/thumbnails/${videoId}/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`;

  const result = await uploadBufferToCloudinary(buffer, {
    folder: `monument/thumbnails/${videoId}`,
    public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
    resource_type: "image",
    overwrite: false,
  });

  const { error: updateError } = await supabase
    .from("videos")
    .update({
      thumbnail_url: result.secure_url,
      thumbnail_public_id: result.public_id,
    })
    .eq("id", videoId);

  if (updateError) throw updateError;

  console.log(`OK thumbnail -> ${result.secure_url}`);
}

async function main() {
  console.log("A listar thumbnails no Supabase...");
  const files = await listAllFiles(THUMB_BUCKET);

  console.log(`Encontrados ${files.length} ficheiros no bucket "${THUMB_BUCKET}"`);

  for (const file of files) {
    try {
      await migrateOneThumbnail(file);
    } catch (err) {
      console.error(`ERRO em ${file.path}:`, err.message || err);
    }
  }

  console.log("Migração de thumbnails concluída.");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});