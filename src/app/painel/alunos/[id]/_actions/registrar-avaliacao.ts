"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { avaliacaoSchema, fieldErrors, type FormState } from "@/lib/validacao";

const FALHA = "Não foi possível registrar a avaliação. Tente de novo.";

function revalidar(alunoId: string) {
  revalidatePath("/painel/avaliacoes");
  revalidatePath(`/painel/alunos/${alunoId}`);
  revalidatePath("/painel/alunos/[id]", "page");
  revalidatePath("/painel/agenda");
}

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function mensagemBanco(codigo: string, texto: string) {
  const mensagem = texto.toLowerCase();

  if (
    codigo === "23505" ||
    mensagem.includes("medical_evaluations_same_record")
  ) {
    return "Já existe uma avaliação nesta data com as mesmas observações.";
  }

  if (mensagem.includes("futura")) {
    return "A data da avaliação não pode ser futura.";
  }

  return FALHA;
}

export async function registrarAvaliacao(
  alunoId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(alunoId)) {
    return { success: false, message: "Aluno não encontrado." };
  }

  const parsed = avaliacaoSchema.safeParse({
    data: formData.get("data"),
    observacoes: formData.get("observacoes"),
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const aluno = await supabase
    .from("students")
    .select("id")
    .eq("id", alunoId)
    .maybeSingle();

  if (aluno.error) return { success: false, message: FALHA };
  if (!aluno.data) return { success: false, message: "Aluno não encontrado." };

  const gravado = await supabase.from("medical_evaluations").insert({
    student_id: alunoId,
    evaluated_on: parsed.data.data,
    notes: parsed.data.observacoes,
  });

  if (gravado.error) {
    return {
      success: false,
      message: mensagemBanco(gravado.error.code ?? "", gravado.error.message),
    };
  }

  const restricoes = await supabase
    .from("students")
    .update({ medical_restrictions: parsed.data.observacoes })
    .eq("id", alunoId)
    .select("id");

  if (restricoes.error || !restricoes.data?.length) {
    revalidar(alunoId);
    return {
      success: false,
      message:
        "Avaliação registrada, mas as restrições não foram atualizadas. Tente de novo.",
    };
  }

  const limpa = await supabase
    .from("evaluation_appointments")
    .delete()
    .eq("student_id", alunoId);

  if (
    limpa.error &&
    limpa.error.code !== "42P01" &&
    limpa.error.code !== "PGRST205" &&
    !limpa.error.message.includes("evaluation_appointments")
  ) {
    revalidar(alunoId);
    return {
      success: false,
      message:
        "Avaliação registrada, mas a marcação não foi removida. Tente de novo.",
    };
  }

  revalidar(alunoId);

  return { success: true, message: "Avaliação registrada." };
}
