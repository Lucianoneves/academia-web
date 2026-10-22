"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import {
  diaSaoPauloUnix,
  fieldErrors,
  hojeSaoPaulo,
  lancamentoSchema,
  type FormState,
} from "@/lib/validacao";
import { aulaJaComecou } from "@/lib/agenda";
import { reembolsoDaCobranca } from "@/lib/stripe-reembolso";
import { clienteStripeTeste } from "@/lib/stripe-teste";

const FALHA = "Não foi possível salvar o pagamento. Tente de novo.";
const AGUARDE_CANCELAMENTO =
  "Cancele a aula que consumiu este crédito antes de estornar.";
let gravacao = 0;

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function atualizar(alunoId: string) {
  revalidatePath("/painel/pagamentos");
  revalidatePath("/painel/pagamentos/[alunoId]", "page");
  revalidatePath(`/painel/alunos/${alunoId}`);
  revalidatePath("/painel/alunos/[id]", "page");
}

function mensagemBanco(texto: string) {
  const mensagem = texto.toLowerCase();

  if (mensagem.includes("aluno inativo")) {
    return "Aluno inativo não recebe lançamento novo.";
  }

  if (mensagem.includes("sem preço") || mensagem.includes("plano inativo")) {
    return "Esse plano não está à venda.";
  }

  if (mensagem.includes("estorno") && mensagem.includes("futura")) {
    return "A data do estorno não pode ser futura.";
  }

  if (mensagem.includes("futura")) {
    return "A data do pagamento não pode ser futura.";
  }

  if (mensagem.includes("já foi estornado")) {
    return "Este recebimento já foi estornado.";
  }

  if (mensagem.includes("estorno")) {
    return "Não foi possível estornar este recebimento.";
  }

  return FALHA;
}

async function estornoBloqueadoPorAula(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  origem: { id: string; plan_id: string }
): Promise<FormState | null> {
  const plano = await supabase
    .from("plans")
    .select("kind")
    .eq("id", origem.plan_id)
    .maybeSingle();

  if (plano.error) return { success: false, message: FALHA };
  if (plano.data?.kind !== "avulso") return null;

  const usos = await supabase
    .from("appointments")
    .select("appointment_date, schedule_id")
    .eq("consumed_payment_id", origem.id)
    .eq("status", "marcado");

  if (usos.error) return { success: false, message: FALHA };
  if (!usos.data?.length) return null;

  const horarios = await supabase
    .from("class_schedules")
    .select("id, starts_at")
    .in(
      "id",
      usos.data.map((uso) => uso.schedule_id)
    );

  if (horarios.error) return { success: false, message: FALHA };

  const inicioPorId = new Map(
    (horarios.data ?? []).map((horario) => [horario.id, horario.starts_at])
  );
  const aguardando = usos.data.some((uso) => {
    const inicio = inicioPorId.get(uso.schedule_id);
    if (!inicio) return true;
    return !aulaJaComecou(String(uso.appointment_date).slice(0, 10), inicio);
  });

  if (!aguardando) return null;
  return { success: false, message: AGUARDE_CANCELAMENTO };
}

export async function lancarPagamento(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = lancamentoSchema.safeParse({
    aluno: formData.get("aluno"),
    plano: formData.get("plano"),
    valor: formData.get("valor"),
    data: formData.get("data"),
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const [aluno, plano] = await Promise.all([
    supabase
      .from("students")
      .select("id, active")
      .eq("id", parsed.data.aluno)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id, active, price_cents")
      .eq("id", parsed.data.plano)
      .maybeSingle(),
  ]);

  if (aluno.error || plano.error) {
    return { success: false, message: FALHA };
  }

  if (!aluno.data?.active) {
    return {
      success: false,
      errors: { aluno: ["Aluno inativo não recebe lançamento novo."] },
    };
  }

  if (!plano.data?.active || plano.data.price_cents <= 0) {
    return {
      success: false,
      errors: { plano: ["Esse plano não está à venda."] },
    };
  }

  const { error } = await supabase.from("payments").insert({
    student_id: parsed.data.aluno,
    plan_id: parsed.data.plano,
    amount_cents: parsed.data.valor,
    paid_on: parsed.data.data,
    method: "dinheiro",
    kind: "recebimento",
  });

  if (error) {
    return { success: false, message: mensagemBanco(error.message) };
  }

  atualizar(parsed.data.aluno);

  return {
    success: true,
    message: "Pagamento lançado.",
    stamp: ++gravacao,
  };
}

export async function estornarPagamento(id: string): Promise<FormState> {
  await requireAdmin();

  if (!idValido(id)) {
    return { success: false, message: "Lançamento não encontrado." };
  }

  const supabase = await createSessionClient();
  const origem = await supabase
    .from("payments")
    .select(
      "id, student_id, plan_id, amount_cents, kind, method, stripe_payment_intent_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (origem.error || !origem.data) {
    return { success: false, message: "Lançamento não encontrado." };
  }

  if (origem.data.kind !== "recebimento") {
    return {
      success: false,
      message: "Só é possível estornar um recebimento.",
    };
  }

  const bloqueio = await estornoBloqueadoPorAula(supabase, origem.data);
  if (bloqueio) return bloqueio;

  const existente = await supabase
    .from("payments")
    .select("id")
    .eq("reverses_payment_id", id)
    .maybeSingle();

  if (existente.error) {
    return { success: false, message: FALHA };
  }

  if (existente.data) {
    return { success: false, message: "Este recebimento já foi estornado." };
  }

  let reembolsoId: string | null = null;
  let pagoEm = hojeSaoPaulo();

  if (origem.data.method === "cartao") {
    const stripe = clienteStripeTeste();
    const intent = origem.data.stripe_payment_intent_id;
    if (!stripe || !intent) {
      return {
        success: false,
        message: "Não foi possível reembolsar esta cobrança no cartão.",
      };
    }

    try {
      const criado = await stripe.refunds.create({ payment_intent: intent });
      reembolsoId = criado.id;
      pagoEm = diaSaoPauloUnix(criado.created);
    } catch {
      try {
        const jaCriado = await reembolsoDaCobranca(stripe, intent);
        reembolsoId = jaCriado?.id ?? null;
        if (jaCriado) pagoEm = diaSaoPauloUnix(jaCriado.created);
      } catch {
        return {
          success: false,
          message: "Não foi possível reembolsar esta cobrança no cartão.",
        };
      }
    }

    if (!reembolsoId) {
      return {
        success: false,
        message: "Não foi possível reembolsar esta cobrança no cartão.",
      };
    }
  }

  const { error } = await supabase.from("payments").insert({
    student_id: origem.data.student_id,
    plan_id: origem.data.plan_id,
    amount_cents: origem.data.amount_cents,
    paid_on: pagoEm,
    method: origem.data.method === "cartao" ? "cartao" : "dinheiro",
    kind: "estorno",
    reverses_payment_id: origem.data.id,
    ...(reembolsoId ? { stripe_refund_id: reembolsoId } : {}),
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true, message: "Recebimento estornado." };
    }
    return { success: false, message: mensagemBanco(error.message) };
  }

  atualizar(origem.data.student_id);

  return { success: true, message: "Recebimento estornado." };
}
