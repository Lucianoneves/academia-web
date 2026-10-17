"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  marcacaoAvaliacaoSchema,
  type FormState,
} from "@/lib/validacao";

const FALHA = "Não foi possível salvar a marcação. Tente de novo.";
const SQL =
  "Aplique supabase/17_evaluation_appointments.sql no editor SQL do Supabase.";

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function tabelaAusente(codigo: string, texto: string) {
  return (
    codigo === "42P01" ||
    codigo === "PGRST205" ||
    texto.includes("evaluation_appointments")
  );
}

function mensagemBanco(codigo: string, texto: string) {
  const mensagem = texto.toLowerCase();

  if (tabelaAusente(codigo, mensagem)) return SQL;

  if (codigo === "23505" || mensagem.includes("evaluation_appointments_slot")) {
    return "Já existe uma marcação nesse dia e horário.";
  }

  if (mensagem.includes("passado")) {
    return "O dia da marcação não pode ser no passado.";
  }

  return FALHA;
}

function atualizar() {
  revalidatePath("/painel/avaliacoes");
  revalidatePath("/painel/alunos/[id]", "page");
  revalidatePath("/painel");
}

export async function marcarAvaliacao(
  alunoId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(alunoId)) {
    return { success: false, message: "Aluno não encontrado." };
  }

  const parsed = marcacaoAvaliacaoSchema.safeParse({
    dia: formData.get("dia"),
    hora: formData.get("hora"),
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

  const gravado = await supabase.from("evaluation_appointments").upsert(
    {
      student_id: alunoId,
      scheduled_on: parsed.data.dia,
      starts_at: parsed.data.hora,
    },
    { onConflict: "student_id" }
  );

  if (gravado.error) {
    return {
      success: false,
      message: mensagemBanco(gravado.error.code ?? "", gravado.error.message),
    };
  }

  atualizar();
  revalidatePath(`/painel/alunos/${alunoId}`);

  return { success: true, message: "Marcação salva." };
}

export async function limparMarcacaoAvaliacao(
  alunoId: string,
  _previous: FormState,
  _formData: FormData
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(alunoId)) {
    return { success: false, message: "Aluno não encontrado." };
  }

  const supabase = await createSessionClient();
  const apagado = await supabase
    .from("evaluation_appointments")
    .delete()
    .eq("student_id", alunoId);

  if (apagado.error) {
    return {
      success: false,
      message: mensagemBanco(apagado.error.code ?? "", apagado.error.message),
    };
  }

  atualizar();
  revalidatePath(`/painel/alunos/${alunoId}`);

  return { success: true, message: "Marcação removida." };
}
