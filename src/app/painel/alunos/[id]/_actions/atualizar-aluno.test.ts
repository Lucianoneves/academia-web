import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/validacao";

const ALUNO = "11111111-1111-4111-8111-111111111111";
const estado: FormState = { success: false };
const AVISO =
  "O cliente na Stripe não foi atualizado. Salve de novo para tentar outra vez.";

const { getUser, atualizarCliente, clienteStripeTeste, cenario } = vi.hoisted(
  () => ({
    getUser: vi.fn(),
    atualizarCliente: vi.fn(),
    clienteStripeTeste: vi.fn(),
    cenario: {
      cliente: "cus_1" as string | null,
      atualizacoes: [] as Record<string, unknown>[],
    },
  })
);

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
    from(tabela: string) {
      if (tabela === "administrators") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "adm-1", name: "Ana" },
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { stripe_customer_id: cenario.cliente },
              error: null,
            }),
          }),
        }),
        update(payload: Record<string, unknown>) {
          cenario.atualizacoes.push(payload);
          return {
            eq: () => ({
              select: () =>
                Promise.resolve({ data: [{ id: ALUNO }], error: null }),
            }),
          };
        },
      };
    },
  }),
}));

import { atualizarAluno } from "./atualizar-aluno";

function formulario() {
  const dados = new FormData();
  dados.set("nome", "Ana Silva");
  dados.set("nascimento", "2000-01-02");
  dados.set("telefone", "11987654321");
  dados.set("peso", "70");
  dados.set("altura", "");
  dados.set("plano", "");
  dados.set("email", "ana@firma.com");
  return dados;
}

beforeEach(() => {
  cenario.cliente = "cus_1";
  cenario.atualizacoes = [];
  getUser.mockReset();
  atualizarCliente.mockReset();
  clienteStripeTeste.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
  clienteStripeTeste.mockReturnValue({
    customers: { update: atualizarCliente },
  });
  atualizarCliente.mockResolvedValue({});
});

describe("atualizarAluno", () => {
  it("mantém a ficha salva quando a Stripe não atualiza o cliente", async () => {
    atualizarCliente.mockRejectedValue(new Error("stripe"));

    const resultado = await atualizarAluno(ALUNO, estado, formulario());

    expect(resultado).toEqual({
      success: true,
      message: "Alterações salvas.",
      aviso: AVISO,
    });
    expect(cenario.atualizacoes).toEqual([
      expect.objectContaining({
        name: "Ana Silva",
        phone: "11987654321",
        email: "ana@firma.com",
      }),
    ]);
    expect(atualizarCliente).toHaveBeenCalledWith("cus_1", {
      name: "Ana Silva",
      phone: "+5511987654321",
      email: "ana@firma.com",
    });
  });
});
