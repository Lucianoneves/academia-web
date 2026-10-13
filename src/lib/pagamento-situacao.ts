export type TipoPlano =
  "avulso" | "mensal" | "trimestral" | "semestral" | "anual";

export type SituacaoPagamento =
  | "em_dia"
  | "atrasado"
  | "sem_pagamento"
  | "credito_disponivel"
  | "credito_utilizado";

export type Lancamento = {
  id: string;
  plano: TipoPlano;
  pagoEm: string;
  criadoEm: string;
  tipo: "recebimento" | "estorno";
  estornaId: string | null;
};

const rotulos: Record<SituacaoPagamento, string> = {
  em_dia: "Em dia",
  atrasado: "Atrasado",
  sem_pagamento: "Sem pagamento",
  credito_disponivel: "Crédito disponível",
  credito_utilizado: "Crédito utilizado",
};

const mesesDoPlano: Record<Exclude<TipoPlano, "avulso">, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

type Cobertura =
  | { tipo: "nenhuma" }
  | {
      tipo: "prazo";
      plano: Exclude<TipoPlano, "avulso">;
      inicio: string;
      fim: string;
    }
  | { tipo: "avulso" };

export function rotuloSituacao(situacao: SituacaoPagamento) {
  return rotulos[situacao];
}

export function formatarDataIso(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function somarDias(iso: string, dias: number) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function ultimoDiaDoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function dataIso(ano: number, mes: number, dia: number) {
  return new Date(Date.UTC(ano, mes - 1, dia)).toISOString().slice(0, 10);
}

function inicioDoPeriodoSeguinte(inicio: string, meses: number) {
  const [ano, mes, dia] = inicio.split("-").map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const anoAlvo = alvo.getUTCFullYear();
  const mesAlvo = alvo.getUTCMonth() + 1;

  if (dia <= ultimoDiaDoMes(anoAlvo, mesAlvo)) {
    return dataIso(anoAlvo, mesAlvo, dia);
  }

  return dataIso(anoAlvo, mesAlvo + 1, 1);
}

function fimDoPeriodo(inicio: string, meses: number) {
  return somarDias(inicioDoPeriodoSeguinte(inicio, meses), -1);
}

function situacaoNaData(cobertura: Cobertura, data: string): SituacaoPagamento {
  if (cobertura.tipo === "nenhuma") return "sem_pagamento";
  if (cobertura.tipo === "avulso") return "credito_disponivel";
  if (data < cobertura.inicio) return "sem_pagamento";
  if (data <= cobertura.fim) return "em_dia";
  return "atrasado";
}

export function analisarPagamentos(
  lancamentos: Lancamento[],
  hoje: string,
  creditosUsados: ReadonlySet<string> = new Set()
) {
  const estornados = new Set(
    lancamentos
      .filter((item) => item.tipo === "estorno" && item.estornaId)
      .map((item) => item.estornaId as string)
  );

  const recebimentos = lancamentos
    .filter((item) => item.tipo === "recebimento" && !estornados.has(item.id))
    .sort(
      (a, b) =>
        a.pagoEm.localeCompare(b.pagoEm) || a.criadoEm.localeCompare(b.criadoEm)
    );

  const efeitos = new Map<string, string>();
  let cobertura: Cobertura = { tipo: "nenhuma" };
  let creditoAvulsoId: string | null = null;

  for (const item of recebimentos) {
    if (item.plano === "avulso") {
      cobertura = { tipo: "avulso" };
      creditoAvulsoId = item.id;
      efeitos.set(item.id, "Crédito de 1 aula.");
      continue;
    }

    creditoAvulsoId = null;

    const meses = mesesDoPlano[item.plano];
    const antes = situacaoNaData(cobertura, item.pagoEm);
    const mesmoTipo =
      cobertura.tipo === "prazo" && cobertura.plano === item.plano;

    if (antes === "em_dia" && mesmoTipo && cobertura.tipo === "prazo") {
      const inicio = somarDias(cobertura.fim, 1);
      const fim = fimDoPeriodo(inicio, meses);
      cobertura = {
        tipo: "prazo",
        plano: item.plano,
        inicio: cobertura.inicio,
        fim,
      };
      efeitos.set(item.id, `Estende a cobertura até ${formatarDataIso(fim)}.`);
      continue;
    }

    const fim = fimDoPeriodo(item.pagoEm, meses);
    cobertura = { tipo: "prazo", plano: item.plano, inicio: item.pagoEm, fim };
    efeitos.set(
      item.id,
      `Cobre de ${formatarDataIso(item.pagoEm)} até ${formatarDataIso(fim)}.`
    );
  }

  for (const item of lancamentos) {
    if (item.tipo !== "estorno" || !item.estornaId) continue;
    const origem = lancamentos.find((linha) => linha.id === item.estornaId);
    const data = origem ? formatarDataIso(origem.pagoEm) : "origem";
    efeitos.set(item.id, `Anula o recebimento de ${data}.`);
  }

  for (const id of estornados) {
    efeitos.set(id, "Estornado. Este valor não cobre o aluno.");
  }

  let situacao = situacaoNaData(cobertura, hoje);

  if (
    situacao === "credito_disponivel" &&
    creditoAvulsoId &&
    creditosUsados.has(creditoAvulsoId)
  ) {
    situacao = "credito_utilizado";
    creditoAvulsoId = null;
  }

  if (situacao !== "credito_disponivel") creditoAvulsoId = null;

  const planoAtivo =
    situacao === "em_dia" && cobertura.tipo === "prazo"
      ? cobertura.plano
      : situacao === "credito_disponivel" || situacao === "credito_utilizado"
        ? "avulso"
        : null;

  return { situacao, planoAtivo, efeitos, creditoAvulsoId };
}
