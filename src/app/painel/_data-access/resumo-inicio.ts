import "server-only";

import { filaAvaliacoes } from "@/app/painel/avaliacoes/_data-access/avaliacoes";
import { horaCurta, rotuloCategoria } from "@/lib/agenda";
import { requireAdmin } from "@/lib/auth";
import {
  analisarPagamentos,
  type Lancamento,
  type SituacaoPagamento,
  type TipoPlano,
} from "@/lib/pagamento-situacao";
import { createSessionClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, planosCadastro } from "@/lib/validacao";

export type AulaResumo = {
  id: string;
  nome: string;
  horario: string;
  categoria: string;
};

export type AvaliacaoResumo = {
  id: string;
  nome: string;
  rotulo: string;
};

export type ResumoInicio =
  | {
      ok: true;
      hoje: string;
      ativos: number;
      emDia: number;
      atrasados: number;
      semPagamento: number;
      marcacoesHoje: number;
      avaliacoesAtencao: number;
      categoriasAtivas: number;
      planosAVenda: number;
      aulas: AulaResumo[];
      avaliacoes: AvaliacaoResumo[];
    }
  | { ok: false; erro: string };

const FALHA = "Não foi possível carregar o início.";
const tipos = new Set<string>(planosCadastro.map((plano) => plano.value));

type StudentRow = { id: string; name: string; active: boolean };
type PlanRow = { id: string; kind: string; active: boolean };
type PaymentRow = {
  id: string;
  student_id: string;
  plan_id: string;
  paid_on: string;
  kind: string;
  reverses_payment_id: string | null;
  created_at: string;
};
type MarcacaoRow = {
  id: string;
  student_id: string;
  schedule_id: string;
};
type ScheduleRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  category_id: string;
};
type CategoryRow = { id: string; name: string; active: boolean };

function comoTipo(kind: string): TipoPlano | null {
  return tipos.has(kind) ? (kind as TipoPlano) : null;
}

function contarPrazo(situacoes: SituacaoPagamento[]) {
  return {
    emDia: situacoes.filter((item) => item === "em_dia").length,
    atrasados: situacoes.filter((item) => item === "atrasado").length,
    semPagamento: situacoes.filter((item) => item === "sem_pagamento").length,
  };
}

export async function resumoInicio(): Promise<ResumoInicio> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const hoje = hojeSaoPaulo();
  const [
    alunos,
    planos,
    pagamentos,
    usos,
    marcacoes,
    horarios,
    categorias,
    avaliacoes,
  ] = await Promise.all([
    supabase.from("students").select("id, name, active"),
    supabase.from("plans").select("id, kind, price_cents, active"),
    supabase
      .from("payments")
      .select(
        "id, student_id, plan_id, paid_on, kind, reverses_payment_id, created_at"
      ),
    supabase
      .from("appointments")
      .select("consumed_payment_id")
      .eq("status", "marcado"),
    supabase
      .from("appointments")
      .select("id, student_id, schedule_id")
      .eq("appointment_date", hoje)
      .eq("status", "marcado"),
    supabase
      .from("class_schedules")
      .select("id, starts_at, ends_at, category_id"),
    supabase.from("class_categories").select("id, name, active"),
    filaAvaliacoes("todos"),
  ]);

  if (
    alunos.error ||
    planos.error ||
    pagamentos.error ||
    usos.error ||
    marcacoes.error ||
    horarios.error ||
    categorias.error ||
    !avaliacoes.ok
  ) {
    return { ok: false, erro: FALHA };
  }

  const planosPorId = new Map(
    ((planos.data ?? []) as (PlanRow & { price_cents: number })[]).map(
      (plano) => [plano.id, plano]
    )
  );
  const porAluno = new Map<string, PaymentRow[]>();

  for (const pagamento of (pagamentos.data ?? []) as PaymentRow[]) {
    const lista = porAluno.get(pagamento.student_id) ?? [];
    lista.push(pagamento);
    porAluno.set(pagamento.student_id, lista);
  }

  const creditosUsados = new Set<string>();
  for (const uso of usos.data ?? []) {
    if (uso.consumed_payment_id) creditosUsados.add(uso.consumed_payment_id);
  }

  const todosAlunos = (alunos.data ?? []) as StudentRow[];
  const ativos = todosAlunos.filter((aluno) => aluno.active);
  const nomes = new Map(todosAlunos.map((aluno) => [aluno.id, aluno.name]));
  const situacoes = ativos.map((aluno) => {
    const lancamentos: Lancamento[] = [];

    for (const pagamento of porAluno.get(aluno.id) ?? []) {
      const tipo = comoTipo(planosPorId.get(pagamento.plan_id)?.kind ?? "");
      if (
        !tipo ||
        (pagamento.kind !== "recebimento" && pagamento.kind !== "estorno")
      ) {
        continue;
      }

      lancamentos.push({
        id: pagamento.id,
        plano: tipo,
        pagoEm: pagamento.paid_on.slice(0, 10),
        criadoEm: pagamento.created_at,
        tipo: pagamento.kind,
        estornaId: pagamento.reverses_payment_id,
      });
    }

    return analisarPagamentos(lancamentos, hoje, creditosUsados).situacao;
  });
  const prazo = contarPrazo(situacoes);
  const grade = new Map(
    ((horarios.data ?? []) as ScheduleRow[]).map((horario) => [
      horario.id,
      horario,
    ])
  );
  const nomesCategoria = new Map(
    ((categorias.data ?? []) as CategoryRow[]).map((categoria) => [
      categoria.id,
      rotuloCategoria(categoria.name),
    ])
  );
  const aulas = ((marcacoes.data ?? []) as MarcacaoRow[])
    .map((marcacao) => {
      const horario = grade.get(marcacao.schedule_id);
      const nome = nomes.get(marcacao.student_id) ?? "Aluno";
      const inicio = horario?.starts_at ?? "";
      return {
        id: marcacao.id,
        nome,
        inicio,
        horario: horario
          ? `${horaCurta(horario.starts_at)}–${horaCurta(horario.ends_at)}`
          : "Horário",
        categoria: horario
          ? (nomesCategoria.get(horario.category_id) ?? "Categoria")
          : "Categoria",
      };
    })
    .sort(
      (a, b) =>
        a.inicio.localeCompare(b.inicio) ||
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    )
    .map(({ id, nome, horario, categoria }) => ({
      id,
      nome,
      horario,
      categoria,
    }));

  return {
    ok: true,
    hoje,
    ativos: ativos.length,
    emDia: prazo.emDia,
    atrasados: prazo.atrasados,
    semPagamento: prazo.semPagamento,
    marcacoesHoje: aulas.length,
    avaliacoesAtencao: avaliacoes.alunos.length,
    categoriasAtivas: ((categorias.data ?? []) as CategoryRow[]).filter(
      (categoria) => categoria.active
    ).length,
    planosAVenda: (
      (planos.data ?? []) as (PlanRow & { price_cents: number })[]
    ).filter((plano) => plano.active && plano.price_cents > 0).length,
    aulas,
    avaliacoes: avaliacoes.alunos.slice(0, 5).map((aluno) => ({
      id: aluno.id,
      nome: aluno.nome,
      rotulo: aluno.rotulo,
    })),
  };
}
