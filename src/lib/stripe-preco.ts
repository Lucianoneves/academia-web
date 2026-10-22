import type Stripe from "stripe";
import { planosCadastro } from "@/lib/validacao";

export async function garantirPrecoStripe(
  stripe: Stripe,
  plano: {
    id: string;
    kind: string;
    priceCents: number;
    productId: string | null;
    priceId: string | null;
  }
) {
  let productId = plano.productId;
  const nome =
    planosCadastro.find((item) => item.value === plano.kind)?.label ?? "Plano";

  if (!productId) {
    const produto = await stripe.products.create({
      name: nome,
      metadata: { plan_id: plano.id, kind: plano.kind },
    });
    productId = produto.id;
  }

  if (plano.priceId) {
    return { productId, priceId: plano.priceId };
  }

  const price = await stripe.prices.create({
    currency: "brl",
    unit_amount: plano.priceCents,
    product: productId,
    metadata: { plan_id: plano.id },
  });

  return { productId, priceId: price.id };
}
