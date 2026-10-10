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
  duracaoDias: number | null;
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

const diasPadrao: Record<Exclude<TipoPlano, "avulso">, number> = {
  mensal: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
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

function fimDoPeriodo(inicio: string, dias: number) {
  return somarDias(inicio, dias - 1);
}

function situacaoNaData(cobertura: Cobertura, data: string): SituacaoPagamento {
  if (cobertura.tipo === "nenhuma") return "sem_pagamento";
  if (cobertura.tipo === "avulso") return "credito_disponivel";
  if (data < cobertura.inicio) return "sem_pagamento";
  if (data <= cobertura.fim) return "em_dia";
  return "atrasado";
}

function duracao(lancamento: Lancamento) {
  if (lancamento.plano === "avulso") return null;
  return lancamento.duracaoDias ?? diasPadrao[lancamento.plano];
}

export function analisarPagamentos(lancamentos: Lancamento[], hoje: string) {
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

  for (const item of recebimentos) {
    if (item.plano === "avulso") {
      cobertura = { tipo: "avulso" };
      efeitos.set(item.id, "Crédito de 1 aula.");
      continue;
    }

    const dias = duracao(item);
    if (!dias) continue;

    const antes = situacaoNaData(cobertura, item.pagoEm);
    const mesmoTipo =
      cobertura.tipo === "prazo" && cobertura.plano === item.plano;

    if (antes === "em_dia" && mesmoTipo && cobertura.tipo === "prazo") {
      const inicio = somarDias(cobertura.fim, 1);
      const fim = fimDoPeriodo(inicio, dias);
      cobertura = {
        tipo: "prazo",
        plano: item.plano,
        inicio: cobertura.inicio,
        fim,
      };
      efeitos.set(item.id, `Estende a cobertura até ${formatarDataIso(fim)}.`);
      continue;
    }

    const fim = fimDoPeriodo(item.pagoEm, dias);
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

  const situacao = situacaoNaData(cobertura, hoje);
  const planoAtivo =
    situacao === "em_dia" && cobertura.tipo === "prazo"
      ? cobertura.plano
      : situacao === "credito_disponivel"
        ? "avulso"
        : null;

  return { situacao, planoAtivo, efeitos };
}
