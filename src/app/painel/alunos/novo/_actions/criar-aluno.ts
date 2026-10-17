"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PLANO_FORA_DE_VENDA } from "@/lib/plano-escolha";
import { planoEstaAVenda } from "@/lib/plano-venda";
import { alunoSchema, fieldErrors, type FormState } from "@/lib/validacao";

const FALHA = "Não foi possível salvar o aluno. Tente de novo.";
let gravacao = 0;

export async function criarAluno(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = alunoSchema.safeParse({
    nome: formData.get("nome"),
    nascimento: formData.get("nascimento"),
    telefone: formData.get("telefone"),
    peso: formData.get("peso"),
    altura: formData.get("altura"),
    plano: formData.get("plano") ?? "",
    restricoes: formData.get("restricoes") ?? "",
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const venda = await planoEstaAVenda(parsed.data.plano);
  if (!venda.ok) return { success: false, message: FALHA };
  if (!venda.venda) {
    return {
      success: false,
      errors: { plano: [PLANO_FORA_DE_VENDA] },
    };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.from("students").insert({
    name: parsed.data.nome,
    birth_date: parsed.data.nascimento,
    phone: parsed.data.telefone,
    weight_kg: parsed.data.peso,
    height_cm: parsed.data.altura,
    chosen_plan: parsed.data.plano,
    medical_restrictions: parsed.data.restricoes,
  });

  if (error) {
    if (error.code === "23505") {
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

  revalidatePath("/painel");
  revalidatePath("/painel/alunos");
  revalidatePath("/painel/pagamentos");

  return {
    success: true,
    message: "Aluno cadastrado. Você pode incluir outro.",
    stamp: ++gravacao,
  };
}
