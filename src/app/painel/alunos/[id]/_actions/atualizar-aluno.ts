"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { clienteStripeTeste } from "@/lib/stripe-teste";
import { createSessionClient } from "@/lib/supabase/server";
import {
  alunoEdicaoSchema,
  fieldErrors,
  type FormState,
} from "@/lib/validacao";

const FALHA = "Não foi possível salvar o aluno. Tente de novo.";

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

export async function atualizarAluno(
  id: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(id)) {
    return { success: false, message: "Aluno não encontrado." };
  }

  const parsed = alunoEdicaoSchema.safeParse({
    nome: formData.get("nome"),
    nascimento: formData.get("nascimento"),
    telefone: formData.get("telefone"),
    peso: formData.get("peso"),
    altura: formData.get("altura") ?? "",
    plano: formData.get("plano") ?? "",
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const atual = await supabase
    .from("students")
    .select("stripe_customer_id")
    .eq("id", id)
    .maybeSingle();

  if (atual.error) {
    return { success: false, message: FALHA };
  }

  if (!atual.data) {
    return { success: false, message: "Aluno não encontrado." };
  }

  const { data, error } = await supabase
    .from("students")
    .update({
      name: parsed.data.nome,
      birth_date: parsed.data.nascimento,
      phone: parsed.data.telefone,
      weight_kg: parsed.data.peso,
      height_cm: parsed.data.altura,
      chosen_plan: parsed.data.plano,
      email: parsed.data.email,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      const mensagem = error.message.toLowerCase();
      if (mensagem.includes("students_email")) {
        return {
          success: false,
          errors: { email: ["Este e-mail já está cadastrado."] },
        };
      }

      return {
        success: false,
        errors: { telefone: ["Este telefone já está cadastrado."] },
      };
    }

    if (error.message.includes("data de nascimento")) {
      return {
        success: false,
        errors: {
          nascimento: ["A data de nascimento deve ser anterior a hoje."],
        },
      };
    }

    return { success: false, message: FALHA };
  }

  if (!data?.length) {
    return { success: false, message: "Aluno não encontrado." };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/alunos");
  revalidatePath(`/painel/alunos/${id}`);
  revalidatePath("/painel/pagamentos");
  revalidatePath("/painel/pagamentos/[alunoId]", "page");

  const clienteId = atual.data.stripe_customer_id;
  if (!clienteId) {
    return { success: true, message: "Alterações salvas." };
  }

  const stripe = clienteStripeTeste();
  if (!stripe) {
    return {
      success: true,
      message: "Alterações salvas.",
      aviso:
        "O cliente na Stripe não foi atualizado. Salve de novo para tentar outra vez.",
    };
  }

  try {
    await stripe.customers.update(clienteId, {
      name: parsed.data.nome,
      phone: `+55${parsed.data.telefone}`,
      email: parsed.data.email ?? "",
    });
  } catch {
    return {
      success: true,
      message: "Alterações salvas.",
      aviso:
        "O cliente na Stripe não foi atualizado. Salve de novo para tentar outra vez.",
    };
  }

  return { success: true, message: "Alterações salvas." };
}

export async function alterarSituacao(
  id: string,
  ativar: boolean
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(id)) {
    return { success: false, message: "Aluno não encontrado." };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("students")
    .update({ active: ativar })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    return { success: false, message: FALHA };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/alunos");
  revalidatePath(`/painel/alunos/${id}`);
  revalidatePath("/painel/pagamentos");
  revalidatePath("/painel/pagamentos/[alunoId]", "page");

  return {
    success: true,
    message: ativar ? "Aluno reativado." : "Aluno inativado.",
  };
}
