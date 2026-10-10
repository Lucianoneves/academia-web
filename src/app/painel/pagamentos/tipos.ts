import type { SituacaoPagamento } from "@/lib/pagamento-situacao";

export type LinhaHistorico = {
  id: string;
  data: string;
  plano: string;
  valor: string;
  forma: string;
  efeito: string;
  podeEstornar: boolean;
};

export type PagamentoAluno = {
  situacao: SituacaoPagamento;
  rotulo: string;
  planoAtivo: string | null;
  linhas: LinhaHistorico[];
};

export type AlunoPagamento = {
  id: string;
  nome: string;
  ativo: boolean;
  situacao: SituacaoPagamento;
  rotulo: string;
  planoAtivo: string | null;
};

export type OpcaoAluno = {
  id: string;
  nome: string;
};

export type OpcaoPlano = {
  id: string;
  nome: string;
  precoCentavos: number;
};

export type OpcoesLancamento = {
  alunos: OpcaoAluno[];
  planos: OpcaoPlano[];
  hoje: string;
};
