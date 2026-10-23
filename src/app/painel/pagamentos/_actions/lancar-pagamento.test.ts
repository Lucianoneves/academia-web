import { beforeEach, describe, expect, it, vi } from "vitest";
import { diaSaoPauloUnix, hojeSaoPaulo } from "@/lib/validacao";

const ALUNO = "11111111-1111-4111-8111-111111111111";
const PLANO = "22222222-2222-4222-8222-222222222222";
const PAGAMENTO = "33333333-3333-4333-8333-333333333333";
const HORARIO = "44444444-4444-4444-8444-444444444444";

const {
  getUser,
  criarReembolso,
  reembolsoDaCobranca,
  clienteStripeTeste,
  cenario,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  criarReembolso: vi.fn(),
  reembolsoDaCobranca: vi.fn(),
  clienteStripeTeste: vi.fn(),
  cenario: {
    administrador: true,
    pagamento: null as null | Record<string, unknown>,
    planoKind: "mensal",
    usos: [] as { appointment_date: string; schedule_id: string }[],
    horarios: [] as { id: string; starts_at: string }[],
    jaEstornado: false,
    erroInsert: null as null | { code: string; message: string },
    inserido: null as null | Record<string, unknown>,
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

vi.mock("@/lib/stripe-reembolso", () => ({
  reembolsoDaCobranca,
}));

vi.mock("@/lib/stripe-teste", () => ({
  clienteStripeTeste,
}));

function lista(dados: unknown[]) {
  const resultado = Promise.resolve({ data: dados, error: null });
  const cadeia = {
    eq() {
      return cadeia;
    },
    in() {
      return resultado;
    },
    then(
      resolve: (value: { data: unknown[]; error: null }) => unknown,
      reject?: (reason: unknown) => unknown
    ) {
      return resultado.then(resolve, reject);
    },
  };
  return cadeia;
}

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: { getUser },
    from(tabela: string) {
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
              maybeSingle: async () => ({
                data: { kind: cenario.planoKind },
                error: null,
              }),
            }),
          }),
        };
      }

      if (tabela === "appointments") {
        return { select: () => lista(cenario.usos) };
      }

      if (tabela === "class_schedules") {
        return { select: () => lista(cenario.horarios) };
      }

      return {
        select() {
          return {
            eq(coluna: string) {
              if (coluna === "reverses_payment_id") {
                return {
                  maybeSingle: async () => ({
                    data: cenario.jaEstornado ? { id: "ja-estornado" } : null,
                    error: null,
                  }),
                };
              }
              return {
                maybeSingle: async () => ({
                  data: cenario.pagamento,
                  error: null,
                }),
              };
            },
          };
        },
        insert(linha: Record<string, unknown>) {
          cenario.inserido = linha;
          return Promise.resolve({ error: cenario.erroInsert });
        },
      };
    },
  }),
}));

import { estornarPagamento } from "./lancar-pagamento";

function recebimento(method: "cartao" | "dinheiro") {
  cenario.pagamento = {
    id: PAGAMENTO,
    student_id: ALUNO,
    plan_id: PLANO,
    amount_cents: 15000,
    kind: "recebimento",
    method,
    stripe_payment_intent_id: method === "cartao" ? "pi_1" : null,
  };
}

beforeEach(() => {
  cenario.administrador = true;
  cenario.planoKind = "mensal";
  cenario.usos = [];
  cenario.horarios = [];
  cenario.jaEstornado = false;
  cenario.erroInsert = null;
  cenario.inserido = null;
  recebimento("cartao");
  getUser.mockReset();
  criarReembolso.mockReset();
  reembolsoDaCobranca.mockReset();
  clienteStripeTeste.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
  clienteStripeTeste.mockReturnValue({
    refunds: { create: criarReembolso },
  });
  criarReembolso.mockResolvedValue({ id: "re_1", created: 1_700_000_000 });
  reembolsoDaCobranca.mockResolvedValue(null);
});

describe("estornarPagamento", () => {
  it("não reembolsa sem login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(estornarPagamento(PAGAMENTO)).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
    expect(criarReembolso).not.toHaveBeenCalled();
  });

  it("não reembolsa quem não é administrador", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    cenario.administrador = false;

    await expect(estornarPagamento(PAGAMENTO)).rejects.toThrow(
      "NEXT_REDIRECT:/acesso/encerrar"
    );
    expect(criarReembolso).not.toHaveBeenCalled();
    expect(cenario.inserido).toBeNull();
  });

  it("não lança estorno de cartão sem chave de teste ou sem cobrança", async () => {
    clienteStripeTeste.mockReturnValue(null);
    const semChave = await estornarPagamento(PAGAMENTO);
    expect(semChave.success).toBe(false);
    expect(cenario.inserido).toBeNull();

    clienteStripeTeste.mockReturnValue({
      refunds: { create: criarReembolso },
    });
    cenario.pagamento = {
      ...(cenario.pagamento as Record<string, unknown>),
      stripe_payment_intent_id: null,
    };
    const semCobranca = await estornarPagamento(PAGAMENTO);
    expect(semCobranca.success).toBe(false);
    expect(criarReembolso).not.toHaveBeenCalled();
    expect(cenario.inserido).toBeNull();
  });

  it("reaproveita o reembolso vigente quando a Stripe recusa criar outro", async () => {
    criarReembolso.mockRejectedValue(new Error("já reembolsado"));
    reembolsoDaCobranca.mockResolvedValue({
      id: "re_antigo",
      created: 1_700_000_100,
      status: "succeeded",
    });

    const resultado = await estornarPagamento(PAGAMENTO);

    expect(resultado.success).toBe(true);
    expect(cenario.inserido).toMatchObject({
      student_id: ALUNO,
      plan_id: PLANO,
      amount_cents: 15000,
      method: "cartao",
      kind: "estorno",
      reverses_payment_id: PAGAMENTO,
      stripe_refund_id: "re_antigo",
      paid_on: diaSaoPauloUnix(1_700_000_100),
    });
  });

  it("copia o recebimento e usa a data do reembolso em São Paulo", async () => {
    const resultado = await estornarPagamento(PAGAMENTO);

    expect(resultado).toEqual({
      success: true,
      message: "Recebimento estornado.",
    });
    expect(cenario.inserido).toMatchObject({
      student_id: ALUNO,
      plan_id: PLANO,
      amount_cents: 15000,
      method: "cartao",
      kind: "estorno",
      paid_on: diaSaoPauloUnix(1_700_000_000),
      stripe_refund_id: "re_1",
    });
  });

  it("trata conflito de estorno único como sucesso", async () => {
    cenario.erroInsert = { code: "23505", message: "duplicate" };

    const resultado = await estornarPagamento(PAGAMENTO);

    expect(resultado).toEqual({
      success: true,
      message: "Recebimento estornado.",
    });
    expect(cenario.inserido).toMatchObject({ stripe_refund_id: "re_1" });
  });

  it("segura o estorno do avulso enquanto a aula não começou", async () => {
    cenario.planoKind = "avulso";
    cenario.usos = [{ appointment_date: "2099-06-01", schedule_id: HORARIO }];
    cenario.horarios = [{ id: HORARIO, starts_at: "08:00:00" }];

    const resultado = await estornarPagamento(PAGAMENTO);

    expect(resultado).toEqual({
      success: false,
      message: "Cancele a aula que consumiu este crédito antes de estornar.",
    });
    expect(criarReembolso).not.toHaveBeenCalled();
    expect(cenario.inserido).toBeNull();
  });

  it("estorna o avulso quando a aula já começou", async () => {
    cenario.planoKind = "avulso";
    cenario.usos = [{ appointment_date: "2020-01-01", schedule_id: HORARIO }];
    cenario.horarios = [{ id: HORARIO, starts_at: "08:00:00" }];

    const resultado = await estornarPagamento(PAGAMENTO);

    expect(resultado.success).toBe(true);
    expect(criarReembolso).toHaveBeenCalledOnce();
  });

  it("estorna dinheiro sem chamar a Stripe", async () => {
    recebimento("dinheiro");

    const resultado = await estornarPagamento(PAGAMENTO);

    expect(resultado.success).toBe(true);
    expect(criarReembolso).not.toHaveBeenCalled();
    expect(cenario.inserido).toMatchObject({
      student_id: ALUNO,
      plan_id: PLANO,
      amount_cents: 15000,
      method: "dinheiro",
      kind: "estorno",
      reverses_payment_id: PAGAMENTO,
      paid_on: hojeSaoPaulo(),
    });
    expect(cenario.inserido).not.toHaveProperty("stripe_refund_id");
  });
});
