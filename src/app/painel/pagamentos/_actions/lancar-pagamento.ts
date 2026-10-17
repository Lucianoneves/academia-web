"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  hojeSaoPaulo,
  lancamentoSchema,
  type FormState,
} from "@/lib/validacao";
import { clienteStripeTeste } from "@/lib/stripe-teste";

const FALHA = "Não foi possível salvar o pagamento. Tente de novo.";
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
      const reembolso = await stripe.refunds.create({ payment_intent: intent });
      reembolsoId = reembolso.id;
    } catch {
      const lista = await stripe.refunds.list({
        payment_intent: intent,
        limit: 1,
      });
      reembolsoId = lista.data[0]?.id ?? null;
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
    paid_on: hojeSaoPaulo(),
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
