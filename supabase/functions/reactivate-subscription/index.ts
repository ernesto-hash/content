// supabase/functions/reactivate-subscription/index.ts
// Reverte o cancelamento agendado — a subscrição volta a renovar normalmente.
//
// Só funciona se cancel_at_period_end = true e o período ainda não terminou.
//
// Erros:
//   401 — sem auth ou JWT inválido
//   404 — sem subscrição activa
//   409 — subscrição não estava marcada para cancelar
//   500 — falha no Stripe ou na BD

// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@14.21.0?no-check&target=denonext";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

// @ts-ignore
const STRIPE_SECRET_KEY   = Deno.env.get("STRIPE_SECRET_KEY")         ?? "";
// @ts-ignore
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")               ?? "";
// @ts-ignore
const SERVICE_KEY         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")  ?? "";
// @ts-ignore
const ALLOWED_ORIGINS_RAW = Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "";

const ALLOWED_ORIGINS = new Set(
  ALLOWED_ORIGINS_RAW.split(",").map((s: string) => s.trim()).filter(Boolean)
);

const SECRETS_OK = Boolean(STRIPE_SECRET_KEY && SUPABASE_URL && SERVICE_KEY && ALLOWED_ORIGINS_RAW);

const stripe = SECRETS_OK
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin":  allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded  = base64 + "=".repeat((4 - base64.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SECRETS_OK || !stripe) {
    return new Response(
      JSON.stringify({ error: "Serviço indisponível." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token   = authHeader.slice(7);
    const payload = decodeJwtPayload(token);

    if (!payload || typeof payload.sub !== "string" || !payload.sub) {
      return new Response(
        JSON.stringify({ error: "Token inválido. Faz login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return new Response(
        JSON.stringify({ error: "Sessão expirada. Faz login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId: string = payload.sub;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── 2. Ler subscrição activa ──────────────────────────────────────────────
    const { data: sub, error: dbErr } = await supabase
      .from("galeria_subscricoes")
      .select("stripe_sub_id, status, periodo_fim, cancel_at_period_end")
      .eq("user_id", userId)
      .in("status", ["active", "trial"])
      .maybeSingle();

    if (dbErr) {
      console.error("[reactivate-sub] DB read error:", dbErr.message);
      return new Response(
        JSON.stringify({ error: "Erro ao ler subscrição." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sub) {
      return new Response(
        JSON.stringify({ error: "Sem subscrição activa." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sub.cancel_at_period_end) {
      return new Response(
        JSON.stringify({ error: "A subscrição não está marcada para cancelar.", not_cancelled: true }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sub.stripe_sub_id) {
      return new Response(
        JSON.stringify({ error: "ID de subscrição Stripe em falta." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Reverter cancelamento no Stripe ────────────────────────────────────
    await stripe.subscriptions.update(sub.stripe_sub_id, {
      cancel_at_period_end: false,
    });

    // ── 4. Actualizar BD ──────────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("galeria_subscricoes")
      .update({ cancel_at_period_end: false })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("[reactivate-sub] DB update error:", updateErr.message);
      return new Response(
        JSON.stringify({ error: "Subscrição reactivada no Stripe mas falha ao actualizar BD." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[reactivate-sub] Subscrição ${sub.stripe_sub_id} reactivada (user ${userId})`);

    return new Response(
      JSON.stringify({ success: true, periodo_fim: sub.periodo_fim }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reactivate-sub] Erro interno:", message);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
