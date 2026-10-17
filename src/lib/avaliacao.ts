export type SituacaoAvaliacao =
  "em_dia" | "a_vencer" | "vencida" | "sem_avaliacao";

export type FiltroAvaliacao =
  "todos" | "a_vencer" | "vencida" | "sem_avaliacao";

export type SituacaoAtencao = Exclude<SituacaoAvaliacao, "em_dia">;

const rotulos: Record<SituacaoAvaliacao, string> = {
  em_dia: "Em dia",
  a_vencer: "A vencer",
  vencida: "Vencida",
  sem_avaliacao: "Sem avaliação",
};

const slugs: Record<FiltroAvaliacao, string | null> = {
  todos: null,
  a_vencer: "a-vencer",
  vencida: "vencida",
  sem_avaliacao: "sem-avaliacao",
};

const ordemGrupo: Record<SituacaoAtencao, number> = {
  vencida: 0,
  a_vencer: 1,
  sem_avaliacao: 2,
};

export function rotuloSituacaoAvaliacao(situacao: SituacaoAvaliacao) {
  return rotulos[situacao];
}

export function lerFiltroAvaliacao(valor: string | undefined): FiltroAvaliacao {
  if (valor === "a-vencer") return "a_vencer";
  if (valor === "vencida") return "vencida";
  if (valor === "sem-avaliacao") return "sem_avaliacao";
  return "todos";
}

export function hrefFiltroAvaliacao(filtro: FiltroAvaliacao) {
  const slug = slugs[filtro];
  return slug ? `/painel/avaliacoes?filtro=${slug}` : "/painel/avaliacoes";
}

export function hrefFichaDesdeFila(alunoId: string, filtro: FiltroAvaliacao) {
  const params = new URLSearchParams({ de: "avaliacoes" });
  const slug = slugs[filtro];
  if (slug) params.set("filtro", slug);
  return `/painel/alunos/${alunoId}?${params}`;
}

export function voltaDaFicha(
  origem: string | undefined,
  filtro: string | undefined
) {
  if (origem === "avaliacoes") {
    return {
      href: hrefFiltroAvaliacao(lerFiltroAvaliacao(filtro)),
      rotulo: "Voltar para avaliações médicas",
      area: "avaliacoes" as const,
    };
  }

  return {
    href: "/painel/alunos",
    rotulo: "Voltar para alunos",
    area: "lista" as const,
  };
}

function partes(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

function isoDe(ano: number, mes: number, dia: number) {
  const mesTexto = String(mes).padStart(2, "0");
  const diaTexto = String(dia).padStart(2, "0");
  return `${ano}-${mesTexto}-${diaTexto}`;
}

function ultimoDia(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function validadeDe(avaliadaEm: string) {
  const { ano, mes, dia } = partes(avaliadaEm);
  const alvo = new Date(Date.UTC(ano, mes - 1 + 6, 1));
  const anoAlvo = alvo.getUTCFullYear();
  const mesAlvo = alvo.getUTCMonth() + 1;
  return isoDe(anoAlvo, mesAlvo, Math.min(dia, ultimoDia(anoAlvo, mesAlvo)));
}

export function diasEntre(inicio: string, fim: string) {
  const a = partes(inicio);
  const b = partes(fim);
  const ms =
    Date.UTC(b.ano, b.mes - 1, b.dia) - Date.UTC(a.ano, a.mes - 1, a.dia);
  return Math.round(ms / 86_400_000);
}

export function situacaoDaValidade(
  validade: string,
  hoje: string
): Exclude<SituacaoAvaliacao, "sem_avaliacao"> {
  if (hoje > validade) return "vencida";
  return diasEntre(hoje, validade) > 15 ? "em_dia" : "a_vencer";
}

export function compararFila<
  T extends {
    nome: string;
    situacao: SituacaoAtencao;
    validade: string | null;
  },
>(a: T, b: T) {
  const grupo = ordemGrupo[a.situacao] - ordemGrupo[b.situacao];
  if (grupo !== 0) return grupo;

  if (a.situacao === "a_vencer" && b.situacao === "a_vencer") {
    const data = (a.validade ?? "").localeCompare(b.validade ?? "");
    if (data !== 0) return data;
  }

  return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
}
