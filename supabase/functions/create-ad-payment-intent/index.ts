// supabase/functions/create-ad-payment-intent/index.ts
// Cria PaymentIntent Stripe para pagamentos únicos de publicidade.
// NÃO requer autenticação — empresas externas não têm conta.
// Deploy: npx supabase functions deploy create-ad-payment-intent --no-verify-jwt
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
      amount, planId, planDays, planName,
      companyName, companyEmail, websiteUrl,
      headline, description, ctaText,
      logoUrl, bgColor, accentColor, placement,
    } = body as {
      amount: number; planId: string; planDays: number; planName: string;
      companyName: string; companyEmail: string; websiteUrl: string;
      headline: string; description: string; ctaText: string;
      logoUrl?: string; bgColor: string; accentColor: string; placement: string;
    };

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!planId || !companyName || !companyEmail || !websiteUrl || !headline) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios em falta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        planId,
        planDays:    String(planDays),
        planName,
        companyName,
        companyEmail,
        websiteUrl,
        headline,
        description,
        ctaText,
        logoUrl:    logoUrl ?? "",
        bgColor,
        accentColor,
        placement,
      },
    });

    console.log(`[ad-payment-intent] PI ${paymentIntent.id} para ${companyEmail} (${planName})`);

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ad-payment-intent] Erro:", message);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
