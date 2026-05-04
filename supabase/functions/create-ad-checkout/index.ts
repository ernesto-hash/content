// supabase/functions/create-ad-checkout/index.ts
// Cria sessão de Checkout Stripe para anúncios pagos.
// NÃO requer autenticação — empresas externas não têm conta.
// Deploy: npx supabase functions deploy create-ad-checkout --no-verify-jwt
// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@14.21.0?no-check&target=denonext";

// @ts-ignore
const STRIPE_SECRET_KEY   = Deno.env.get("STRIPE_SECRET_KEY")          ?? "";
// @ts-ignore
const ALLOWED_ORIGINS_RAW = Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "";

const ALLOWED_ORIGINS = new Set(
  ALLOWED_ORIGINS_RAW.split(",").map((s: string) => s.trim()).filter(Boolean)
);

const VALID_PRICE_IDS = new Set([
  // Preenche com os price IDs reais após criar no Stripe Dashboard
  // Exemplo: "price_1ABCDE...", "price_1FGHIJ..."
  // Por agora, aceita qualquer price_* para facilitar testes
]);

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.size === 0 || ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin":  allowedOrigin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!stripe) {
    return new Response(
      JSON.stringify({ error: "Serviço indisponível — STRIPE_SECRET_KEY em falta." }),
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
    const body = await req.json().catch(() => ({}));
    const {
      priceId,
      planId,
      planDays,
      planPrice,
      placement,
      companyName,
      companyEmail,
      websiteUrl,
      headline,
      description,
      ctaText,
      logoUrl,
      bgColor,
      accentColor,
    } = body as {
      priceId: string; planId: string; planDays: number; planPrice: number;
      placement: string[]; companyName: string; companyEmail: string;
      websiteUrl: string; headline: string; description: string;
      ctaText: string; logoUrl: string; bgColor: string; accentColor: string;
    };

    if (!priceId || !planId || !companyName || !companyEmail || !websiteUrl || !headline) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios em falta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se a whitelist tiver IDs, valida. Se estiver vazia (dev), aceita tudo.
    if (VALID_PRICE_IDS.size > 0 && !VALID_PRICE_IDS.has(priceId)) {
      return new Response(
        JSON.stringify({ error: `Plano inválido: ${priceId}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") ?? Array.from(ALLOWED_ORIGINS)[0] ?? "";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/anunciar?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/anunciar?payment_canceled=true`,
      customer_email: companyEmail,
      metadata: {
        planId,
        planDays:    String(planDays),
        planPrice:   String(planPrice),
        placement:   JSON.stringify(placement),
        companyName,
        companyEmail,
        websiteUrl,
        headline,
        description,
        ctaText:     ctaText  || "Saber mais",
        logoUrl:     logoUrl  || "",
        bgColor:     bgColor  || "#0f0f1a",
        accentColor: accentColor || "#ec4899",
      },
    });

    console.log(`[ad-checkout] Sessão criada: ${session.id} para ${companyEmail}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ad-checkout] Erro:", message);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
