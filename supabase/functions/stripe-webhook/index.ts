// supabase/functions/stripe-webhook/index.ts
// Recebe eventos do Stripe e atualiza subscrições na BD
//
// SEGURANÇA:
//   1. Verifica assinatura Stripe antes de processar qualquer evento
//   2. Idempotência via tabela stripe_webhook_events (event.id único)
//   3. Erros de infraestrutura → 500 (Stripe reenvia)
//   4. Eventos já processados → 200 (Stripe não reenvia)
//   5. Erros de lógica de negócio → 200 com log (nosso problema, não do Stripe)
//
// Variáveis de ambiente OBRIGATÓRIAS:
//   STRIPE_SECRET_KEY          — chave secreta do Stripe
//   STRIPE_WEBHOOK_SECRET      — webhook signing secret (whsec_...)
//   SUPABASE_URL               — URL do projeto
//   SUPABASE_SERVICE_ROLE_KEY  — service role key
//
// Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Eventos:
//     customer.subscription.created
//     customer.subscription.updated
//     customer.subscription.deleted
//     invoice.payment_succeeded
//     invoice.payment_failed

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

// ── Ler variáveis de ambiente ────────────────────────────────────────────────
// @ts-ignore
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
// @ts-ignore
const WEBHOOK_SECRET    = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
// @ts-ignore
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SECRETS_OK = Boolean(STRIPE_SECRET_KEY && WEBHOOK_SECRET && SUPABASE_URL && SERVICE_KEY);

if (!SECRETS_OK) {
  console.error(
    "[webhook] FATAL — secrets em falta: " +
    "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
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
    console.error("[webhook] Pedido rejeitado: configuração incompleta.");
    return new Response("Service unavailable", { status: 503 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── 1. Verificar assinatura Stripe ────────────────────────────────────
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("[webhook] stripe-signature header em falta");
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] Falha na verificação de assinatura:", msg);
    return new Response("Signature verification failed", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── 2. Verificar idempotência ─────────────────────────────────────────
  const { data: existingEvent, error: lookupError } = await supabase
    .from("stripe_webhook_events")
    .select("id, outcome")
    .eq("id", event.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[webhook] Erro ao verificar idempotência:", lookupError.message);
    return new Response("Database error", { status: 500 });
  }

  if (existingEvent?.outcome === "ok") {
    console.log(`[webhook] Evento duplicado ignorado: ${event.id}`);
    return new Response(
      JSON.stringify({ received: true, duplicate: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: reserveError } = await supabase
    .from("stripe_webhook_events")
    .upsert({
      id:           event.id,
      event_type:   event.type,
      outcome:      "processing",
      processed_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (reserveError) {
    console.error("[webhook] Erro ao reservar evento:", reserveError.message);
    return new Response("Database error", { status: 500 });
  }

  // ── 3. Processar evento ───────────────────────────────────────────────
  try {
    await handleEvent(event, supabase, stripe);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] Erro crítico no handler:", msg);

    const { error: errMarkError } = await supabase
      .from("stripe_webhook_events")
      .update({ outcome: "error", error_message: msg.substring(0, 500) })
      .eq("id", event.id);
    if (errMarkError) console.error("[webhook] Falha ao registar erro:", errMarkError.message);

    return new Response("Internal server error", { status: 500 });
  }

  // ── 4. Marcar evento como processado com sucesso ──────────────────────
  const { error: errMarkOk } = await supabase
    .from("stripe_webhook_events")
    .update({ outcome: "ok" })
    .eq("id", event.id);
  if (errMarkOk) console.error("[webhook] Falha ao marcar evento como ok:", errMarkOk.message);

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ── Handler de eventos ────────────────────────────────────────────────────────
async function handleEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe
): Promise<void> {
  switch (event.type) {

    case "customer.subscription.created": {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn(`[webhook] subscription.created sem supabase_user_id: ${sub.id}`);
        break;
      }

      const item  = sub.items.data[0];
      const plano = getPlanFromPriceId(item?.price?.id ?? "");

      const { error } = await supabase
        .from("galeria_subscricoes")
        .upsert({
          user_id:            userId,
          stripe_customer_id: sub.customer as string,
          stripe_sub_id:      sub.id,
          status:             sub.status === "trialing" ? "trial" : "active",
          plano,
          periodo_fim: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
          trial_fim:   sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        }, { onConflict: "user_id" });

      if (error) throw new Error(`DB upsert failed (subscription.created): ${error.message}`);
      console.log(`[webhook] Subscrição criada para user ${userId}`);
      break;
    }

    case "customer.subscription.updated": {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn(`[webhook] subscription.updated sem supabase_user_id: ${sub.id}`);
        break;
      }

      const item  = sub.items.data[0];
      const plano = getPlanFromPriceId(item?.price?.id ?? "");

      let status: string;
      switch (sub.status) {
        case "active":   status = "active";  break;
        case "trialing": status = "trial";   break;
        case "canceled":
        case "unpaid":
        case "past_due": status = "expired"; break;
        default:         status = sub.status;
      }

      const { error } = await supabase
        .from("galeria_subscricoes")
        .update({
          status,
          plano,
          stripe_sub_id: sub.id,
          periodo_fim:   new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
          trial_fim:     sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        })
        .eq("user_id", userId);

      if (error) throw new Error(`DB update failed (subscription.updated): ${error.message}`);
      console.log(`[webhook] Subscrição actualizada para user ${userId}: ${status}`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn(`[webhook] subscription.deleted sem supabase_user_id: ${sub.id}`);
        break;
      }

      const { error } = await supabase
        .from("galeria_subscricoes")
        .update({
          status:      "expired",
          periodo_fim: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw new Error(`DB update failed (subscription.deleted): ${error.message}`);
      console.log(`[webhook] Subscrição cancelada para user ${userId}`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId   = invoice.subscription as string | null;
      if (!subId) break;

      const sub    = await stripe.subscriptions.retrieve(subId);
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn(`[webhook] payment_succeeded sem supabase_user_id: ${subId}`);
        break;
      }

      const { error } = await supabase
        .from("galeria_subscricoes")
        .update({
          status:      "active",
          periodo_fim: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw new Error(`DB update failed (payment_succeeded): ${error.message}`);
      console.log(`[webhook] Pagamento bem-sucedido para user ${userId}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId   = invoice.subscription as string | null;
      if (!subId) break;

      const sub    = await stripe.subscriptions.retrieve(subId);
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn(`[webhook] payment_failed sem supabase_user_id: ${subId}`);
        break;
      }

      console.warn(`[webhook] Pagamento falhado para user ${userId}, sub ${subId}`);
      break;
    }

    default:
      console.log(`[webhook] Evento não tratado: ${event.type}`);
  }
}

// ── Mapeia priceId do Stripe para plano interno ──────────────────────────────
// CORRIGIDO: IDs sincronizados com create-checkout-session/index.ts e GaleriaAuthenticated.tsx
function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    "price_1TH1C3DszTPKV7EvnXKm5As8": "normal",
    "price_1TH1ClDszTPKV7Evt6NJEOlz": "normal",
    "price_1TH1EPDszTPKV7EvW1A8d7lO": "exclusivo",
    "price_1TH1EPDszTPKV7EvunbX6zsA": "exclusivo",
    "price_1TH1FGDszTPKV7EvwBtzv0YS": "raro",
    "price_1TH1FGDszTPKV7EvIiTagCyU": "raro",
  };
  return map[priceId] ?? "desconhecido";
}