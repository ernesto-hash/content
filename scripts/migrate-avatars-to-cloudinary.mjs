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

const AVATAR_BUCKET = "avatars";
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

function extractProfileIdFromAvatarPath(path) {
  // AJUSTA se necessário
  // exemplo esperado: <profileId>/<ficheiro>
  const parts = path.split("/");
  if (parts.length < 2) return null;
  return parts[0];
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
  const files = await listAllFiles(AVATAR_BUCKET);

  for (const file of files) {
    try {
      const profileId = extractProfileIdFromAvatarPath(file.path);
      if (!profileId) {
        console.log(`Ignorado: ${file.path}`);
        continue;
      }

      const buffer = await downloadFile(AVATAR_BUCKET, file.path);

      const result = await uploadBufferToCloudinary(buffer, {
        folder: `monument/avatars/${profileId}`,
        public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
        resource_type: "image",
        overwrite: false,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: result.secure_url,
          avatar_public_id: result.public_id,
        })
        .eq("id", profileId);

      if (error) throw error;

      console.log(`OK avatar -> ${profileId}`);
    } catch (err) {
      console.error(`ERRO em ${file.path}:`, err.message || err);
    }
  }

  console.log("Migração de avatars concluída.");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});