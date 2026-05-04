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

const VIDEO_BUCKET = "videos";
const PAGE_SIZE = 50;

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
      const path = folder ? `${folder}/${item.name}` : item.name;

      if (!item.metadata) {
        const nested = await listAllFiles(bucket, path);
        allFiles.push(...nested);
      } else {
        allFiles.push({ name: item.name, path, metadata: item.metadata });
      }
    }

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return allFiles;
}

function extractVideoIdFromVideoPath(path) {
  // esperado: uploads/<videoId>/<ficheiro>
  const parts = path.split("/");
  if (parts.length < 3) return null;
  if (parts[0] !== "uploads") return null;
  return parts[1];
}

async function downloadFile(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function main() {
  const files = await listAllFiles(VIDEO_BUCKET);

  for (const file of files) {
    try {
      const videoId = extractVideoIdFromVideoPath(file.path);
      if (!videoId) {
        console.log(`Ignorado: ${file.path}`);
        continue;
      }

      const buffer = await downloadFile(VIDEO_BUCKET, file.path);

      const result = await uploadBufferToCloudinary(buffer, {
        folder: `monument/videos/${videoId}`,
        public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
        resource_type: "video",
        overwrite: false,
      });

      const { error } = await supabase
        .from("videos")
        .update({
          video_url: result.secure_url,
          cloudinary_public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format || null,
          bytes: result.bytes || null,
          duration: result.duration || null,
          width: result.width || null,
          height: result.height || null,
        })
        .eq("id", videoId);

      if (error) throw error;

      console.log(`OK video -> ${videoId}`);
    } catch (err) {
      console.error(`ERRO em ${file.path}:`, err.message || err);
    }
  }

  console.log("Migração de vídeos concluída.");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});