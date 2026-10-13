"use server";

import { revalidatePath } from "next/cache";
import { aulaJaComecou, diaDaSemana, mensagemDoBanco } from "@/lib/agenda";
import { requireAdmin } from "@/lib/auth";
import {
  analisarPagamentos,
  type Lancamento,
  type TipoPlano,
} from "@/lib/pagamento-situacao";
import { createSessionClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  hojeSaoPaulo,
  marcacaoSchema,
  planosCadastro,
  type FormState,
} from "@/lib/validacao";

const FALHA = "Não foi possível salvar a marcação. Tente de novo.";

function atualizarListas() {
  revalidatePath("/painel/agenda");
  revalidatePath("/painel/pagamentos");
  revalidatePath("/painel/alunos", "layout");
}

const tipos = new Set<string>(planosCadastro.map((plano) => plano.value));

function comoTipo(kind: string): TipoPlano | null {
  return tipos.has(kind) ? (kind as TipoPlano) : null;
}

export async function marcarAluno(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = marcacaoSchema.safeParse({
    aluno: formData.get("aluno"),
    horario: formData.get("horario"),
    data: formData.get("data"),
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const horario = await supabase
    .from("class_schedules")
    .select("id, weekday, starts_at, active, capacity")
    .eq("id", parsed.data.horario)
    .maybeSingle();

  if (horario.error || !horario.data) {
    return { success: false, message: "Horário não encontrado." };
  }

  if (!horario.data.active) {
    return {
      success: false,
      message: "Horário inativo não aceita marcação nova.",
    };
  }

  if (horario.data.weekday !== diaDaSemana(parsed.data.data)) {
    return {
      success: false,
      message: "Este horário não ocorre nesse dia da semana.",
    };
  }

  if (aulaJaComecou(parsed.data.data, horario.data.starts_at)) {
    return {
      success: false,
      message:
        parsed.data.data < hojeSaoPaulo()
          ? "Não é possível agendar em data passada."
          : "Não é possível agendar depois do início da aula.",
    };
  }

  const ocupadas = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", parsed.data.horario)
    .eq("appointment_date", parsed.data.data)
    .eq("status", "marcado");

  if (ocupadas.error) return { success: false, message: FALHA };
  if ((ocupadas.count ?? 0) >= horario.data.capacity) {
    return { success: false, message: "Não há vaga." };
  }

  const credito = await creditoAtivo(parsed.data.aluno);
  const { error } = await supabase.rpc("book_appointment", {
    p_student_id: parsed.data.aluno,
    p_schedule_id: parsed.data.horario,
    p_appointment_date: parsed.data.data,
    p_consumed_payment_id: credito,
  });

  if (error) return { success: false, message: mensagemDoBanco(error.message) };

  atualizarListas();
  return { success: true, message: "Aluno marcado." };
}

async function creditoAtivo(alunoId: string) {
  const supabase = await createSessionClient();
  const [pagamentos, planos, usos] = await Promise.all([
    supabase
      .from("payments")
      .select("id, plan_id, paid_on, kind, reverses_payment_id, created_at")
      .eq("student_id", alunoId),
    supabase.from("plans").select("id, kind"),
    supabase
      .from("appointments")
      .select("consumed_payment_id")
      .eq("status", "marcado"),
  ]);

  if (pagamentos.error || planos.error) return null;

  const kinds = new Map(
    ((planos.data ?? []) as { id: string; kind: string }[]).map((plano) => [
      plano.id,
      plano.kind,
    ])
  );
  const lancamentos: Lancamento[] = [];

  for (const pagamento of pagamentos.data ?? []) {
    const tipo = comoTipo(kinds.get(pagamento.plan_id) ?? "");
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

  const usados = new Set<string>();
  if (!usos.error) {
    for (const uso of usos.data ?? []) {
      if (uso.consumed_payment_id) usados.add(uso.consumed_payment_id);
    }
  }

  return analisarPagamentos(lancamentos, hojeSaoPaulo(), usados)
    .creditoAvulsoId;
}

export async function cancelarMarcacao(id: string): Promise<FormState> {
  await requireAdmin();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return { success: false, message: "Agendamento não encontrado." };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: id,
  });

  if (error) return { success: false, message: mensagemDoBanco(error.message) };

  atualizarListas();
  return { success: true, message: "Marcação cancelada." };
}
