"use server";

import { revalidatePath } from "next/cache";
import { mensagemDoBanco } from "@/lib/agenda";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { fieldErrors, horarioSchema, type FormState } from "@/lib/validacao";

const FALHA = "Não foi possível salvar o horário. Tente de novo.";

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function atualizarListas() {
  revalidatePath("/painel/horarios");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel/alunos", "layout");
}

function campos(formData: FormData) {
  return horarioSchema.safeParse({
    dia: formData.get("dia"),
    inicio: formData.get("inicio"),
    fim: formData.get("fim"),
    categoria: formData.get("categoria"),
    vagas: formData.get("vagas"),
  });
}

export async function criarHorario(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = campos(formData);

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.from("class_schedules").insert({
    weekday: parsed.data.dia,
    starts_at: parsed.data.inicio,
    ends_at: parsed.data.fim,
    category_id: parsed.data.categoria,
    capacity: parsed.data.vagas,
  });

  if (error) return { success: false, message: mensagemDoBanco(error.message) };

  atualizarListas();
  return { success: true, message: "Horário criado." };
}

export async function atualizarHorario(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!idValido(id)) {
    return { success: false, message: "Horário não encontrado." };
  }

  const parsed = campos(formData);

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("class_schedules")
    .update({
      weekday: parsed.data.dia,
      starts_at: parsed.data.inicio,
      ends_at: parsed.data.fim,
      category_id: parsed.data.categoria,
      capacity: parsed.data.vagas,
    })
    .eq("id", id)
    .select("id");

  if (error) return { success: false, message: mensagemDoBanco(error.message) };
  if (!data?.length) return { success: false, message: FALHA };

  atualizarListas();
  return { success: true, message: "Horário atualizado." };
}

export async function alterarHorarioAtivo(
  id: string,
  ativo: boolean
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(id)) {
    return { success: false, message: "Horário não encontrado." };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("class_schedules")
    .update({ active: ativo })
    .eq("id", id)
    .select("id");

  if (error) return { success: false, message: mensagemDoBanco(error.message) };
  if (!data?.length) return { success: false, message: FALHA };

  atualizarListas();
  return {
    success: true,
    message: ativo ? "Horário ativado." : "Horário inativado.",
  };
}
