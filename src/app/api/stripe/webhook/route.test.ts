import { beforeEach, describe, expect, it, vi } from "vitest";

const ALUNO = "11111111-1111-4111-8111-111111111111";
const PLANO = "22222222-2222-4222-8222-222222222222";

type Linha = {
  id: string;
  student_id?: string;
  plan_id?: string;
  amount_cents?: number;
  kind?: string;
  method?: string;
  reverses_payment_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_refund_id?: string | null;
};

const {
  constructEvent,
  listarSessoes,
  reembolsoDaCobranca,
  clienteStripeTeste,
  segredoWebhookTeste,
  revalidatePath,
} = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  listarSessoes: vi.fn(),
  reembolsoDaCobranca: vi.fn(),
  clienteStripeTeste: vi.fn(),
  segredoWebhookTeste: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/stripe-teste", () => ({
  clienteStripeTeste,
  segredoWebhookTeste,
}));

vi.mock("@/lib/stripe-reembolso", () => ({
  reembolsoDaCobranca,
}));

const pagamentos: Linha[] = [];
const insercoes: Linha[] = [];

function duplicada(linha: Linha) {
  return pagamentos.some(
    (item) =>
      (linha.stripe_checkout_session_id &&
        item.stripe_checkout_session_id === linha.stripe_checkout_session_id) ||
      (linha.stripe_refund_id &&
        item.stripe_refund_id === linha.stripe_refund_id) ||
      (linha.reverses_payment_id &&
        item.reverses_payment_id === linha.reverses_payment_id)
  );
}

function consultar() {
  const filtros: Record<string, string> = {};
  const cadeia = {
    eq(coluna: string, valor: string) {
      filtros[coluna] = valor;
      return cadeia;
    },
    maybeSingle: async () => {
      const achado = pagamentos.find((item) =>
        Object.entries(filtros).every(
          ([chave, valor]) => String(item[chave as keyof Linha] ?? "") === valor
        )
      );
      return { data: achado ?? null, error: null };
    },
  };
  return cadeia;
}

function inserir(linha: Linha) {
  insercoes.push(linha);
  const erro = duplicada(linha)
    ? { code: "23505", message: "duplicate" }
    : null;
  if (!erro) {
    pagamentos.push({ ...linha, id: linha.id ?? crypto.randomUUID() });
  }
  const resultado = {
    data: erro ? null : { id: pagamentos.at(-1)?.id },
    error: erro,
  };
  const resposta = { error: erro };
  return {
    select() {
      return { maybeSingle: async () => resultado };
    },
    then(
      resolve: (value: typeof resposta) => unknown,
      reject?: (reason: unknown) => unknown
    ) {
      return Promise.resolve(resposta).then(resolve, reject);
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => consultar(),
      insert: (linha: Linha) => inserir(linha),
    }),
  }),
}));

import { POST } from "./route";

const stripe = {
  webhooks: { constructEvent },
  checkout: { sessions: { list: listarSessoes } },
};

function sessaoPaga(extra: Record<string, unknown> = {}) {
  return {
    id: "cs_1",
    payment_status: "paid",
    amount_total: 15000,
    payment_intent: "pi_1",
    metadata: { student_id: ALUNO, plan_id: PLANO },
    ...extra,
  };
}

function pedido(assinatura = "assinatura") {
  return new Request("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    body: "{}",
    headers: assinatura ? { "stripe-signature": assinatura } : {},
  });
}

beforeEach(() => {
  pagamentos.length = 0;
  insercoes.length = 0;
  constructEvent.mockReset();
  listarSessoes.mockReset();
  reembolsoDaCobranca.mockReset();
  clienteStripeTeste.mockReset();
  segredoWebhookTeste.mockReset();
  revalidatePath.mockReset();
  clienteStripeTeste.mockReturnValue(stripe);
  segredoWebhookTeste.mockReturnValue("whsec_teste");
  reembolsoDaCobranca.mockResolvedValue(null);
  listarSessoes.mockResolvedValue({ data: [] });
});

describe("webhook da Stripe", () => {
  it("recusa webhook sem cliente, segredo ou assinatura", async () => {
    clienteStripeTeste.mockReturnValue(null);
    expect((await POST(pedido())).status).toBe(503);

    clienteStripeTeste.mockReturnValue(stripe);
    segredoWebhookTeste.mockReturnValue(null);
    expect((await POST(pedido())).status).toBe(503);

    segredoWebhookTeste.mockReturnValue("whsec_teste");
    expect((await POST(pedido(""))).status).toBe(503);

    expect(insercoes).toHaveLength(0);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("recusa assinatura inválida", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("assinatura");
    });

    const resposta = await POST(pedido());

    expect(resposta.status).toBe(400);
    expect(insercoes).toHaveLength(0);
  });

  it("não grava sessão que não foi paga", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      created: 1_700_000_000,
      data: { object: sessaoPaga({ payment_status: "unpaid" }) },
    });

    const resposta = await POST(pedido());

    expect(resposta.status).toBe(200);
    expect(insercoes).toHaveLength(0);
  });

  it("não grava sessão incompleta", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      created: 1_700_000_000,
      data: {
        object: sessaoPaga({
          payment_intent: null,
          metadata: { student_id: "nao-uuid", plan_id: PLANO },
        }),
      },
    });

    expect((await POST(pedido())).status).toBe(500);

    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      created: 1_700_000_000,
      data: { object: sessaoPaga({ amount_total: 0 }) },
    });

    expect((await POST(pedido())).status).toBe(500);
    expect(insercoes).toHaveLength(0);
  });

  it("grava o recebimento uma vez para a sessão e para o payment intent", async () => {
    const sessao = sessaoPaga();
    listarSessoes.mockResolvedValue({ data: [sessao] });
    constructEvent
      .mockReturnValueOnce({
        type: "checkout.session.completed",
        created: 1_700_000_000,
        data: { object: sessao },
      })
      .mockReturnValueOnce({
        type: "payment_intent.succeeded",
        created: 1_700_000_000,
        data: { object: { id: "pi_1" } },
      });

    expect((await POST(pedido())).status).toBe(200);
    expect((await POST(pedido())).status).toBe(200);

    const recebimentos = pagamentos.filter(
      (item) => item.kind === "recebimento"
    );
    expect(recebimentos).toHaveLength(1);
    expect(recebimentos[0]).toMatchObject({
      student_id: ALUNO,
      plan_id: PLANO,
      amount_cents: 15000,
      method: "cartao",
      stripe_checkout_session_id: "cs_1",
      stripe_payment_intent_id: "pi_1",
    });
  });

  it("grava um único estorno quando o reembolso se repete", async () => {
    pagamentos.push({
      id: "33333333-3333-4333-8333-333333333333",
      student_id: ALUNO,
      plan_id: PLANO,
      amount_cents: 15000,
      kind: "recebimento",
      method: "cartao",
      stripe_payment_intent_id: "pi_1",
    });
    reembolsoDaCobranca.mockResolvedValue({
      id: "re_1",
      created: 1_700_000_000,
      status: "succeeded",
    });
    constructEvent.mockReturnValue({
      type: "charge.refunded",
      created: 1_700_000_000,
      data: { object: { payment_intent: "pi_1" } },
    });

    expect((await POST(pedido())).status).toBe(200);
    expect((await POST(pedido())).status).toBe(200);

    expect(pagamentos.filter((item) => item.kind === "estorno")).toHaveLength(
      1
    );
    expect(insercoes.filter((item) => item.kind === "estorno")).toHaveLength(1);
  });

  it("grava o estorno junto do recebimento quando o reembolso chega antes", async () => {
    reembolsoDaCobranca.mockResolvedValue({
      id: "re_1",
      created: 1_700_000_100,
      status: "succeeded",
    });
    constructEvent.mockReturnValueOnce({
      type: "charge.refunded",
      created: 1_700_000_100,
      data: { object: { payment_intent: "pi_1" } },
    });

    expect((await POST(pedido())).status).toBe(200);
    expect(insercoes).toHaveLength(0);

    constructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      created: 1_700_000_000,
      data: { object: sessaoPaga() },
    });

    expect((await POST(pedido())).status).toBe(200);

    expect(
      pagamentos.filter((item) => item.kind === "recebimento")
    ).toHaveLength(1);
    const estornos = pagamentos.filter((item) => item.kind === "estorno");
    expect(estornos).toHaveLength(1);
    expect(estornos[0]).toMatchObject({
      student_id: ALUNO,
      plan_id: PLANO,
      amount_cents: 15000,
      method: "cartao",
      stripe_refund_id: "re_1",
    });
  });

  it("não cria segundo estorno quando o recebimento já enxerga o reembolso", async () => {
    reembolsoDaCobranca.mockResolvedValue({
      id: "re_1",
      created: 1_700_000_100,
      status: "succeeded",
    });
    const evento = {
      type: "checkout.session.completed",
      created: 1_700_000_000,
      data: { object: sessaoPaga() },
    };
    constructEvent.mockReturnValue(evento);

    expect((await POST(pedido())).status).toBe(200);
    expect((await POST(pedido())).status).toBe(200);

    expect(pagamentos.filter((item) => item.kind === "estorno")).toHaveLength(
      1
    );
    expect(insercoes.filter((item) => item.kind === "estorno")).toHaveLength(1);
  });
});
