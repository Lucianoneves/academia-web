export type FormaPagamento = "dinheiro" | "cartao";

export type MovimentoMes = {
  id: string;
  alunoId: string;
  aluno: string;
  plano: string;
  pagoEm: string;
  criadoEm: string;
  tipo: "recebimento" | "estorno";
  forma: FormaPagamento;
  centavos: number;
  efeito: string;
};

export type TotaisMes = {
  entrou: number;
  estornado: number;
  liquido: number;
};

export type DiaMes = {
  dia: string;
  entrou: number;
  estornado: number;
};

export type ResumoMes = {
  totais: TotaisMes;
  dinheiro: TotaisMes;
  cartao: TotaisMes;
  dias: DiaMes[];
  lista: MovimentoMes[];
};

const MES = /^(\d{4})-(\d{2})$/;

function totaisVazios(): TotaisMes {
  return { entrou: 0, estornado: 0, liquido: 0 };
}

function somar(
  totais: TotaisMes,
  tipo: MovimentoMes["tipo"],
  centavos: number
) {
  if (tipo === "recebimento") totais.entrou += centavos;
  else totais.estornado += centavos;
  totais.liquido = totais.entrou - totais.estornado;
}

export function mesDeHoje(hoje: string) {
  return hoje.slice(0, 7);
}

export function normalizarMes(valor: string | undefined, hoje: string) {
  const atual = mesDeHoje(hoje);
  const match = valor?.match(MES);
  if (!match) return atual;

  const mes = Number(match[2]);
  if (mes < 1 || mes > 12) return atual;

  const candidato = `${match[1]}-${match[2]}`;
  if (candidato > atual) return atual;
  return candidato;
}

export function deslocarMes(mes: string, delta: number) {
  const [ano, numero] = mes.split("-").map(Number);
  const data = new Date(Date.UTC(ano, numero - 1 + delta, 1));
  const mesAlvo = String(data.getUTCMonth() + 1).padStart(2, "0");
  return `${data.getUTCFullYear()}-${mesAlvo}`;
}

export function mesSeguinteFechado(mes: string, hoje: string) {
  return deslocarMes(mes, 1) > mesDeHoje(hoje);
}

export function hrefMes(mes: string, hoje: string) {
  if (mes === mesDeHoje(hoje)) return "/painel/financeiro";
  return `/painel/financeiro?mes=${mes}`;
}

export function hrefHistoricoDesdeResumo(alunoId: string, mes: string) {
  const params = new URLSearchParams({ de: "financeiro", mes });
  return `/painel/pagamentos/${alunoId}?${params}`;
}

export function voltaDoHistorico(
  origem: string | undefined,
  mes: string | undefined,
  hoje: string
) {
  if (origem === "financeiro") {
    const escolhido = normalizarMes(mes, hoje);
    return {
      href: hrefMes(escolhido, hoje),
      rotulo: "Voltar para o resumo financeiro",
      area: "financeiro" as const,
    };
  }

  return {
    href: "/painel/pagamentos",
    rotulo: "Voltar para pagamentos",
    area: "pagamentos" as const,
  };
}

export function rotuloMes(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, numero - 1, 1)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function montarResumo(
  movimentos: MovimentoMes[],
  mes: string
): ResumoMes {
  const doMes = movimentos.filter((item) => item.pagoEm.slice(0, 7) === mes);
  const totais = totaisVazios();
  const dinheiro = totaisVazios();
  const cartao = totaisVazios();
  const porDia = new Map<string, DiaMes>();

  for (const item of doMes) {
    somar(totais, item.tipo, item.centavos);
    somar(
      item.forma === "cartao" ? cartao : dinheiro,
      item.tipo,
      item.centavos
    );

    const dia = porDia.get(item.pagoEm) ?? {
      dia: item.pagoEm,
      entrou: 0,
      estornado: 0,
    };
    if (item.tipo === "recebimento") dia.entrou += item.centavos;
    else dia.estornado += item.centavos;
    porDia.set(item.pagoEm, dia);
  }

  const lista = [...doMes].sort(
    (a, b) =>
      b.pagoEm.localeCompare(a.pagoEm) ||
      b.criadoEm.localeCompare(a.criadoEm) ||
      b.id.localeCompare(a.id)
  );

  return {
    totais,
    dinheiro,
    cartao,
    dias: [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia)),
    lista,
  };
}
