import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { reembolsoDaCobranca } from "./stripe-reembolso";

function stripeCom(reembolsos: Partial<Stripe.Refund>[]) {
  const list = vi.fn(async () => ({ data: reembolsos }));
  const stripe = { refunds: { list } } as unknown as Stripe;
  return { stripe, list };
}

describe("reembolsoDaCobranca", () => {
  it("ignora reembolso falho ou cancelado e fica com o vigente mais antigo", async () => {
    const { stripe, list } = stripeCom([
      { id: "re_falho", status: "failed", created: 1 },
      { id: "re_cancelado", status: "canceled", created: 2 },
      { id: "re_recente", status: "succeeded", created: 30 },
      { id: "re_antigo", status: "pending", created: 10 },
    ]);

    const achado = await reembolsoDaCobranca(stripe, "pi_1");

    expect(list).toHaveBeenCalledWith({ payment_intent: "pi_1", limit: 100 });
    expect(achado?.id).toBe("re_antigo");
  });

  it("não devolve reembolso quando nenhum está vigente", async () => {
    const { stripe } = stripeCom([
      { id: "re_falho", status: "failed", created: 1 },
      { id: "re_cancelado", status: "canceled", created: 2 },
    ]);

    await expect(reembolsoDaCobranca(stripe, "pi_1")).resolves.toBeNull();
  });
});
