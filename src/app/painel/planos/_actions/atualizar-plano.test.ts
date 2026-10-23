import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/validacao";

const PLANO = "22222222-2222-4222-8222-222222222222";
const estado: FormState = { success: false };
const FALHA_STRIPE =
  "Não foi possível criar o preço na Stripe. O preço do plano não mudou.";

const { getUser, criarPreco, clienteStripeTeste, cenario } = vi.hoisted(() => ({
  getUser: vi.fn(),
  criarPreco: vi.fn(),
  clienteStripeTeste: vi.fn(),
  cenario: {
    plano: {
      kind: "mensal",
      price_cents: 10000,
      stripe_product_id: "prod_1",
      stripe_price_id: "price_antigo",
    },
    atualizacoes: [] as Record<string, unknown>[],
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: async () => {},
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/stripe-teste", () => ({
  clienteStripeTeste,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: cenario.plano, error: null }),
        }),
      }),
      update(payload: Record<string, unknown>) {
        cenario.atualizacoes.push(payload);
        return {
          eq: () => ({
            select: () =>
              Promise.resolve({ data: [{ id: PLANO }], error: null }),
          }),
        };
      },
    }),
  }),
}));

import { salvarPreco } from "./atualizar-plano";

function formulario(preco: string) {
  const dados = new FormData();
  dados.set("id", PLANO);
  dados.set("preco", preco);
  return dados;
}

beforeEach(() => {
  cenario.plano = {
    kind: "mensal",
    price_cents: 10000,
    stripe_product_id: "prod_1",
    stripe_price_id: "price_antigo",
  };
  cenario.atualizacoes = [];
  getUser.mockReset();
  criarPreco.mockReset();
  clienteStripeTeste.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
  clienteStripeTeste.mockReturnValue({
    prices: { create: criarPreco },
    products: { create: vi.fn() },
  });
  criarPreco.mockResolvedValue({ id: "price_novo" });
});

describe("salvarPreco", () => {
  it("não grava o preço local quando a Stripe não cria o preço", async () => {
    criarPreco.mockRejectedValue(new Error("stripe"));

    const resultado = await salvarPreco(estado, formulario("150,00"));

    expect(resultado).toEqual({ success: false, message: FALHA_STRIPE });
    expect(cenario.atualizacoes).toHaveLength(0);
  });

  it("grava o preço local junto com o preço novo da Stripe", async () => {
    const resultado = await salvarPreco(estado, formulario("150,00"));

    expect(resultado).toEqual({ success: true, message: "Preço salvo." });
    expect(cenario.atualizacoes).toEqual([
      {
        price_cents: 15000,
        stripe_product_id: "prod_1",
        stripe_price_id: "price_novo",
      },
    ]);
  });

  it("zera o preço e limpa o preço da Stripe sem chamá-la", async () => {
    const resultado = await salvarPreco(estado, formulario("0"));

    expect(resultado.success).toBe(true);
    expect(criarPreco).not.toHaveBeenCalled();
    expect(cenario.atualizacoes).toEqual([
      {
        price_cents: 0,
        stripe_product_id: "prod_1",
        stripe_price_id: null,
      },
    ]);
  });
});
