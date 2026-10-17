import "server-only";

import {
  compararFila,
  rotuloSituacaoAvaliacao,
  situacaoDaValidade,
  validadeDe,
  type FiltroAvaliacao,
  type SituacaoAtencao,
  type SituacaoAvaliacao,
} from "@/lib/avaliacao";
import { requireAdmin } from "@/lib/auth";
import { formatarDataIso } from "@/lib/pagamento-situacao";
import { createSessionClient } from "@/lib/supabase/server";
import { hojeSaoPaulo } from "@/lib/validacao";
import { formatarTelefone } from "@/app/painel/alunos/tipos";

export type RegistroAvaliacao = {
  id: string;
  quando: string;
  validade: string;
  observacoes: string | null;
};

export type MarcacaoAvaliacao = {
  dia: string;
  hora: string;
};

export type AvaliacaoFicha = {
  situacao: SituacaoAvaliacao;
  rotulo: string;
  validade: string | null;
  historico: RegistroAvaliacao[];
  marcacao: MarcacaoAvaliacao | null;
};

export type AlunoFila = {
  id: string;
  nome: string;
  telefone: string;
  situacao: SituacaoAtencao;
  rotulo: string;
  validade: string | null;
  marcacao: string | null;
};

type LinhaAvaliacao = {
  id: string;
  student_id: string;
  evaluated_on: string;
  notes: string | null;
  created_at: string;
};

type AlunoAtivo = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
};

type LinhaMarcacao = {
  student_id: string;
  scheduled_on: string;
  starts_at: string;
};

const FALHA = "Não foi possível carregar as avaliações.";

async function lerLinhas(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  alunoId?: string
) {
  const linhas: LinhaAvaliacao[] = [];
  const tamanho = 1000;

  for (let inicio = 0; ; inicio += tamanho) {
    let consulta = supabase
      .from("medical_evaluations")
      .select("id, student_id, evaluated_on, notes, created_at");

    if (alunoId) consulta = consulta.eq("student_id", alunoId);

    const { data, error } = await consulta
      .order("created_at", { ascending: false })
      .range(inicio, inicio + tamanho - 1);
    if (error) return { ok: false as const, erro: FALHA };

    const lote = (data ?? []) as LinhaAvaliacao[];
    linhas.push(...lote);
    if (lote.length < tamanho) break;
  }

  return { ok: true as const, linhas };
}

function dataCurta(valor: string) {
  return valor.slice(0, 10);
}

function horaCurta(valor: string) {
  return valor.slice(0, 5);
}

function tabelaAusente(codigo: string, texto: string) {
  return (
    codigo === "42P01" ||
    codigo === "PGRST205" ||
    texto.includes("evaluation_appointments")
  );
}

function rotuloMarcacao(dia: string, hora: string) {
  return `${formatarDataIso(dia)} às ${hora}`;
}

async function lerMarcacoes(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  alunoId?: string
) {
  const linhas: LinhaMarcacao[] = [];
  const tamanho = 1000;

  for (let inicio = 0; ; inicio += tamanho) {
    let consulta = supabase
      .from("evaluation_appointments")
      .select("student_id, scheduled_on, starts_at");

    if (alunoId) consulta = consulta.eq("student_id", alunoId);

    const { data, error } = await consulta.range(inicio, inicio + tamanho - 1);

    if (error) {
      if (tabelaAusente(error.code ?? "", error.message)) {
        return { ok: true as const, linhas, pendente: true };
      }
      return { ok: false as const, erro: FALHA };
    }

    const lote = (data ?? []) as LinhaMarcacao[];
    linhas.push(...lote);
    if (lote.length < tamanho) break;
  }

  return { ok: true as const, linhas, pendente: false };
}

function marcacaoDe(
  linha: LinhaMarcacao | undefined
): MarcacaoAvaliacao | null {
  if (!linha) return null;
  return {
    dia: dataCurta(linha.scheduled_on),
    hora: horaCurta(linha.starts_at),
  };
}

function maisRecente(linhas: LinhaAvaliacao[]) {
  const mapa = new Map<string, LinhaAvaliacao>();

  for (const linha of linhas) {
    const atual = mapa.get(linha.student_id);
    if (!atual || linha.created_at > atual.created_at) {
      mapa.set(linha.student_id, linha);
    }
  }

  return mapa;
}

function montarHistorico(
  linhas: LinhaAvaliacao[],
  hoje: string,
  marcacao: MarcacaoAvaliacao | null
): AvaliacaoFicha {
  const ordenadas = [...linhas].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  const historico = ordenadas.map((linha) => {
    const validade = validadeDe(dataCurta(linha.evaluated_on));
    return {
      id: linha.id,
      quando: formatarDataIso(dataCurta(linha.evaluated_on)),
      validade: formatarDataIso(validade),
      observacoes: linha.notes,
    };
  });
  const primeira = ordenadas[0];

  if (!primeira) {
    return {
      situacao: "sem_avaliacao",
      rotulo: rotuloSituacaoAvaliacao("sem_avaliacao"),
      validade: null,
      historico,
      marcacao,
    };
  }

  const validade = validadeDe(dataCurta(primeira.evaluated_on));
  const situacao = situacaoDaValidade(validade, hoje);

  return {
    situacao,
    rotulo: rotuloSituacaoAvaliacao(situacao),
    validade: formatarDataIso(validade),
    historico,
    marcacao,
  };
}

export async function avaliacaoDoAluno(
  alunoId: string
): Promise<
  { ok: true; avaliacao: AvaliacaoFicha } | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [lidas, marcadas] = await Promise.all([
    lerLinhas(supabase, alunoId),
    lerMarcacoes(supabase, alunoId),
  ]);
  if (!lidas.ok) return lidas;
  if (!marcadas.ok) return marcadas;

  const marcada = marcacaoDe(marcadas.linhas[0]);

  return {
    ok: true,
    avaliacao: montarHistorico(lidas.linhas, hojeSaoPaulo(), marcada),
  };
}

export async function filaAvaliacoes(
  filtro: FiltroAvaliacao
): Promise<
  | { ok: true; ativos: number; alunos: AlunoFila[] }
  | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [alunos, lidas, marcadas] = await Promise.all([
    supabase.from("students").select("id, name, phone, active"),
    lerLinhas(supabase),
    lerMarcacoes(supabase),
  ]);

  if (alunos.error || !lidas.ok || !marcadas.ok) {
    return { ok: false, erro: FALHA };
  }

  const hoje = hojeSaoPaulo();
  const recentes = maisRecente(lidas.linhas);
  const marcacoes = new Map(
    marcadas.linhas.map((linha) => [linha.student_id, marcacaoDe(linha)])
  );
  const ativos = ((alunos.data ?? []) as AlunoAtivo[]).filter(
    (aluno) => aluno.active
  );
  const fila: AlunoFila[] = [];

  for (const aluno of ativos) {
    const registro = recentes.get(aluno.id);
    const situacao: SituacaoAvaliacao = registro
      ? situacaoDaValidade(validadeDe(dataCurta(registro.evaluated_on)), hoje)
      : "sem_avaliacao";

    if (situacao === "em_dia") continue;
    if (filtro !== "todos" && situacao !== filtro) continue;

    const validade = registro
      ? validadeDe(dataCurta(registro.evaluated_on))
      : null;
    const marcada = marcacoes.get(aluno.id);

    fila.push({
      id: aluno.id,
      nome: aluno.name,
      telefone: formatarTelefone(aluno.phone),
      situacao,
      rotulo: rotuloSituacaoAvaliacao(situacao),
      validade,
      marcacao: marcada ? rotuloMarcacao(marcada.dia, marcada.hora) : null,
    });
  }

  fila.sort(compararFila);

  return { ok: true, ativos: ativos.length, alunos: fila };
}

export async function rotulosAvaliacaoPorAluno(): Promise<
  { ok: true; rotulos: Map<string, string> } | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const lidas = await lerLinhas(supabase);
  if (!lidas.ok) return lidas;

  const hoje = hojeSaoPaulo();
  const rotulosPorAluno = new Map<string, string>();

  for (const [alunoId, registro] of maisRecente(lidas.linhas)) {
    const situacao = situacaoDaValidade(
      validadeDe(dataCurta(registro.evaluated_on)),
      hoje
    );
    rotulosPorAluno.set(alunoId, rotuloSituacaoAvaliacao(situacao));
  }

  return { ok: true, rotulos: rotulosPorAluno };
}
