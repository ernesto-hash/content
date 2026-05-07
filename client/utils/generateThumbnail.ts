import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

// Singleton — loaded once per page session, reused across calls.
let _ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg?.loaded) return _ffmpeg;
  const ff = new FFmpeg();
  await ff.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  });
  _ffmpeg = ff;
  return ff;
}

async function _generate(
  videoFile: File,
  onProgress?: (message: string) => void,
): Promise<File | null> {
  onProgress?.("A gerar thumbnail...");
  const ff = await getFFmpeg();

  onProgress?.("A processar vídeo...");
  await ff.writeFile("input.mp4", await fetchFile(videoFile));

  await ff.exec([
    "-i", "input.mp4",
    "-ss", "00:00:01",
    "-vframes", "1",
    "-q:v", "2",
    "thumb.jpg",
  ]);

  const data = await ff.readFile("thumb.jpg");

  // Clean up virtual filesystem between calls
  await ff.deleteFile("input.mp4");
  await ff.deleteFile("thumb.jpg");

  return new File([data as Uint8Array], "auto-thumbnail.jpg", { type: "image/jpeg" });
}

export async function generateThumbnail(
  videoFile: File,
  onProgress?: (message: string) => void,
): Promise<File | null> {
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 15_000));
  try {
    return await Promise.race([_generate(videoFile, onProgress), timeout]);
  } catch {
    return null;
  }
}
