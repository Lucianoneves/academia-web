"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { ATIVAR_SEM_PRECO } from "@/lib/plano-escolha";
import { clienteStripeTeste } from "@/lib/stripe-teste";
import {
  fieldErrors,
  planosCadastro,
  precoPlanoSchema,
  type FormState,
} from "@/lib/validacao";

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
  const atual = await supabase
    .from("plans")
    .select("kind, price_cents, stripe_product_id, stripe_price_id")
    .eq("id", id)
    .maybeSingle();

  if (atual.error || !atual.data) {
    return { success: false, message: "Plano não encontrado." };
  }

  const preco = parsed.data.preco;
  const igual =
    preco === atual.data.price_cents &&
    (preco === 0 || Boolean(atual.data.stripe_price_id));

  if (igual) {
    return { success: true, message: "Preço salvo." };
  }

  let produtoId = atual.data.stripe_product_id;
  let precoId: string | null = preco > 0 ? atual.data.stripe_price_id : null;

  if (preco > 0) {
    const stripe = clienteStripeTeste();
    if (!stripe) {
      precoId = null;
    } else {
      const nome =
        planosCadastro.find((item) => item.value === atual.data?.kind)?.label ??
        "Plano";

      try {
        if (!produtoId) {
          const produto = await stripe.products.create({
            name: nome,
            metadata: { plan_id: id, kind: atual.data.kind },
          });
          produtoId = produto.id;
          const gravado = await supabase
            .from("plans")
            .update({ stripe_product_id: produtoId })
            .eq("id", id)
            .select("id");
          if (gravado.error || !gravado.data?.length) {
            return { success: false, message: FALHA };
          }
        }

        const price = await stripe.prices.create({
          currency: "brl",
          unit_amount: preco,
          product: produtoId,
          metadata: { plan_id: id },
        });
        precoId = price.id;
      } catch {
        return {
          success: false,
          message:
            "Não foi possível criar o preço na Stripe. O preço do plano não mudou.",
        };
      }
    }
  }

  const { data, error } = await supabase
    .from("plans")
    .update({
      price_cents: preco,
      stripe_product_id: produtoId,
      stripe_price_id: precoId,
    })
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
