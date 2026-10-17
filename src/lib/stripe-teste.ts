import "server-only";

import Stripe from "stripe";

const AVISO =
  "Cobrança no cartão disponível só com a chave de teste da Stripe.";

export function cartaoEmTeste() {
  return (process.env.STRIPE_SECRET_KEY?.trim() ?? "").startsWith("sk_test_");
}

export function clienteStripeTeste() {
  const chave = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!chave.startsWith("sk_test_")) return null;

  return new Stripe(chave, { apiVersion: "2026-09-30.endive" });
}

export function segredoWebhookTeste() {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  return segredo.startsWith("whsec_") ? segredo : null;
}

export function avisoCartaoTeste() {
  return AVISO;
}
