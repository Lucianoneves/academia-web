import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cartaoEmTeste,
  clienteStripeTeste,
  segredoWebhookTeste,
} from "./stripe-teste";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cliente de teste da Stripe", () => {
  it("recusa chave que não é de teste", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc");

    expect(cartaoEmTeste()).toBe(false);
    expect(clienteStripeTeste()).toBeNull();
  });

  it("recusa chave ausente", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "   ");

    expect(clienteStripeTeste()).toBeNull();
  });

  it("aceita chave de teste sem cobrar", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", " sk_test_abc ");

    expect(cartaoEmTeste()).toBe(true);
    expect(clienteStripeTeste()).not.toBeNull();
  });

  it("recusa segredo de webhook fora do formato", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "secreto");

    expect(segredoWebhookTeste()).toBeNull();
  });

  it("aceita segredo de webhook de teste", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", " whsec_abc ");

    expect(segredoWebhookTeste()).toBe("whsec_abc");
  });
});
