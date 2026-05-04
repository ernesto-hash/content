// supabase/functions/create-payment-intent/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@14.21.0?no-check&target=denonext";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

// ── Variáveis de ambiente ────────────────────────────────────────────────────
// @ts-ignore
const STRIPE_SECRET_KEY   = Deno.env.get("STRIPE_SECRET_KEY")          ?? "";
// @ts-ignore
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")                ?? "";
// @ts-ignore
const SERVICE_KEY         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")   ?? "";
// @ts-ignore
const ALLOWED_ORIGINS_RAW = Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "";

const ALLOWED_ORIGINS = new Set(
  ALLOWED_ORIGINS_RAW.split(",").map((s: string) => s.trim()).filter(Boolean)
);

const SECRETS_OK = Boolean(STRIPE_SECRET_KEY && SUPABASE_URL && SERVICE_KEY && ALLOWED_ORIGINS_RAW);

if (!SECRETS_OK) {
  console.error("[payment-intent] FATAL — secrets em falta:",
    `STRIPE_SECRET_KEY=${!!STRIPE_SECRET_KEY}`,
    `SUPABASE_URL=${!!SUPABASE_URL}`,
    `SERVICE_KEY=${!!SERVICE_KEY}`,
    `ALLOWED_ORIGINS=${!!ALLOWED_ORIGINS_RAW}`
  );
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

const VALID_PRICE_IDS = new Set([
  "price_1TH1C3DszTPKV7EvnXKm5As8",
  "price_1TH1ClDszTPKV7Evt6NJEOlz",
  "price_1TH1EPDszTPKV7EvW1A8d7lO",
  "price_1TH1EPDszTPKV7EvunbX6zsA",
  "price_1TH1FGDszTPKV7EvwBtzv0YS",
  "price_1TH1FGDszTPKV7EvIiTagCyU",
]);

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin":  allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cross-Origin-Resource-Policy": "cross-origin",
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
      JSON.stringify({ error: "Serviço indisponível — secrets em falta." }),
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
    // ── 1. Extrair userId do JWT ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado — token em falta." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token   = authHeader.slice(7);
    const payload = decodeJwtPayload(token);

    if (!payload || typeof payload.sub !== "string" || !payload.sub) {
      console.error("[payment-intent] JWT inválido ou sem campo sub");
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

    const userId: string    = payload.sub;
    const userEmail: string = typeof payload.email === "string" ? payload.email : "";

    console.log(`[payment-intent] userId: ${userId}`);

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── 2. Validar priceId ───────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { priceId } = body as { priceId?: string };

    if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
      return new Response(
        JSON.stringify({ error: `Plano inválido: ${priceId ?? "(vazio)"}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Verificar subscrição activa ───────────────────────────────────────
    const { data: existingSub } = await supabaseAdmin
      .from("galeria_subscricoes")
      .select("status, periodo_fim")
      .eq("user_id", userId)
      .in("status", ["active", "trial"])
      .maybeSingle();

    if (existingSub) {
      const fimOk = existingSub.periodo_fim
        ? new Date(existingSub.periodo_fim) > new Date()
        : true;
      if (fimOk) {
        return new Response(
          JSON.stringify({ error: "Já tens uma subscrição ativa." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── 4. Obter ou criar Stripe customer ────────────────────────────────────
    const { data: subData } = await supabaseAdmin
      .from("galeria_subscricoes")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId: string | undefined = subData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("galeria_subscricoes")
        .upsert({
          user_id:            userId,
          stripe_customer_id: customerId,
          plano:              "pendente",
          status:             "pendente",
        }, { onConflict: "user_id" });
    }

    // ── 5. Criar subscrição com payment_behavior: "default_incomplete" ───────
    const subscription = await stripe.subscriptions.create({
      customer:          customerId,
      items:             [{ price: priceId }],
      payment_behavior:  "default_incomplete",
      expand:            ["latest_invoice.payment_intent"],
      trial_period_days: 3,
      metadata:          { supabase_user_id: userId },
    });

    // @ts-ignore — expand garante que latest_invoice é um objecto completo
    const invoice       = subscription.latest_invoice;
    // @ts-ignore
    const paymentIntent = invoice?.payment_intent ?? null;

    // ── 6. Trial → paymentIntent nulo → criar SetupIntent ───────────────────
    // Com trial_period_days, o primeiro invoice é 0€ e não gera PaymentIntent.
    // Criamos um SetupIntent para recolher cartão para billing futuro.
    if (!paymentIntent?.client_secret) {
      const setupIntent = await stripe.setupIntents.create({
        customer:             customerId,
        payment_method_types: ["card"],
        metadata: {
          supabase_user_id: userId,
          subscription_id:  subscription.id,
        },
      });

      console.log(`[payment-intent] Trial — SetupIntent ${setupIntent.id} sub ${subscription.id}`);

      return new Response(
        JSON.stringify({
          clientSecret:   setupIntent.client_secret,
          subscriptionId: subscription.id,
          intentType:     "setup",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 7. Subscrição normal → clientSecret do PaymentIntent ────────────────
    console.log(`[payment-intent] PaymentIntent ${paymentIntent.id} sub ${subscription.id}`);

    return new Response(
      JSON.stringify({
        clientSecret:   paymentIntent.client_secret,
        subscriptionId: subscription.id,
        intentType:     "payment",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[payment-intent] Erro interno:", message);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
