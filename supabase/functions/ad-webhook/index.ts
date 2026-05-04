// supabase/functions/ad-webhook/index.ts
// Recebe eventos Stripe e activa anúncios na BD.
// Deploy: npx supabase functions deploy ad-webhook --no-verify-jwt
//
// No Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://yuzkigijkmynxtqxduyq.supabase.co/functions/v1/ad-webhook
//   Evento: checkout.session.completed
//   Copia o signing secret → Supabase → Edge Functions → Secrets → STRIPE_AD_WEBHOOK_SECRET
// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@14.21.0?no-check&target=denonext";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

// @ts-ignore
const STRIPE_SECRET_KEY       = Deno.env.get("STRIPE_SECRET_KEY")          ?? "";
// @ts-ignore
const STRIPE_AD_WEBHOOK_SECRET = Deno.env.get("STRIPE_AD_WEBHOOK_SECRET")  ?? "";
// @ts-ignore
const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")               ?? "";
// @ts-ignore
const SERVICE_KEY              = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")  ?? "";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!stripe || !STRIPE_AD_WEBHOOK_SECRET) {
    console.error("[ad-webhook] Secrets em falta");
    return new Response(JSON.stringify({ error: "Serviço indisponível." }), { status: 503 });
  }

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_AD_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ad-webhook] Assinatura inválida:", msg);
    return new Response(JSON.stringify({ error: "Webhook signature invalid" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Idempotência — evita processar o mesmo evento duas vezes
  const { data: existing } = await supabase
    .from("ads_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    console.log(`[ad-webhook] Evento já processado: ${event.id}`);
    return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200 });
  }

  await supabase.from("ads_webhook_events").insert({
    id: event.id, event_type: event.type, outcome: "processing",
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta    = session.metadata ?? {};

      const planDays = parseInt(meta.planDays ?? "7", 10);
      const now      = new Date();
      const endsAt   = new Date(now);
      endsAt.setDate(endsAt.getDate() + planDays);

      let placement: string[] = ["all_pages"];
      try { placement = JSON.parse(meta.placement ?? '["all_pages"]'); } catch {}

      const { error: insertErr } = await supabase.from("ads").insert({
        company_name:      meta.companyName,
        company_email:     meta.companyEmail,
        website_url:       meta.websiteUrl,
        headline:          meta.headline,
        description:       meta.description,
        cta_text:          meta.ctaText  || "Saber mais",
        logo_url:          meta.logoUrl  || null,
        bg_color:          meta.bgColor  || "#0f0f1a",
        accent_color:      meta.accentColor || "#ec4899",
        plan_id:           meta.planId,
        plan_days:         planDays,
        plan_price:        parseFloat(meta.planPrice ?? "0"),
        placement,
        status:            "active",
        stripe_session_id: session.id,
        stripe_payment_id: typeof session.payment_intent === "string"
                             ? session.payment_intent : null,
        paid_at:           now.toISOString(),
        starts_at:         now.toISOString(),
        ends_at:           endsAt.toISOString(),
      });

      if (insertErr) {
        throw new Error(`DB insert failed: ${insertErr.message}`);
      }

      console.log(`[ad-webhook] Anúncio activado para ${meta.companyName} (${planDays} dias)`);
    }

    await supabase.from("ads_webhook_events")
      .update({ outcome: "ok" }).eq("id", event.id);

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ad-webhook] Erro ao processar evento:", msg);
    await supabase.from("ads_webhook_events")
      .update({ outcome: "error" }).eq("id", event.id);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
