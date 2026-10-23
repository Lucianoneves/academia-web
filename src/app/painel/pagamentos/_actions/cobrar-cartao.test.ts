import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/validacao";

const ALUNO = "11111111-1111-4111-8111-111111111111";
const PLANO = "22222222-2222-4222-8222-222222222222";
const estado: FormState = { success: false };

const { getUser, criarCliente, criarSessao, clienteStripeTeste, cenario } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    criarCliente: vi.fn(),
    criarSessao: vi.fn(),
    clienteStripeTeste: vi.fn(),
    cenario: { administrador: true },
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

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3000" }),
}));

vi.mock("@/lib/stripe-preco", () => ({
  garantirPrecoStripe: vi.fn(),
}));

vi.mock("@/lib/stripe-teste", () => ({
  clienteStripeTeste,
  avisoCartaoTeste: () =>
    "Cobrança no cartão disponível só com a chave de teste da Stripe.",
}));

type Aluno = {
  id: string;
  active: boolean;
  name: string;
  email: string | null;
  phone: string;
  stripe_customer_id: string | null;
};

type Plano = {
  id: string;
  kind: string;
  active: boolean;
  price_cents: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
};

const aluno: Aluno = {
  id: ALUNO,
  active: true,
  name: "Ana Silva",
  email: "ana@firma.com",
  phone: "11987654321",
  stripe_customer_id: "cus_velho",
};
const plano: Plano = {
  id: PLANO,
  kind: "mensal",
  active: true,
  price_cents: 15000,
  stripe_product_id: "prod_1",
  stripe_price_id: "price_1",
};
const tabelas: string[] = [];
const leiturasAluno: { data: Partial<Aluno> | null; error: null }[] = [];
let perderAtualizacao = false;
let filtroCliente: string | null | undefined;

function leitura(dados: Partial<Aluno> | null) {
  return { data: dados, error: null as null };
}

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: { getUser },
    from(tabela: string) {
      tabelas.push(tabela);
      if (tabela === "administrators") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: cenario.administrador
                  ? { id: "adm-1", name: "Ana" }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (tabela === "plans") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: plano, error: null }),
            }),
          }),
        };
      }

      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () =>
                  leiturasAluno.shift() ?? { data: aluno, error: null },
              };
            },
          };
        },
        update(payload: { stripe_customer_id: string }) {
          const filtros: Record<string, unknown> = {};
          let exigeNulo = false;
          const cadeia = {
            eq(coluna: string, valor: unknown) {
              filtros[coluna] = valor;
              return cadeia;
            },
            is(coluna: string, valor: unknown) {
              if (coluna === "stripe_customer_id" && valor === null) {
                exigeNulo = true;
              }
              return cadeia;
            },
            select() {
              return {
                maybeSingle: async () => {
                  filtroCliente = exigeNulo
                    ? null
                    : (filtros.stripe_customer_id as string | undefined);
                  if (perderAtualizacao) return { data: null, error: null };
                  return {
                    data: { stripe_customer_id: payload.stripe_customer_id },
                    error: null,
                  };
                },
              };
            },
          };
          return cadeia;
        },
      };
    },
  }),
}));

import { iniciarCheckout } from "./cobrar-cartao";

function formulario() {
  const dados = new FormData();
  dados.set("aluno", ALUNO);
  dados.set("plano", PLANO);
  return dados;
}

function administrador() {
  getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
}

beforeEach(() => {
  tabelas.length = 0;
  leiturasAluno.length = 0;
  perderAtualizacao = false;
  cenario.administrador = true;
  filtroCliente = undefined;
  aluno.active = true;
  aluno.stripe_customer_id = "cus_velho";
  plano.active = true;
  plano.price_cents = 15000;
  getUser.mockReset();
  criarCliente.mockReset();
  criarSessao.mockReset();
  clienteStripeTeste.mockReset();
  administrador();
  clienteStripeTeste.mockReturnValue({
    customers: { create: criarCliente },
    checkout: { sessions: { create: criarSessao } },
  });
  criarCliente.mockResolvedValue({ id: "cus_novo" });
  criarSessao.mockResolvedValue({ url: "https://checkout.test/sessao" });
});

describe("iniciarCheckout", () => {
  it("não abre sessão sem login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(iniciarCheckout(estado, new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
    expect(criarSessao).not.toHaveBeenCalled();
  });

  it("não abre sessão para quem não é administrador", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    cenario.administrador = false;

    await expect(iniciarCheckout(estado, new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/acesso/encerrar"
    );
    expect(criarSessao).not.toHaveBeenCalled();
    expect(tabelas).not.toContain("students");
  });

  it("não cobra aluno inativo nem plano fora de venda", async () => {
    aluno.active = false;
    const inativo = await iniciarCheckout(estado, formulario());
    expect(inativo.success).toBe(false);
    expect(criarSessao).not.toHaveBeenCalled();

    aluno.active = true;
    plano.active = false;
    const planoParado = await iniciarCheckout(estado, formulario());
    expect(planoParado.success).toBe(false);

    plano.active = true;
    plano.price_cents = 0;
    const semPreco = await iniciarCheckout(estado, formulario());
    expect(semPreco.success).toBe(false);
    expect(criarSessao).not.toHaveBeenCalled();
  });

  it("devolve o link sem lançar pagamento", async () => {
    const resultado = await iniciarCheckout(estado, formulario());

    expect(resultado.success).toBe(true);
    expect(resultado.link).toBe("https://checkout.test/sessao");
    expect(tabelas).not.toContain("payments");
    expect(criarSessao).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_velho",
        client_reference_id: ALUNO,
        metadata: { student_id: ALUNO, plan_id: PLANO },
        line_items: [{ quantity: 1, price: "price_1" }],
      })
    );
  });

  it("usa o cliente que o outro pedido gravou quando a atualização se perde", async () => {
    aluno.stripe_customer_id = null;
    perderAtualizacao = true;
    leiturasAluno.push(
      leitura({ ...aluno, stripe_customer_id: null }),
      leitura({ stripe_customer_id: "cus_vencedor" })
    );

    const resultado = await iniciarCheckout(estado, formulario());

    expect(resultado.success).toBe(true);
    expect(filtroCliente).toBeNull();
    expect(criarCliente).toHaveBeenCalledOnce();
    expect(criarSessao).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_vencedor" })
    );
  });

  it("troca o cliente que a Stripe não encontra e tenta o checkout de novo", async () => {
    criarSessao
      .mockRejectedValueOnce({ code: "resource_missing", param: "customer" })
      .mockResolvedValueOnce({ url: "https://checkout.test/novo" });

    const resultado = await iniciarCheckout(estado, formulario());

    expect(resultado.success).toBe(true);
    expect(resultado.link).toBe("https://checkout.test/novo");
    expect(filtroCliente).toBe("cus_velho");
    expect(criarSessao).toHaveBeenLastCalledWith(
      expect.objectContaining({ customer: "cus_novo" })
    );
  });
});
