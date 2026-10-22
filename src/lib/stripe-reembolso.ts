import type Stripe from "stripe";

function reembolsoVigente(reembolsos: Stripe.Refund[]) {
  const vigentes = reembolsos.filter(
    (item) => item.status === "succeeded" || item.status === "pending"
  );
  if (vigentes.length === 0) return null;

  return vigentes.reduce((antigo, item) =>
    item.created < antigo.created ? item : antigo
  );
}

export async function reembolsoDaCobranca(stripe: Stripe, intent: string) {
  const lista = await stripe.refunds.list({
    payment_intent: intent,
    limit: 100,
  });

  return reembolsoVigente(lista.data);
}
