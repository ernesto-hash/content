import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const param = Array.isArray(id) ? id[0] : id || "";
  const isUUID = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(param);

  if (!isUUID) {
    return res.status(404).json({ error: "Not found" });
  }

  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", param)
    .single();

  if (data?.username) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.redirect(301, `/modelo/${data.username}`);
  }
  return res.status(404).json({ error: "Profile not found" });
}
