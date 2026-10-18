import { formatarReais } from "@/lib/dinheiro";
import { planosCadastro } from "@/lib/validacao";

export const PLANO_FORA_DE_VENDA = "Esse plano não está à venda.";
export const ATIVAR_SEM_PRECO =
  "Defina um preço maior que zero antes de ativar.";
export const NENHUM_PLANO_A_VENDA =
  "Nenhum plano à venda. Ative um plano com preço maior que zero.";

export type TipoPlano = (typeof planosCadastro)[number]["value"];

export type PlanoEscolha = {
  kind: TipoPlano;
  nome: string;
  precoCentavos: number;
  ativo: boolean;
};

export function planoAVenda(plano: PlanoEscolha) {
  return plano.ativo && plano.precoCentavos > 0;
}

export function situacaoDoPlano(
  plano: Pick<PlanoEscolha, "ativo" | "precoCentavos">
) {
  if (!plano.ativo) return "Inativo";
  if (plano.precoCentavos <= 0) return "Ainda não está à venda";
  return "À venda";
}

export function rotuloEscolha(plano: PlanoEscolha) {
  if (planoAVenda(plano)) {
    return `${plano.nome} — ${formatarReais(plano.precoCentavos)}`;
  }

  return `${plano.nome} — ${situacaoDoPlano(plano)}`;
}

export function rotuloComPreco(nome: string, precoCentavos: number) {
  return `${nome} — ${formatarReais(precoCentavos)}`;
}

const ordem = new Map(
  planosCadastro.map((plano, indice) => [plano.value, indice])
);

export function escolhasDePlano(planos: PlanoEscolha[], atual: string | null) {
  const lista = [...planos];

  if (
    atual &&
    planosCadastro.some((plano) => plano.value === atual) &&
    !lista.some((plano) => plano.kind === atual)
  ) {
    const conhecido = planosCadastro.find((plano) => plano.value === atual);
    if (conhecido) {
      lista.push({
        kind: conhecido.value,
        nome: conhecido.label,
        precoCentavos: 0,
        ativo: false,
      });
    }
  }

  return lista.sort(
    (a, b) => (ordem.get(a.kind) ?? 0) - (ordem.get(b.kind) ?? 0)
  );
}

export function dicaPlano(plano: PlanoEscolha | undefined) {
  if (!plano) return null;
  if (planoAVenda(plano)) {
    return `Valor do plano: ${formatarReais(plano.precoCentavos)}. A escolha não lança pagamento.`;
  }

  return "A escolha não lança pagamento. Este plano ainda não está à venda.";
}
