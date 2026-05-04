// supabase/functions/ad-payment-webhook/index.ts
// Recebe payment_intent.succeeded do Stripe e insere o anúncio na BD.
//
// SEGURANÇA:
//   1. Verifica assinatura Stripe antes de processar qualquer evento
//   2. Idempotência via tabela ads_webhook_events (event.id único)
//   3. Erros de infraestrutura → 500 (Stripe reenvia)
//   4. Eventos já processados → 200 (Stripe não reenvia)
//
// Variáveis de ambiente OBRIGATÓRIAS:
//   STRIPE_SECRET_KEY              — chave secreta do Stripe
//   STRIPE_AD_PAYMENT_WEBHOOK_SECRET — webhook signing secret (whsec_...)
//   SUPABASE_URL                   — URL do projeto
//   SUPABASE_SERVICE_ROLE_KEY      — service role key
//
// Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://yuzkigijkmynxtqxduyq.supabase.co/functions/v1/ad-payment-webhook
//   Eventos: payment_intent.succeeded
//
// Deploy: npx supabase functions deploy ad-payment-webhook --no-verify-jwt

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

// @ts-ignore
const STRIPE_SECRET_KEY  = Deno.env.get("STRIPE_SECRET_KEY")                  ?? "";
// @ts-ignore
const WEBHOOK_SECRET     = Deno.env.get("STRIPE_AD_PAYMENT_WEBHOOK_SECRET")   ?? "";
// @ts-ignore
const SUPABASE_URL       = Deno.env.get("SUPABASE_URL")                       ?? "";
// @ts-ignore
const SERVICE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")          ?? "";

const SECRETS_OK = Boolean(STRIPE_SECRET_KEY && WEBHOOK_SECRET && SUPABASE_URL && SERVICE_KEY);

if (!SECRETS_OK) {
  console.error(
    "[ad-payment-webhook] FATAL — secrets em falta: " +
    "STRIPE_SECRET_KEY, STRIPE_AD_PAYMENT_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

serve(async (req: Request) => {
  if (!SECRETS_OK || !stripe) {
    console.error("[ad-payment-webhook] Pedido rejeitado: configuração incompleta.");
    return new Response("Service unavailable", { status: 503 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── 1. Verificar assinatura Stripe ────────────────────────────────────
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("[ad-payment-webhook] stripe-signature header em falta");
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ad-payment-webhook] Falha na verificação de assinatura:", msg);
    return new Response("Signature verification failed", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── 2. Verificar idempotência ─────────────────────────────────────────
  const { data: existingEvent, error: lookupError } = await supabase
    .from("ads_webhook_events")
    .select("id, outcome")
    .eq("id", event.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[ad-payment-webhook] Erro ao verificar idempotência:", lookupError.message);
    return new Response("Database error", { status: 500 });
  }

  if (existingEvent?.outcome === "ok") {
    console.log(`[ad-payment-webhook] Evento duplicado ignorado: ${event.id}`);
    return new Response(
      JSON.stringify({ received: true, duplicate: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: reserveError } = await supabase
    .from("ads_webhook_events")
    .upsert({
      id:           event.id,
      event_type:   event.type,
      outcome:      "processing",
      processed_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (reserveError) {
    console.error("[ad-payment-webhook] Erro ao reservar evento:", reserveError.message);
    return new Response("Database error", { status: 500 });
  }

  // ── 3. Processar evento ───────────────────────────────────────────────
  try {
    await handleEvent(event, supabase);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ad-payment-webhook] Erro crítico no handler:", msg);

    await supabase
      .from("ads_webhook_events")
      .update({ outcome: "error" })
      .eq("id", event.id);

    return new Response("Internal server error", { status: 500 });
  }

  // ── 4. Marcar evento como processado com sucesso ──────────────────────
  await supabase
    .from("ads_webhook_events")
    .update({ outcome: "ok" })
    .eq("id", event.id);

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ── Handler de eventos ────────────────────────────────────────────────────────
async function handleEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  switch (event.type) {

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const m  = pi.metadata ?? {};

      const planDays  = parseInt(m.planDays ?? "7", 10);
      const startsAt  = new Date();
      const endsAt    = new Date(startsAt.getTime() + planDays * 24 * 60 * 60 * 1000);

      // placement stored as JSON string array e.g. '["all_pages"]'
      let placement: string[] = ["all_pages"];
      try {
        const parsed = JSON.parse(m.placement ?? '["all_pages"]');
        if (Array.isArray(parsed)) placement = parsed;
      } catch {
        placement = [m.placement ?? "all_pages"];
      }

      // Verificar se o anúncio já foi inserido pelo cliente (evita duplicação)
      const { data: existingAd } = await supabase
        .from("ads")
        .select("id")
        .eq("stripe_payment_id", pi.id)
        .maybeSingle();

      if (existingAd) {
        console.log(`[ad-payment-webhook] Anúncio já inserido pelo cliente (PI: ${pi.id}). A saltar.`);
        break;
      }

      const { error } = await supabase
        .from("ads")
        .insert({
          company_name:      m.companyName,
          company_email:     m.companyEmail,
          website_url:       m.websiteUrl,
          headline:          m.headline,
          description:       m.description  ?? "",
          cta_text:          m.ctaText      ?? "Saber mais",
          logo_url:          m.logoUrl      || null,
          bg_color:          m.bgColor      ?? "#0f0f1a",
          accent_color:      m.accentColor  ?? "#ec4899",
          plan_id:           m.planId,
          plan_days:         planDays,
          plan_price:        (pi.amount / 100).toFixed(2),
          placement,
          status:            "active",
          stripe_payment_id: pi.id,
          paid_at:           startsAt.toISOString(),
          starts_at:         startsAt.toISOString(),
          ends_at:           endsAt.toISOString(),
        });

      if (error) throw new Error(`DB insert failed (payment_intent.succeeded): ${error.message}`);
      console.log(`[ad-payment-webhook] Anúncio criado para ${m.companyEmail} — PI ${pi.id}`);
      break;
    }

    default:
      console.log(`[ad-payment-webhook] Evento não tratado: ${event.type}`);
  }
}
