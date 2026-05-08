// supabase/functions/generate-thumbnail/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(JSON.stringify({ error: "videoId required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("id, video_url, storage_path")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Download first 3MB — enough for ffmpeg to decode the first keyframe
    const videoResponse = await fetch(video.video_url, {
      headers: { Range: "bytes=0-3145728" },
    });

    if (!videoResponse.ok && videoResponse.status !== 206) {
      return new Response(JSON.stringify({ error: "Failed to fetch video" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const videoBuffer = await videoResponse.arrayBuffer();

    const tempVideoPath = `/tmp/${videoId}.mp4`;
    const tempThumbPath = `/tmp/${videoId}.jpg`;

    // @ts-ignore
    await Deno.writeFile(tempVideoPath, new Uint8Array(videoBuffer));

    // @ts-ignore
    const ffmpegCmd = new Deno.Command("ffmpeg", {
      args: [
        "-i", tempVideoPath,
        "-ss", "00:00:01",
        "-vframes", "1",
        "-q:v", "2",
        "-f", "image2",
        tempThumbPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const ffmpegResult = await ffmpegCmd.output();

    // @ts-ignore
    try { await Deno.remove(tempVideoPath); } catch {}

    if (!ffmpegResult.success) {
      return new Response(JSON.stringify({ error: "ffmpeg failed" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // @ts-ignore
    const thumbBytes = await Deno.readFile(tempThumbPath);
    // @ts-ignore
    try { await Deno.remove(tempThumbPath); } catch {}

    const thumbPath = `auto/${videoId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(thumbPath, thumbBytes, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(thumbPath);

    await supabase.from("videos").update({ thumbnail_url: urlData.publicUrl }).eq("id", videoId);

    return new Response(
      JSON.stringify({ success: true, thumbnail_url: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
