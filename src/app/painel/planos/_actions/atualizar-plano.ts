"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { ATIVAR_SEM_PRECO } from "@/lib/plano-escolha";
import { fieldErrors, precoPlanoSchema, type FormState } from "@/lib/validacao";

const FALHA = "Não foi possível salvar o plano. Tente de novo.";

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function atualizarListas() {
  revalidatePath("/painel/planos");
  revalidatePath("/painel/pagamentos");
  revalidatePath("/painel/alunos/novo");
  revalidatePath("/painel/alunos/[id]", "page");
}

export async function salvarPreco(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!idValido(id)) {
    return { success: false, message: "Plano não encontrado." };
  }

  const parsed = precoPlanoSchema.safeParse({
    preco: formData.get("preco"),
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("plans")
    .update({ price_cents: parsed.data.preco })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    return { success: false, message: FALHA };
  }

  atualizarListas();

  return { success: true, message: "Preço salvo." };
}

export async function alterarDisponibilidade(
  id: string,
  ativo: boolean
): Promise<FormState> {
  await requireAdmin();

  if (!idValido(id)) {
    return { success: false, message: "Plano não encontrado." };
  }

  const supabase = await createSessionClient();
  const plano = await supabase
    .from("plans")
    .select("price_cents")
    .eq("id", id)
    .maybeSingle();

  if (plano.error || !plano.data) {
    return { success: false, message: "Plano não encontrado." };
  }

  if (ativo && plano.data.price_cents <= 0) {
    return { success: false, message: ATIVAR_SEM_PRECO };
  }

  const { data, error } = await supabase
    .from("plans")
    .update({ active: ativo })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    return { success: false, message: FALHA };
  }

  atualizarListas();

  return {
    success: true,
    message: ativo ? "Plano ativado." : "Plano inativado.",
  };
}
