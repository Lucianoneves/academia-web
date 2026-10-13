import "server-only";

import {
  aulaJaComecou,
  diaDaSemana,
  horaCurta,
  nomeDia,
  rotuloCategoria,
} from "@/lib/agenda";
import { requireAdmin } from "@/lib/auth";
import {
  analisarPagamentos,
  formatarDataIso,
  rotuloSituacao,
  type Lancamento,
  type TipoPlano,
} from "@/lib/pagamento-situacao";
import { createSessionClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, planosCadastro } from "@/lib/validacao";

export type PessoaDia = {
  id: string;
  nome: string;
  situacao: "Marcado" | "Cancelado";
  podeCancelar: boolean;
};

export type SlotDia = {
  id: string;
  titulo: string;
  categoria: string;
  vagas: number;
  ocupadas: number;
  aceitaNova: boolean;
  aviso: string | null;
  pessoas: PessoaDia[];
};

export type AlunoAgenda = {
  id: string;
  nome: string;
  pagamento: string;
};

export type MarcacaoFicha = {
  id: string;
  quando: string;
  categoria: string;
  situacao: "Marcado" | "Cancelado";
};

type ScheduleRow = {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  category_id: string;
  capacity: number;
  active: boolean;
};

type AppointmentRow = {
  id: string;
  student_id: string;
  schedule_id: string;
  appointment_date: string;
  status: string;
  consumed_payment_id: string | null;
  created_at: string;
};

type StudentRow = { id: string; name: string; active: boolean };
type CategoryRow = { id: string; name: string };
type PaymentRow = {
  id: string;
  student_id: string;
  plan_id: string;
  paid_on: string;
  kind: string;
  reverses_payment_id: string | null;
  created_at: string;
};
type PlanRow = { id: string; kind: string };

const tipos = new Set<string>(planosCadastro.map((plano) => plano.value));

function comoTipo(kind: string): TipoPlano | null {
  return tipos.has(kind) ? (kind as TipoPlano) : null;
}

function pessoasDe(
  marcacoes: AppointmentRow[],
  alunos: Map<string, StudentRow>,
  inicio: string,
  data: string
) {
  return marcacoes
    .map((marcacao) => {
      const aluno = alunos.get(marcacao.student_id);
      const marcado = marcacao.status === "marcado";
      return {
        id: marcacao.id,
        nome: aluno?.name ?? "Aluno",
        situacao: marcado ? ("Marcado" as const) : ("Cancelado" as const),
        podeCancelar: marcado && !aulaJaComecou(data, inicio),
      };
    })
    .sort((a, b) => {
      if (a.situacao !== b.situacao) return a.situacao === "Marcado" ? -1 : 1;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
}

export async function agendaDoDia(
  data: string
): Promise<
  | { ok: true; data: string; slots: SlotDia[]; alunos: AlunoAgenda[] }
  | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [horarios, categorias, marcacoes, alunos, planos, pagamentos, usos] =
    await Promise.all([
      supabase
        .from("class_schedules")
        .select(
          "id, weekday, starts_at, ends_at, category_id, capacity, active"
        ),
      supabase.from("class_categories").select("id, name"),
      supabase
        .from("appointments")
        .select(
          "id, student_id, schedule_id, appointment_date, status, consumed_payment_id, created_at"
        )
        .eq("appointment_date", data),
      supabase.from("students").select("id, name, active"),
      supabase.from("plans").select("id, kind"),
      supabase
        .from("payments")
        .select(
          "id, student_id, plan_id, paid_on, kind, reverses_payment_id, created_at"
        ),
      supabase
        .from("appointments")
        .select("consumed_payment_id")
        .eq("status", "marcado"),
    ]);

  if (
    horarios.error ||
    categorias.error ||
    marcacoes.error ||
    alunos.error ||
    planos.error ||
    pagamentos.error
  ) {
    return { ok: false, erro: "Não foi possível carregar a agenda." };
  }

  const nomesCategoria = new Map(
    ((categorias.data ?? []) as CategoryRow[]).map((categoria) => [
      categoria.id,
      rotuloCategoria(categoria.name),
    ])
  );
  const porAluno = new Map(
    ((alunos.data ?? []) as StudentRow[]).map((aluno) => [aluno.id, aluno])
  );
  const grade = (horarios.data ?? []) as ScheduleRow[];
  const doDia = (marcacoes.data ?? []) as AppointmentRow[];
  const dia = diaDaSemana(data);
  const creditosUsados = new Set<string>();

  if (!usos.error) {
    for (const uso of usos.data ?? []) {
      if (uso.consumed_payment_id) creditosUsados.add(uso.consumed_payment_id);
    }
  }

  const planosPorId = new Map(
    ((planos.data ?? []) as PlanRow[]).map((plano) => [plano.id, plano.kind])
  );
  const pagamentosPorAluno = new Map<string, PaymentRow[]>();

  for (const pagamento of (pagamentos.data ?? []) as PaymentRow[]) {
    const lista = pagamentosPorAluno.get(pagamento.student_id) ?? [];
    lista.push(pagamento);
    pagamentosPorAluno.set(pagamento.student_id, lista);
  }

  const hoje = hojeSaoPaulo();
  const alunosAtivos: AlunoAgenda[] = ((alunos.data ?? []) as StudentRow[])
    .filter((aluno) => aluno.active)
    .map((aluno) => {
      const lancamentos: Lancamento[] = [];

      for (const pagamento of pagamentosPorAluno.get(aluno.id) ?? []) {
        const tipo = comoTipo(planosPorId.get(pagamento.plan_id) ?? "");
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

      const analise = analisarPagamentos(lancamentos, hoje, creditosUsados);
      return {
        id: aluno.id,
        nome: aluno.name,
        pagamento: rotuloSituacao(analise.situacao),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const slots: SlotDia[] = [];

  for (const horario of grade) {
    const marcacoesHorario = doDia.filter(
      (marcacao) => marcacao.schedule_id === horario.id
    );
    const ocorre = horario.weekday === dia;
    if (!ocorre && marcacoesHorario.length === 0) continue;

    const ocupadas = marcacoesHorario.filter(
      (marcacao) => marcacao.status === "marcado"
    ).length;
    const comecou = aulaJaComecou(data, horario.starts_at);
    let aviso: string | null = null;

    if (!ocorre) {
      aviso = `Este horário agora é ${nomeDia(horario.weekday)}. Nesta data não entra gente nova.`;
    } else if (!horario.active) {
      aviso = "Horário inativo. Não entra gente nova.";
    } else if (comecou) {
      aviso = "Esta aula já começou.";
    } else if (ocupadas >= horario.capacity) {
      aviso = "Não há vaga.";
    }

    const titulo = ocorre
      ? `${horaCurta(horario.starts_at)}–${horaCurta(horario.ends_at)}`
      : `${nomeDia(horario.weekday)} · ${horaCurta(horario.starts_at)}–${horaCurta(horario.ends_at)}`;

    slots.push({
      id: horario.id,
      titulo,
      categoria: nomesCategoria.get(horario.category_id) ?? "Categoria",
      vagas: horario.capacity,
      ocupadas,
      aceitaNova:
        ocorre && horario.active && !comecou && ocupadas < horario.capacity,
      aviso,
      pessoas: pessoasDe(marcacoesHorario, porAluno, horario.starts_at, data),
    });
  }

  slots.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));

  return { ok: true, data, slots, alunos: alunosAtivos };
}

export async function marcacoesDoAluno(
  alunoId: string
): Promise<
  { ok: true; marcacoes: MarcacaoFicha[] } | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [marcacoes, horarios, categorias] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, schedule_id, appointment_date, status, created_at")
      .eq("student_id", alunoId),
    supabase
      .from("class_schedules")
      .select("id, starts_at, ends_at, category_id"),
    supabase.from("class_categories").select("id, name"),
  ]);

  if (marcacoes.error || horarios.error || categorias.error) {
    return { ok: false, erro: "Não foi possível carregar a agenda." };
  }

  const grade = new Map(
    (
      (horarios.data ?? []) as {
        id: string;
        starts_at: string;
        ends_at: string;
        category_id: string;
      }[]
    ).map((horario) => [horario.id, horario])
  );
  const nomes = new Map(
    ((categorias.data ?? []) as CategoryRow[]).map((categoria) => [
      categoria.id,
      rotuloCategoria(categoria.name),
    ])
  );

  const lista = (
    (marcacoes.data ?? []) as {
      id: string;
      schedule_id: string;
      appointment_date: string;
      status: string;
      created_at: string;
    }[]
  )
    .map((marcacao) => {
      const horario = grade.get(marcacao.schedule_id);
      const inicio = horario ? horaCurta(horario.starts_at) : "";
      const fim = horario ? horaCurta(horario.ends_at) : "";
      return {
        id: marcacao.id,
        quando: horario
          ? `${formatarDataIso(marcacao.appointment_date.slice(0, 10))} · ${inicio}–${fim}`
          : formatarDataIso(marcacao.appointment_date.slice(0, 10)),
        categoria: horario
          ? (nomes.get(horario.category_id) ?? "Categoria")
          : "Categoria",
        situacao:
          marcacao.status === "marcado"
            ? ("Marcado" as const)
            : ("Cancelado" as const),
        data: marcacao.appointment_date,
        inicio: horario?.starts_at ?? "",
      };
    })
    .sort((a, b) => {
      const data = b.data.localeCompare(a.data);
      if (data !== 0) return data;
      return b.inicio.localeCompare(a.inicio);
    })
    .map(({ id, quando, categoria, situacao }) => ({
      id,
      quando,
      categoria,
      situacao,
    }));

  return { ok: true, marcacoes: lista };
}
