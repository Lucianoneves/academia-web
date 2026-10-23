import { describe, expect, it } from "vitest";
import {
  deslocarMes,
  hrefHistoricoDesdeResumo,
  hrefMes,
  mesSeguinteFechado,
  montarResumo,
  normalizarMes,
  voltaDoHistorico,
  type MovimentoMes,
} from "@/lib/resumo-financeiro";

const HOJE = "2026-10-22";

function movimento(
  parcial: Partial<MovimentoMes> & Pick<MovimentoMes, "id" | "pagoEm" | "tipo">
): MovimentoMes {
  return {
    alunoId: "aluno-1",
    aluno: "Ana",
    plano: "Mensal",
    criadoEm: `${parcial.pagoEm}T12:00:00.000Z`,
    forma: "dinheiro",
    centavos: 10000,
    efeito:
      parcial.tipo === "estorno"
        ? "Anula o recebimento de 01/10/2026."
        : "Cobre de 01/10/2026 até 31/10/2026.",
    ...parcial,
  };
}

describe("normalizarMes", () => {
  it("abre o mês atual quando o parâmetro falta, é inválido ou é futuro", () => {
    expect(normalizarMes(undefined, HOJE)).toBe("2026-10");
    expect(normalizarMes("2026-13", HOJE)).toBe("2026-10");
    expect(normalizarMes("amanha", HOJE)).toBe("2026-10");
    expect(normalizarMes("2026-11", HOJE)).toBe("2026-10");
  });

  it("mantém um mês passado", () => {
    expect(normalizarMes("2026-09", HOJE)).toBe("2026-09");
  });
});

describe("navegação do mês", () => {
  it("fecha o mês seguinte só quando ele ainda não chegou", () => {
    expect(mesSeguinteFechado("2026-10", HOJE)).toBe(true);
    expect(mesSeguinteFechado("2026-09", HOJE)).toBe(false);
    expect(deslocarMes("2026-12", 1)).toBe("2027-01");
    expect(deslocarMes("2026-01", -1)).toBe("2025-12");
  });

  it("guarda o mês passado no endereço e omite o mês atual", () => {
    expect(hrefMes("2026-10", HOJE)).toBe("/painel/financeiro");
    expect(hrefMes("2026-09", HOJE)).toBe("/painel/financeiro?mes=2026-09");
  });
});

describe("montarResumo", () => {
  const movimentos = [
    movimento({
      id: "rec-out",
      pagoEm: "2026-10-02",
      criadoEm: "2026-10-02T10:00:00.000Z",
      tipo: "recebimento",
      forma: "dinheiro",
      centavos: 15000,
      aluno: "Bia Inativa",
      efeito: "Estornado. Este valor não cobre o aluno.",
    }),
    movimento({
      id: "rec-out-tarde",
      pagoEm: "2026-10-02",
      criadoEm: "2026-10-02T18:00:00.000Z",
      tipo: "recebimento",
      forma: "cartao",
      centavos: 8000,
    }),
    movimento({
      id: "est-nov",
      pagoEm: "2026-11-03",
      tipo: "estorno",
      forma: "dinheiro",
      centavos: 15000,
      efeito: "Anula o recebimento de 02/10/2026.",
    }),
    movimento({
      id: "est-out",
      pagoEm: "2026-10-20",
      tipo: "estorno",
      forma: "cartao",
      centavos: 5000,
      efeito: "Anula o recebimento de 01/09/2026.",
    }),
    movimento({
      id: "set",
      pagoEm: "2026-09-30",
      tipo: "recebimento",
      centavos: 99900,
    }),
  ];

  it("deixa o recebimento em outubro e o estorno em novembro", () => {
    const outubro = montarResumo(movimentos, "2026-10");
    const novembro = montarResumo(movimentos, "2026-11");

    expect(outubro.totais).toEqual({
      entrou: 23000,
      estornado: 5000,
      liquido: 18000,
    });
    expect(outubro.dinheiro).toEqual({
      entrou: 15000,
      estornado: 0,
      liquido: 15000,
    });
    expect(outubro.cartao).toEqual({
      entrou: 8000,
      estornado: 5000,
      liquido: 3000,
    });
    expect(novembro.totais).toEqual({
      entrou: 0,
      estornado: 15000,
      liquido: -15000,
    });
    expect(novembro.lista.map((item) => item.id)).toEqual(["est-nov"]);
  });

  it("mostra só os dias com movimento, do começo ao fim, e a lista ao contrário", () => {
    const outubro = montarResumo(movimentos, "2026-10");

    expect(outubro.dias).toEqual([
      { dia: "2026-10-02", entrou: 23000, estornado: 0 },
      { dia: "2026-10-20", entrou: 0, estornado: 5000 },
    ]);
    expect(outubro.lista.map((item) => item.id)).toEqual([
      "est-out",
      "rec-out-tarde",
      "rec-out",
    ]);
    expect(outubro.lista[2]?.efeito).toBe(
      "Estornado. Este valor não cobre o aluno."
    );
    expect(outubro.lista[2]?.aluno).toBe("Bia Inativa");
  });
});

describe("volta do histórico", () => {
  it("reabre o mês do resumo e preserva o fluxo de pagamentos", () => {
    expect(voltaDoHistorico("financeiro", "2026-09", HOJE)).toEqual({
      href: "/painel/financeiro?mes=2026-09",
      rotulo: "Voltar para o resumo financeiro",
      area: "financeiro",
    });
    expect(voltaDoHistorico("financeiro", "2027-01", HOJE).href).toBe(
      "/painel/financeiro"
    );
    expect(voltaDoHistorico(undefined, undefined, HOJE)).toEqual({
      href: "/painel/pagamentos",
      rotulo: "Voltar para pagamentos",
      area: "pagamentos",
    });
    expect(hrefHistoricoDesdeResumo("aluno-1", "2026-09")).toBe(
      "/painel/pagamentos/aluno-1?de=financeiro&mes=2026-09"
    );
  });
});
